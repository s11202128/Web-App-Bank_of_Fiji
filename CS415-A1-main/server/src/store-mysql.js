const { v4: uuid } = require("uuid");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { sendSms } = require("./services/smsService");
const {
  Customer,
  Account,
  Transaction,
  Bill,
  Loan,
  OtpVerification,
  Registration,
  Admin,
  LoginLog,
  NotificationLog,
} = require("./models");

let HIGH_VALUE_OTP_THRESHOLD = 10000;
const MIN_OTP_TRIGGER_AMOUNT = 5000;
const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 3;
const WITHHOLDING_TAX_RATE = 0.15;
const SAVINGS_INTEREST_RATE = 0.0325;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_MINUTES = 15;

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}-${uuid().slice(0, 8).toUpperCase()}`;
}

function makeSixDigitCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp || "")).digest("hex");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function validatePassword(password) {
  if (!password || String(password).length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
}

function validateEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email format");
  }
}

function validateMobile(mobile) {
  if (!/^\+?\d{7,15}$/.test(String(mobile || "").replace(/[\s\-]/g, ""))) {
    throw new Error("Invalid mobile number - use digits only, optionally starting with +");
  }
}

function validateNationalId(nationalId) {
  if (!nationalId || String(nationalId).trim().length < 4) {
    throw new Error("National ID / Passport is required");
  }
}

async function recordLoginAttempt({ userType, userId = null, email, success, failureReason = null, ipAddress = null, userAgent = null }) {
  return LoginLog.create({
    userType,
    userId,
    email: normalizeEmail(email),
    success: Boolean(success),
    failureReason,
    ipAddress,
    userAgent,
  });
}

function createRandom12DigitNumber() {
  let value = "";
  for (let i = 0; i < 12; i += 1) {
    value += Math.floor(Math.random() * 10);
  }
  return value;
}

async function generateRandomAccountNumber() {
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i += 1) {
    const accountNumber = createRandom12DigitNumber();
    const existing = await Account.findOne({ where: { accountNumber } });
    if (!existing) {
      return accountNumber;
    }
  }
  throw new Error("Unable to generate unique account number. Please try again.");
}

function parseScheduledAccountId(description) {
  const text = String(description || "");
  const match = text.match(/scheduled_account:(\d+)/i);
  return match ? Number(match[1]) : null;
}

// Get customer by ID
async function getCustomer(customerId) {
  return await Customer.findByPk(customerId);
}

// Get account by ID
async function getAccount(accountId) {
  return await Account.findByPk(accountId);
}

async function getAccountByNumber(accountNumber) {
  const normalized = String(accountNumber || "").trim();
  if (!normalized) {
    return null;
  }
  return await Account.findOne({ where: { accountNumber: normalized } });
}

async function addNotification(customerId, message, notificationType = "SMS_ALERT") {
  const customer = await getCustomer(customerId);
  if (!customer) {
    throw new Error("Customer not found");
  }

  let deliveryStatus = "queued";
  let providerMessageId = null;

  try {
    const smsResult = await sendSms({ to: customer.mobile, message: String(message || "") });
    deliveryStatus = smsResult.status || "queued";
    providerMessageId = smsResult.providerMessageId;
  } catch (error) {
    deliveryStatus = "failed";
    console.error(`SMS delivery failed for customer ${customerId}:`, error.message);
  }

  const row = await NotificationLog.create({
    userId: customer.id,
    phoneNumber: customer.mobile,
    message: String(message || ""),
    notificationType,
    deliveryStatus,
    providerMessageId,
  });

  return {
    id: row.id,
    userId: row.userId,
    phoneNumber: row.phoneNumber,
    message: row.message,
    notificationType: row.notificationType,
    deliveryStatus: row.deliveryStatus,
    timestamp: row.createdAt,
  };
}

function isAccountLocked(customer) {
  return customer?.lockedUntil && new Date(customer.lockedUntil).getTime() > Date.now();
}

function safeParseMetadata(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch (error) {
    return {};
  }
}

function getHighValueTransferThreshold() {
  return HIGH_VALUE_OTP_THRESHOLD;
}

function setHighValueTransferThreshold(value) {
  const threshold = Number(value);
  if (!Number.isFinite(threshold) || threshold < MIN_OTP_TRIGGER_AMOUNT) {
    throw new Error(`High-value transfer limit must be at least FJD ${MIN_OTP_TRIGGER_AMOUNT}`);
  }
  HIGH_VALUE_OTP_THRESHOLD = threshold;
  return HIGH_VALUE_OTP_THRESHOLD;
}

async function getNotificationLogs(limit = 200, userId = null) {
  const where = userId ? { userId: Number(userId) } : undefined;
  const rows = await NotificationLog.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: Number(limit) || 200,
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    phoneNumber: row.phoneNumber,
    message: row.message,
    notificationType: row.notificationType,
    deliveryStatus: row.deliveryStatus,
    providerMessageId: row.providerMessageId,
    timestamp: row.createdAt,
  }));
}

// Create a transaction in the database
async function createTransaction({ accountId, accountNumber, kind, amount, description, counterpartyAccountId, metadata = {} }) {
  const account = accountId ? await getAccount(accountId) : await getAccountByNumber(accountNumber);
  if (!account) {
    throw new Error("Account not found");
  }

  const signedAmount = kind === "debit" ? -Math.abs(amount) : Math.abs(amount);
  const newBalance = Number((parseFloat(account.balance) + signedAmount).toFixed(2));

  // Update account balance
  await account.update({ balance: newBalance });

  // Create transaction record
  const tx = await Transaction.create({
    accountId: account.id,
    accountNumber: account.accountNumber,
    type: kind,
    amount: Math.abs(amount),
    description,
    status: "completed",
    balanceAfter: newBalance,
  });

  return {
    id: tx.id,
    accountId: account.id,
    accountNumber: account.accountNumber,
    kind,
    amount: Math.abs(amount),
    signedAmount,
    description,
    counterpartyAccountId: counterpartyAccountId || null,
    metadata,
    createdAt: tx.createdAt,
  };
}

// Get all transactions for an account
async function getAccountTransactions(accountIdOrNumber) {
  const numericId = Number(accountIdOrNumber);
  const account = Number.isFinite(numericId) && numericId > 0
    ? await getAccount(numericId)
    : await getAccountByNumber(accountIdOrNumber);

  if (!account) {
    throw new Error("Account not found");
  }

  const transactions = await Transaction.findAll({
    where: { accountNumber: account.accountNumber },
    order: [["createdAt", "DESC"]],
  });
  return transactions;
}

async function resolveDestinationAccountId(payload) {
  const rawToAccountId = Number(payload?.toAccountId);
  if (Number.isFinite(rawToAccountId) && rawToAccountId > 0) {
    return rawToAccountId;
  }

  const accountNumber = String(payload?.toAccountNumber || "").trim();
  if (!accountNumber) {
    throw new Error("toAccountId or toAccountNumber is required");
  }

  const destination = await Account.findOne({ where: { accountNumber } });
  if (!destination) {
    throw new Error("Destination account not found");
  }

  return destination.id;
}

// Perform a transfer between two accounts
async function transfer({ fromAccountId, toAccountId, amount, description }) {
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const fromAccount = await getAccount(fromAccountId);
  const toAccount = await getAccount(toAccountId);

  if (!fromAccount || !toAccount) {
    throw new Error("Both accounts must exist");
  }
  if (["frozen", "suspended", "closed"].includes(String(fromAccount.status || "").toLowerCase())) {
    throw new Error("Source account is not available for transfers");
  }
  if (["frozen", "suspended", "closed"].includes(String(toAccount.status || "").toLowerCase())) {
    throw new Error("Destination account is not available for transfers");
  }
  if (fromAccount.id === toAccount.id) {
    throw new Error("Transfer accounts must be different");
  }
  if (parseFloat(fromAccount.balance) < amount) {
    throw new Error("Insufficient funds");
  }

  const debitTx = await createTransaction({
    accountId: fromAccountId,
    kind: "debit",
    amount,
    description: description || "Transfer sent",
    counterpartyAccountId: toAccountId,
  });

  const creditTx = await createTransaction({
    accountId: toAccountId,
    kind: "credit",
    amount,
    description: description || "Transfer received",
    counterpartyAccountId: fromAccountId,
  });

  const fromCustomer = await getCustomer(fromAccount.customerId);
  const toCustomer = await getCustomer(toAccount.customerId);

  if (toCustomer) {
    await addNotification(toCustomer.id, `You received FJD ${amount.toFixed(2)} into account ${toAccount.id}.`, "MONEY_RECEIVED");
  }
  if (fromCustomer) {
    await addNotification(fromCustomer.id, `Transfer of FJD ${amount.toFixed(2)} from account ${fromAccount.id} processed.`, "TRANSFER_SENT");
  }

  return { debitTx, creditTx };
}

// Initiate a transfer (may require OTP)
async function initiateTransfer(payload) {
  const amount = Number(payload.amount || 0);
  const toAccountId = await resolveDestinationAccountId(payload);

  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  if (amount < HIGH_VALUE_OTP_THRESHOLD) {
    const result = await transfer({
      fromAccountId: payload.fromAccountId,
      toAccountId,
      amount,
      description: payload.description,
    });
    return {
      status: "completed",
      requiresOtp: false,
      transferId: null,
      otp: null,
      result,
    };
  } else {
    const transferId = makeId("TRF");
    const otp = makeSixDigitCode();
    const hashedOtp = hashOtp(otp);

    const sourceAccount = await getAccount(payload.fromAccountId);
    if (!sourceAccount) {
      throw new Error("Source account not found");
    }

    // Store pending transfer as OtpVerification record.
    await OtpVerification.create({
      referenceCode: transferId,
      customerId: sourceAccount.customerId,
      otp: hashedOtp,
      transactionType: "transfer",
      amount,
      metadata: JSON.stringify({
        fromAccountId: payload.fromAccountId,
        toAccountId,
        description: payload.description || "Transfer sent",
      }),
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      verified: false,
      attempts: 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
    });

    await addNotification(
      sourceAccount.customerId,
      `OTP ${otp} for high-value transfer of FJD ${amount.toFixed(2)} from account ${sourceAccount.id}.`,
      "OTP_VERIFICATION"
    );

    return {
      status: "pending_verification",
      requiresOtp: true,
      transferId,
      expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
      attemptsRemaining: OTP_MAX_ATTEMPTS,
    };
  }
}

// Verify and complete a transfer using OTP
async function verifyTransfer({ transferId, otp }) {
  const pending = await OtpVerification.findOne({ where: { referenceCode: transferId, transactionType: "transfer" } });
  if (!pending) {
    throw new Error("Pending transfer not found");
  }
  if (pending.verified) {
    throw new Error("Transfer already verified");
  }
  if (new Date(pending.expiresAt).getTime() < Date.now()) {
    throw new Error("OTP has expired");
  }
  if (Number(pending.attempts || 0) >= Number(pending.maxAttempts || OTP_MAX_ATTEMPTS)) {
    throw new Error("OTP attempts exceeded");
  }

  const submittedHash = hashOtp(String(otp || "").trim());
  if (pending.otp !== submittedHash) {
    const nextAttempts = Number(pending.attempts || 0) + 1;
    await pending.update({
      attempts: nextAttempts,
      lastAttemptAt: new Date(),
    });

    const remaining = Math.max(Number(pending.maxAttempts || OTP_MAX_ATTEMPTS) - nextAttempts, 0);
    if (remaining <= 0) {
      throw new Error("OTP attempts exceeded");
    }
    throw new Error(`Invalid OTP. ${remaining} attempt(s) remaining.`);
  }

  const metadata = safeParseMetadata(pending.metadata);
  const result = await transfer({
    fromAccountId: metadata.fromAccountId,
    toAccountId: metadata.toAccountId,
    amount: Number(pending.amount),
    description: metadata.description,
  });

  await pending.update({ verified: true, attempts: Number(pending.attempts || 0) + 1, lastAttemptAt: new Date() });
  return { status: "completed", transferId: pending.referenceCode, result };
}

// Post a bill payment
async function postBillPayment({ accountId, payee, amount, mode, scheduledDate }) {
  const account = await getAccount(accountId);
  if (!account) {
    throw new Error("Account not found");
  }
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }
  if (["frozen", "suspended", "closed"].includes(String(account.status || "").toLowerCase())) {
    throw new Error("Selected account is not available for bill payments");
  }

  await createTransaction({
    accountId,
    kind: "debit",
    amount,
    description: `Bill payment to ${payee}`,
    metadata: { mode },
  });

  const payment = await Bill.create({
    customerId: account.customerId,
    billType: payee,
    amount,
    status: "paid",
    description: `account:${accountId};mode:${mode}`,
    dueDate: scheduledDate || null,
  });

  const paymentType = /credit\s*card/i.test(String(payee || "")) ? "CREDIT_CARD_PAYMENT" : "BILL_PAYMENT";
  await addNotification(account.customerId, `Bill payment of FJD ${amount.toFixed(2)} to ${payee} processed.`, paymentType);
  return {
    id: payment.id,
    accountId,
    payee,
    amount,
    mode,
    status: "processed",
    createdAt: payment.createdAt,
  };
}

// Schedule a bill payment
async function scheduleBillPayment({ accountId, payee, amount, scheduledDate }) {
  const account = await getAccount(accountId);
  if (!account) {
    throw new Error("Account not found");
  }

  const bill = await Bill.create({
    customerId: account.customerId,
    billType: payee,
    amount,
    status: "scheduled",
    dueDate: new Date(scheduledDate),
    description: `scheduled_account:${accountId}`,
  });

  return {
    id: bill.id,
    accountId,
    payee,
    amount,
    scheduledDate,
    status: "scheduled",
    createdAt: bill.createdAt,
  };
}

// Run a scheduled bill payment
async function runScheduledPayment(id) {
  const scheduled = await Bill.findByPk(id);
  if (!scheduled) {
    throw new Error("Scheduled payment not found");
  }
  if (scheduled.status === "paid") {
    throw new Error("Scheduled payment already processed");
  }

  const preferredAccountId = parseScheduledAccountId(scheduled.description);
  let account = null;
  if (preferredAccountId) {
    account = await Account.findByPk(preferredAccountId);
  }
  if (!account) {
    // Backward compatibility for older scheduled rows without account tracking.
    account = await Account.findOne({
      where: { customerId: scheduled.customerId },
    });
  }

  if (!account) {
    throw new Error("Account not found");
  }

  const payment = await postBillPayment({
    accountId: account.id,
    payee: scheduled.billType,
    amount: scheduled.amount,
    mode: "scheduled",
    scheduledDate: scheduled.dueDate,
  });

  await scheduled.update({ status: "paid" });
  return { scheduled, payment };
}

// Generate statement for an account
async function generateStatement(accountRef, from, to) {
  const numericId = Number(accountRef);
  const account = Number.isFinite(numericId) && numericId > 0
    ? await getAccount(numericId)
    : await getAccountByNumber(accountRef);
  if (!account) {
    throw new Error("Account not found");
  }

  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  if (toDate) {
    toDate.setHours(23, 59, 59, 999);
  }

  const where = { accountNumber: account.accountNumber };
  if (fromDate || toDate) {
    if (fromDate && toDate) {
      where.createdAt = { [Op.between]: [fromDate, toDate] };
    } else if (fromDate) {
      where.createdAt = { [Op.gte]: fromDate };
    } else if (toDate) {
      where.createdAt = { [Op.lte]: toDate };
    }
  }

  const transactions = await Transaction.findAll({
    where,
    order: [["createdAt", "ASC"]],
  });

  return transactions;
}

// Calculate interest for a savings account
async function calculateInterestForAccount(account) {
  if (account.accountType !== "Savings") {
    return 0;
  }
  const rate = SAVINGS_INTEREST_RATE;
  const baseInterest = parseFloat(account.balance) * rate;
  return Number(baseInterest.toFixed(2));
}

// Generate interest summaries for all accounts
async function generateInterestSummaries(year) {
  const accounts = await Account.findAll({
    include: { association: "Customer", attributes: ["id", "fullName"] },
  });

  const summaries = [];
  for (const account of accounts) {
    const grossInterest = await calculateInterestForAccount(account);
    const withholdingTax = Number((grossInterest * WITHHOLDING_TAX_RATE).toFixed(2));
    const netInterest = Number((grossInterest - withholdingTax).toFixed(2));

    summaries.push({
      id: makeId("INT"),
      year,
      accountId: account.id,
      customerId: account.customerId,
      customerName: account.Customer.fullName,
      residencyStatus: "resident", // Would be from customer table in future
      tin: null,
      grossInterest,
      withholdingTax,
      netInterest,
      status: "submitted_to_frcs",
      submittedAt: nowIso(),
    });
  }

  return summaries;
}

// Apply monthly fees to accounts
async function applyMonthlyFees() {
  const charged = [];
  // For now, no monthly fees in new setup
  // This can be extended if we track account types with fees
  return charged;
}

// Register a new user
async function registerUser({ fullName, mobile, email, password, confirmPassword }) {
  if (!fullName || !mobile || !email || !password) {
    throw new Error("fullName, mobile, email and password are required");
  }
  validateEmail(email);
  validateMobile(mobile);
  validatePassword(password);
  if (confirmPassword !== undefined && password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedMobile = String(mobile).trim();

  const existingUser = await Customer.findOne({
    where: {
      [Op.or]: [
        { email: normalizedEmail },
        { mobile: normalizedMobile },
      ],
    },
  });
  if (existingUser) {
    throw new Error("Email or phone number is already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await Registration.create({
    fullName,
    mobile: normalizedMobile,
    email: normalizedEmail,
    password: passwordHash,
    verificationCode: null,
    verificationStatus: "verified",
    verifiedAt: new Date(),
  });

  const customer = await Customer.create({
    fullName,
    mobile: normalizedMobile,
    email: normalizedEmail,
    password: passwordHash,
    status: "active",
    emailVerified: true,
    registrationStatus: "approved",
  });

  return {
    userId: customer.id,
    customerId: customer.id,
    fullName,
    email: customer.email,
    emailVerified: true,
    message: "Registration successful. You can now sign in.",
  };
}

// Login a user
async function loginUser({ email, password, ipAddress, userAgent }) {
  if (!email || !password) {
    throw new Error("email and password are required");
  }

  const normalizedEmail = normalizeEmail(email);
  const admin = await Admin.findOne({ where: { email: normalizedEmail } });
  if (admin) {
    const validAdmin = await bcrypt.compare(password, admin.password);
    if (!validAdmin || admin.status !== "active") {
      await recordLoginAttempt({ userType: "admin", userId: admin.id, email: normalizedEmail, success: false, failureReason: "Invalid admin credentials", ipAddress, userAgent });
      throw new Error("Invalid email or password");
    }
    await admin.update({ lastLoginAt: new Date() });
    await recordLoginAttempt({ userType: "admin", userId: admin.id, email: normalizedEmail, success: true, ipAddress, userAgent });
    return {
      userId: admin.id,
      fullName: admin.fullName,
      email: admin.email,
      customerId: null,
      isAdmin: true,
    };
  }

  const customer = await Customer.findOne({
    where: { email: normalizedEmail },
  });

  if (!customer) {
    await recordLoginAttempt({ userType: "customer", email: normalizedEmail, success: false, failureReason: "Unknown email", ipAddress, userAgent });
    throw new Error("Invalid email or password");
  }

  if (isAccountLocked(customer)) {
    await recordLoginAttempt({ userType: "customer", userId: customer.id, email: normalizedEmail, success: false, failureReason: "Account locked", ipAddress, userAgent });
    throw new Error("Account locked due to repeated failed logins. Try again later.");
  }

  if (["disabled", "locked", "suspended"].includes(String(customer.status || "").toLowerCase())) {
    await recordLoginAttempt({ userType: "customer", userId: customer.id, email: normalizedEmail, success: false, failureReason: `Status ${customer.status}`, ipAddress, userAgent });
    throw new Error("This account is not currently permitted to log in");
  }

  const valid = await bcrypt.compare(password, customer.password);
  if (!valid) {
    const nextFailures = Number(customer.failedLoginAttempts || 0) + 1;
    const updates = { failedLoginAttempts: nextFailures };
    if (nextFailures >= MAX_FAILED_LOGIN_ATTEMPTS) {
      updates.lockedUntil = new Date(Date.now() + ACCOUNT_LOCK_MINUTES * 60 * 1000);
      updates.status = "locked";
    }
    await customer.update(updates);
    await recordLoginAttempt({ userType: "customer", userId: customer.id, email: normalizedEmail, success: false, failureReason: "Invalid password", ipAddress, userAgent });
    throw new Error("Invalid email or password");
  }

  await customer.update({
    failedLoginAttempts: 0,
    lockedUntil: null,
    status: customer.status === "locked" ? "active" : customer.status,
    lastLoginAt: new Date(),
  });
  await recordLoginAttempt({ userType: "customer", userId: customer.id, email: normalizedEmail, success: true, ipAddress, userAgent });

  return {
    userId: customer.id,
    fullName: customer.fullName,
    email: customer.email,
    customerId: customer.id,
    mobile: customer.mobile,
    nationalId: customer.nationalId,
    isAdmin: false,
  };
}

async function verifyAdminCredentials({ email, password }) {
  if (!email || !password) {
    throw new Error("email and password are required");
  }

  const admin = await Admin.findOne({ where: { email: normalizeEmail(email) } });
  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    throw new Error("Invalid admin email or password");
  }

  return {
    email: admin.email,
    fullName: admin.fullName,
    isAdmin: true,
  };
}

async function requestPasswordReset({ email }) {
  const normalizedEmail = normalizeEmail(email);
  validateEmail(normalizedEmail);
  const customer = await Customer.findOne({ where: { email: normalizedEmail } });
  if (!customer) {
    throw new Error("Account not found for that email");
  }

  const resetId = makeId("RST");
  const otp = makeSixDigitCode();
  const hashedOtp = hashOtp(otp);
  await OtpVerification.create({
    referenceCode: resetId,
    customerId: customer.id,
    otp: hashedOtp,
    transactionType: "password_reset",
    amount: null,
    metadata: JSON.stringify({ email: normalizedEmail }),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    verified: false,
    attempts: 0,
    maxAttempts: OTP_MAX_ATTEMPTS,
  });

  await addNotification(customer.id, `Password reset code: ${otp}`, "PASSWORD_RESET_OTP");
  return { resetId, message: "Password reset code sent to your registered mobile number." };
}

async function resetPassword({ email, resetId, otp, newPassword }) {
  const normalizedEmail = normalizeEmail(email);
  validateEmail(normalizedEmail);
  validatePassword(newPassword);

  const customer = await Customer.findOne({ where: { email: normalizedEmail } });
  if (!customer) {
    throw new Error("Account not found for that email");
  }

  const resetRecord = await OtpVerification.findOne({
    where: {
      referenceCode: resetId,
      customerId: customer.id,
      transactionType: "password_reset",
      verified: false,
    },
  });
  if (!resetRecord) {
    throw new Error("Password reset request not found");
  }
  if (new Date(resetRecord.expiresAt).getTime() < Date.now()) {
    throw new Error("Password reset code has expired");
  }
  if (Number(resetRecord.attempts || 0) >= Number(resetRecord.maxAttempts || OTP_MAX_ATTEMPTS)) {
    throw new Error("Password reset attempts exceeded");
  }

  const submittedHash = hashOtp(String(otp || "").trim());
  if (String(resetRecord.otp) !== submittedHash) {
    const nextAttempts = Number(resetRecord.attempts || 0) + 1;
    await resetRecord.update({ attempts: nextAttempts, lastAttemptAt: new Date() });
    const remaining = Math.max(Number(resetRecord.maxAttempts || OTP_MAX_ATTEMPTS) - nextAttempts, 0);
    if (remaining <= 0) {
      throw new Error("Password reset attempts exceeded");
    }
    throw new Error(`Invalid password reset code. ${remaining} attempt(s) remaining.`);
  }

  await customer.update({
    password: await bcrypt.hash(newPassword, 10),
    failedLoginAttempts: 0,
    lockedUntil: null,
    status: customer.status === "locked" ? "active" : customer.status,
  });
  await resetRecord.update({ verified: true, attempts: Number(resetRecord.attempts || 0) + 1, lastAttemptAt: new Date() });
  return { status: "password_reset_completed" };
}

async function getDashboard(customerId) {
  const customer = await Customer.findByPk(customerId);
  if (!customer) {
    throw new Error("Customer not found");
  }

  const accounts = await Account.findAll({ where: { customerId }, order: [["createdAt", "ASC"]] });
  const accountNumbers = accounts.map((account) => account.accountNumber).filter(Boolean);
  const accountByNumber = new Map(accounts.map((account) => [String(account.accountNumber), account]));
  const transactions = accountNumbers.length > 0
    ? await Transaction.findAll({ where: { accountNumber: { [Op.in]: accountNumbers } }, order: [["createdAt", "DESC"]], limit: 10 })
    : [];

  return {
    customer: {
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
      mobile: customer.mobile,
      nationalId: customer.nationalId,
    },
    accounts: accounts.map((account) => ({
      id: account.id,
      accountNumber: account.accountNumber,
      accountHolder: account.accountHolder,
      accountType: account.accountType,
      balance: Number(account.balance),
      status: account.status,
    })),
    recentTransactions: transactions.map((tx) => ({
      id: tx.id,
      accountId: accountByNumber.get(String(tx.accountNumber))?.id || null,
      accountNumber: tx.accountNumber,
      type: tx.type,
      amount: Number(tx.amount),
      description: tx.description,
      createdAt: tx.createdAt,
    })),
    quickActions: ["Transfer", "Pay Bills"],
  };
}

async function updateProfile(customerId, payload) {
  const customer = await Customer.findByPk(customerId);
  if (!customer) {
    throw new Error("Customer not found");
  }

  const updates = {};
  if (payload.fullName !== undefined) {
    const requestedName = String(payload.fullName || "").trim();
    if (requestedName && requestedName !== String(customer.fullName || "").trim()) {
      throw new Error("For security reasons, name changes must be requested at a Bank of Fiji branch.");
    }
  }
  if (payload.mobile !== undefined) {
    validateMobile(payload.mobile);
    const normalizedMobile = String(payload.mobile).trim();
    const existingMobile = await Customer.findOne({ where: { mobile: normalizedMobile, id: { [Op.ne]: customerId } } });
    if (existingMobile) {
      throw new Error("Phone number is already used by another customer");
    }
    updates.mobile = normalizedMobile;
  }
  if (payload.email !== undefined) {
    const normalizedEmail = normalizeEmail(payload.email);
    validateEmail(normalizedEmail);
    const existingEmail = await Customer.findOne({ where: { email: normalizedEmail, id: { [Op.ne]: customerId } } });
    if (existingEmail) {
      throw new Error("Email is already used by another customer");
    }
    updates.email = normalizedEmail;
  }
  if (payload.newPassword) {
    if (!payload.currentPassword) {
      throw new Error("Current password is required to change password");
    }
    const valid = await bcrypt.compare(String(payload.currentPassword), customer.password);
    if (!valid) {
      throw new Error("Current password is incorrect");
    }
    validatePassword(payload.newPassword);
    updates.password = await bcrypt.hash(String(payload.newPassword), 10);
  }

  await customer.update(updates);
  return {
    id: customer.id,
    fullName: customer.fullName,
    email: customer.email,
    mobile: customer.mobile,
    nationalId: customer.nationalId,
    emailVerified: Boolean(customer.emailVerified),
    status: customer.status,
  };
}

async function getLoginLogs(limit = 200) {
  const rows = await LoginLog.findAll({ order: [["createdAt", "DESC"]], limit: Number(limit) || 200 });
  return rows.map((row) => ({
    id: row.id,
    userType: row.userType,
    userId: row.userId,
    email: row.email,
    success: Boolean(row.success),
    failureReason: row.failureReason,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
  }));
}

async function getOtpAttempts(limit = 200) {
  const rows = await OtpVerification.findAll({
    order: [["createdAt", "DESC"]],
    limit: Number(limit) || 200,
  });

  return rows.map((row) => ({
    id: row.id,
    referenceCode: row.referenceCode,
    customerId: row.customerId,
    transactionType: row.transactionType,
    amount: row.amount !== null && row.amount !== undefined ? Number(row.amount) : null,
    attempts: Number(row.attempts || 0),
    maxAttempts: Number(row.maxAttempts || OTP_MAX_ATTEMPTS),
    verified: Boolean(row.verified),
    expiresAt: row.expiresAt,
    lastAttemptAt: row.lastAttemptAt,
    createdAt: row.createdAt,
  }));
}

async function reverseTransaction(transactionId) {
  const tx = await Transaction.findByPk(transactionId);
  if (!tx) {
    throw new Error("Transaction not found");
  }
  if (tx.status === "reversed") {
    throw new Error("Transaction already reversed");
  }

  const reversalKind = tx.type === "debit" ? "credit" : "debit";
  const reversal = await createTransaction({
    accountNumber: tx.accountNumber,
    kind: reversalKind,
    amount: Number(tx.amount),
    description: `Reversal for transaction ${tx.id}`,
  });

  await tx.update({ status: "reversed", description: `${tx.description || "Transaction"} [REVERSED]` });
  return { originalTransactionId: tx.id, reversal };
}

module.exports = {
  HIGH_VALUE_OTP_THRESHOLD,
  WITHHOLDING_TAX_RATE,
  SAVINGS_INTEREST_RATE,
  getCustomer,
  getAccount,
  getAccountTransactions,
  addNotification,
  createTransaction,
  initiateTransfer,
  verifyTransfer,
  postBillPayment,
  scheduleBillPayment,
  runScheduledPayment,
  generateStatement,
  generateInterestSummaries,
  applyMonthlyFees,
  getHighValueTransferThreshold,
  setHighValueTransferThreshold,
  getNotificationLogs,
  generateRandomAccountNumber,
  registerUser,
  loginUser,
  verifyAdminCredentials,
  requestPasswordReset,
  resetPassword,
  getDashboard,
  updateProfile,
  getLoginLogs,
  getOtpAttempts,
  reverseTransaction,
};
