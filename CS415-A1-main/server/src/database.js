const mysql = require("mysql2/promise");
const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const sequelize = require("./config/database");
const {
  Customer,
  Account,
  Admin,
  NotificationLog,
} = require("./models");

const DB_NAME = process.env.DB_NAME || "bof_banking_db";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = "DB_PASSWORD" in process.env ? process.env.DB_PASSWORD : "";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_SYNC_ALTER = String(process.env.DB_SYNC_ALTER || "false").toLowerCase() === "true";

function isLegacyCustomerIdType(columnType) {
  const normalized = String(columnType || "").toLowerCase();
  return normalized.includes("char") || normalized.includes("uuid");
}

function isLegacyAccountIdType(columnType) {
  const normalized = String(columnType || "").toLowerCase();
  return normalized.includes("char") || normalized.includes("uuid");
}

function isLegacyLoanIdType(columnType) {
  const normalized = String(columnType || "").toLowerCase();
  return normalized.includes("char") || normalized.includes("uuid");
}

function isLegacyBillIdType(columnType) {
  const normalized = String(columnType || "").toLowerCase();
  return normalized.includes("char") || normalized.includes("uuid");
}

function isLegacyInvestmentIdType(columnType) {
  const normalized = String(columnType || "").toLowerCase();
  return normalized.includes("char") || normalized.includes("uuid");
}

function isLegacyOtpVerificationIdType(columnType) {
  const normalized = String(columnType || "").toLowerCase();
  return normalized.includes("char") || normalized.includes("uuid");
}

function isLegacyTransactionIdType(columnType) {
  const normalized = String(columnType || "").toLowerCase();
  return normalized.includes("char") || normalized.includes("uuid");
}

function isLegacyRegistrationIdType(columnType) {
  const normalized = String(columnType || "").toLowerCase();
  return normalized.includes("char") || normalized.includes("uuid");
}

// Idempotent addColumn: silently ignores ER_DUP_FIELDNAME so concurrent nodemon
// restarts cannot crash the migration when two processes race to add the same column.
async function safeAddColumn(queryInterface, tableName, columnName, definition) {
  try {
    await queryInterface.addColumn(tableName, columnName, definition);
  } catch (err) {
    const code = err?.parent?.code || err?.original?.code || err?.code;
    if (code !== "ER_DUP_FIELDNAME") {
      throw err;
    }
  }
}

const initializeDatabase = async () => {
  try {
    // First, create the database if it doesn't exist
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
    await connection.end();

    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    const normalizedTables = tables
      .map((t) => (typeof t === "string" ? t : Object.values(t)[0]));
    const hasCustomersTable = normalizedTables.includes("customers");
    const hasAccountsTable = normalizedTables.includes("accounts");
    const hasLoansTable = normalizedTables.includes("loans");
    const hasBillsTable = normalizedTables.includes("bills");
    const hasInvestmentsTable = normalizedTables.includes("investments");
    const hasOtpVerificationsTable = normalizedTables.includes("otp_verifications");
    const hasTransactionsTable = normalizedTables.includes("transactions");
    const hasRegistrationsTable = normalizedTables.includes("registrations");
    const hasAdminsTable = normalizedTables.includes("admins");
    const hasLoginLogsTable = normalizedTables.includes("login_logs");
    const hasNotificationLogsTable = normalizedTables.includes("notification_logs");
    const hasDocumentsTable = normalizedTables.includes("documents");

    if (hasDocumentsTable) {
      try {
        await queryInterface.dropTable("documents");
      } catch (error) {
        console.warn("Skipping documents table drop:", error.message);
      }
    }

    let requiresCustomerIdMigration = false;
    let requiresAccountIdMigration = false;
    let requiresLoanIdMigration = false;
    let requiresBillIdMigration = false;
    let requiresInvestmentIdMigration = false;
    let requiresOtpVerificationIdMigration = false;
    let requiresTransactionIdMigration = false;
    let requiresRegistrationIdMigration = false;
    let requiresAdminIdMigration = false;
    let requiresLoginLogIdMigration = false;
    let requiresNotificationLogIdMigration = false;
    
    if (hasCustomersTable) {
      const customerColumns = await queryInterface.describeTable("customers");
      requiresCustomerIdMigration = isLegacyCustomerIdType(customerColumns?.id?.type);
    }
    if (hasAccountsTable) {
      const accountColumns = await queryInterface.describeTable("accounts");
      requiresAccountIdMigration = isLegacyAccountIdType(accountColumns?.id?.type);
    }
    if (hasLoansTable) {
      const loanColumns = await queryInterface.describeTable("loans");
      requiresLoanIdMigration = isLegacyLoanIdType(loanColumns?.id?.type);
    }
    if (hasBillsTable) {
      const billColumns = await queryInterface.describeTable("bills");
      requiresBillIdMigration = isLegacyBillIdType(billColumns?.id?.type);
    }
    if (hasInvestmentsTable) {
      const investmentColumns = await queryInterface.describeTable("investments");
      requiresInvestmentIdMigration = isLegacyInvestmentIdType(investmentColumns?.id?.type);
    }
    if (hasOtpVerificationsTable) {
      const otpColumns = await queryInterface.describeTable("otp_verifications");
      requiresOtpVerificationIdMigration = isLegacyOtpVerificationIdType(otpColumns?.id?.type);
    }
    if (hasTransactionsTable) {
      const transactionColumns = await queryInterface.describeTable("transactions");
      requiresTransactionIdMigration = isLegacyTransactionIdType(transactionColumns?.id?.type);
    }
    if (hasRegistrationsTable) {
      const registrationColumns = await queryInterface.describeTable("registrations");
      requiresRegistrationIdMigration = isLegacyRegistrationIdType(registrationColumns?.id?.type);
    }
    if (hasAdminsTable) {
      const adminColumns = await queryInterface.describeTable("admins");
      requiresAdminIdMigration = isLegacyRegistrationIdType(adminColumns?.id?.type);
    }
    if (hasLoginLogsTable) {
      const loginLogColumns = await queryInterface.describeTable("login_logs");
      requiresLoginLogIdMigration = isLegacyRegistrationIdType(loginLogColumns?.id?.type);
    }
    if (hasNotificationLogsTable) {
      const notificationLogColumns = await queryInterface.describeTable("notification_logs");
      requiresNotificationLogIdMigration = isLegacyRegistrationIdType(notificationLogColumns?.id?.type);
    }

    if (requiresCustomerIdMigration || requiresAccountIdMigration || requiresLoanIdMigration || 
        requiresBillIdMigration || requiresInvestmentIdMigration || requiresOtpVerificationIdMigration || 
        requiresTransactionIdMigration || requiresRegistrationIdMigration || requiresAdminIdMigration ||
        requiresLoginLogIdMigration || requiresNotificationLogIdMigration) {
      console.warn("Detected legacy UUID IDs. Rebuilding schema to use integer auto-increment IDs.");
      console.warn("Existing local data will be recreated from seed data after migration.");
      await sequelize.sync({ force: true });
    } else {
      // Avoid repeated ALTER operations that can create excess indexes in MySQL.
      await sequelize.sync({ alter: DB_SYNC_ALTER });
    }

    // Ensure customer admin/compliance fields exist even when DB_SYNC_ALTER is false.
    const customerColumns = await queryInterface.describeTable("customers");

    if (!customerColumns.tin) {
      await safeAddColumn(queryInterface, "customers", "tin", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      });
    }
    if (!customerColumns.residencyStatus) {
      await safeAddColumn(queryInterface, "customers", "residencyStatus", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "resident",
      });
    }
    if (!customerColumns.identityVerified) {
      await safeAddColumn(queryInterface, "customers", "identityVerified", {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      });
    }
    if (!customerColumns.registrationStatus) {
      await safeAddColumn(queryInterface, "customers", "registrationStatus", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "approved",
      });
    }
    if (!customerColumns.nationalId) {
      await safeAddColumn(queryInterface, "customers", "nationalId", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      });
    }
    if (!customerColumns.emailVerified) {
      await safeAddColumn(queryInterface, "customers", "emailVerified", {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      });
    }
    if (!customerColumns.failedLoginAttempts) {
      await safeAddColumn(queryInterface, "customers", "failedLoginAttempts", {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      });
    }
    if (!customerColumns.lockedUntil) {
      await safeAddColumn(queryInterface, "customers", "lockedUntil", {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }
    if (!customerColumns.lastLoginAt) {
      await safeAddColumn(queryInterface, "customers", "lastLoginAt", {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }

    const accountColumns = await queryInterface.describeTable("accounts");
    if (!accountColumns.accountHolder) {
      await safeAddColumn(queryInterface, "accounts", "accountHolder", {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }

    await sequelize.query(`
      UPDATE accounts a
      INNER JOIN customers c ON c.id = a.customerId
      SET a.accountHolder = c.fullName
      WHERE a.accountHolder IS NULL OR TRIM(a.accountHolder) = ''
    `);

    await queryInterface.changeColumn("accounts", "accountHolder", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    });

    const registrationColumns = await queryInterface.describeTable("registrations");
    if (!registrationColumns.nationalId) {
      await safeAddColumn(queryInterface, "registrations", "nationalId", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      });
    }
    if (!registrationColumns.verificationCode) {
      await safeAddColumn(queryInterface, "registrations", "verificationCode", {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (!registrationColumns.verificationStatus) {
      await safeAddColumn(queryInterface, "registrations", "verificationStatus", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "pending",
      });
    }
    if (!registrationColumns.verifiedAt) {
      await safeAddColumn(queryInterface, "registrations", "verifiedAt", {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }

    const otpColumns = await queryInterface.describeTable("otp_verifications");
    if (!otpColumns.referenceCode) {
      await safeAddColumn(queryInterface, "otp_verifications", "referenceCode", {
        type: DataTypes.STRING,
        allowNull: true,
      });
      await sequelize.query("UPDATE otp_verifications SET referenceCode = CONCAT('LEGACY-', id) WHERE referenceCode IS NULL");
      await queryInterface.changeColumn("otp_verifications", "referenceCode", {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      });
    }
    if (!otpColumns.metadata) {
      await safeAddColumn(queryInterface, "otp_verifications", "metadata", {
        type: DataTypes.TEXT,
        allowNull: true,
      });
    }
    if (!otpColumns.attempts) {
      await safeAddColumn(queryInterface, "otp_verifications", "attempts", {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
    if (!otpColumns.maxAttempts) {
      await safeAddColumn(queryInterface, "otp_verifications", "maxAttempts", {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
      });
    }
    if (!otpColumns.lastAttemptAt) {
      await safeAddColumn(queryInterface, "otp_verifications", "lastAttemptAt", {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }

    const loanColumns = await queryInterface.describeTable("loans");
    if (!loanColumns.loanProductId) {
      await safeAddColumn(queryInterface, "loans", "loanProductId", {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      });
    }
    if (!loanColumns.termMonths) {
      await safeAddColumn(queryInterface, "loans", "termMonths", {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      });
    }

    const [[{ totalAccounts }]] = await sequelize.query("SELECT COUNT(*) AS totalAccounts FROM accounts");
    if (Number(totalAccounts || 0) === 0) {
      await sequelize.query("ALTER TABLE accounts AUTO_INCREMENT = 101");
    }

    const [[{ totalLoans }]] = await sequelize.query("SELECT COUNT(*) AS totalLoans FROM loans");
    if (Number(totalLoans || 0) === 0) {
      await sequelize.query("ALTER TABLE loans AUTO_INCREMENT = 1");
    }

    const [[{ totalBills }]] = await sequelize.query("SELECT COUNT(*) AS totalBills FROM bills");
    if (Number(totalBills || 0) === 0) {
      await sequelize.query("ALTER TABLE bills AUTO_INCREMENT = 1");
    }

    const [[{ totalInvestments }]] = await sequelize.query("SELECT COUNT(*) AS totalInvestments FROM investments");
    if (Number(totalInvestments || 0) === 0) {
      await sequelize.query("ALTER TABLE investments AUTO_INCREMENT = 1");
    }

    const [[{ totalOtpVerifications }]] = await sequelize.query("SELECT COUNT(*) AS totalOtpVerifications FROM otp_verifications");
    if (Number(totalOtpVerifications || 0) === 0) {
      await sequelize.query("ALTER TABLE otp_verifications AUTO_INCREMENT = 1");
    }

    const [[{ totalTransactions }]] = await sequelize.query("SELECT COUNT(*) AS totalTransactions FROM transactions");
    if (Number(totalTransactions || 0) === 0) {
      await sequelize.query("ALTER TABLE transactions AUTO_INCREMENT = 1");
    }

    const [[{ totalRegistrations }]] = await sequelize.query("SELECT COUNT(*) AS totalRegistrations FROM registrations");
    if (Number(totalRegistrations || 0) === 0) {
      await sequelize.query("ALTER TABLE registrations AUTO_INCREMENT = 1");
    }

    const [[{ totalAdmins }]] = await sequelize.query("SELECT COUNT(*) AS totalAdmins FROM admins");
    if (Number(totalAdmins || 0) === 0) {
      await sequelize.query("ALTER TABLE admins AUTO_INCREMENT = 1");
    }

    const [[{ totalLoginLogs }]] = await sequelize.query("SELECT COUNT(*) AS totalLoginLogs FROM login_logs");
    if (Number(totalLoginLogs || 0) === 0) {
      await sequelize.query("ALTER TABLE login_logs AUTO_INCREMENT = 1");
    }

    const [[{ totalNotificationLogs }]] = await sequelize.query("SELECT COUNT(*) AS totalNotificationLogs FROM notification_logs");
    if (Number(totalNotificationLogs || 0) === 0) {
      await sequelize.query("ALTER TABLE notification_logs AUTO_INCREMENT = 1");
    }

    console.log("Database tables synchronized");

    // Check if database already has data
    const customerCount = await Customer.count();
    if (customerCount === 0) {
      // Seed initial data
      await seedDatabase();
    } else {
      console.log("Database already populated");
    }

    await ensureDefaultAdmin();
  } catch (error) {
    console.error("Database initialization error:", error.message);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    // Create sample customers
    const customer1 = await Customer.create({
      fullName: "Litia Narikoso",
      email: "litia@example.com",
      mobile: "+679812345",
      nationalId: "FJ-100001",
      password: await bcrypt.hash("password123", 10),
      emailVerified: true,
      status: "active",
    });

    const customer2 = await Customer.create({
      fullName: "Aman Patel",
      email: "aman@example.com",
      mobile: "+679823456",
      nationalId: "FJ-100002",
      password: await bcrypt.hash("password123", 10),
      emailVerified: true,
      status: "active",
    });

    const customer3 = await Customer.create({
      fullName: "Mere Tikoisuva",
      email: "mere@example.com",
      mobile: "+679834567",
      nationalId: "FJ-100003",
      password: await bcrypt.hash("password123", 10),
      emailVerified: true,
      status: "active",
    });

    // Create accounts for each customer
    await Account.create({
      customerId: customer1.id,
      accountNumber: "235673489789",
      accountHolder: customer1.fullName,
      accountType: "Savings",
      balance: 15000,
      currency: "FJD",
      status: "active",
    });

    await Account.create({
      customerId: customer2.id,
      accountNumber: "918274635402",
      accountHolder: customer2.fullName,
      accountType: "Current",
      balance: 25000,
      currency: "FJD",
      status: "active",
    });

    await Account.create({
      customerId: customer3.id,
      accountNumber: "603957214886",
      accountHolder: customer3.fullName,
      accountType: "Savings",
      balance: 18500,
      currency: "FJD",
      status: "active",
    });

    console.log("Database seeded with initial data");
  } catch (error) {
    console.error("Database seeding error:", error.message);
    throw error;
  }
};

async function ensureDefaultAdmin() {
  const adminEmail = String(process.env.ADMIN_EMAIL || "admin@bof.fj").toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || "admin12345");
  const existing = await Admin.findOne({ where: { email: adminEmail } });
  if (existing) {
    return existing;
  }

  return Admin.create({
    fullName: "System Admin",
    email: adminEmail,
    password: await bcrypt.hash(adminPassword, 10),
    role: "super_admin",
    status: "active",
  });
}

module.exports = initializeDatabase;
