import { useEffect, useMemo, useRef, useState } from "react";
import { api, setToken } from "./api";
import { useAuth } from "./hooks/useAuth";
import { useAdminPoll } from "./hooks/useAdminPoll";
import { filterDataByScope } from "./utils/dataFilters";
import { tabs } from "./constants/tabs";
import AuthPage from "./components/AuthPage";
import BankBrand from "./components/BankBrand";
import HomePage from "./components/HomePage";
import AdminPage from "./components/AdminPage";
import SiteFooter from "./components/SiteFooter";
import AccountsTab from "./components/tabs/AccountsTab";
import TransfersTab from "./components/tabs/TransfersTab";
import BillPaymentsTab from "./components/tabs/BillPaymentsTab";
import StatementsTab from "./components/tabs/StatementsTab";
import LoansTab from "./components/tabs/LoansTab";
import ProfileTab from "./components/tabs/ProfileTab";
import AdminLockScreen from "./components/tabs/AdminLockScreen";

export default function App() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [showAdmin, setShowAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date().toISOString());

  // SRP: auth state and token management extracted to useAuth hook (DIP)
  const { authToken, currentUser, setCurrentUser, setAuth, clearAuth } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [customerTransactions, setCustomerTransactions] = useState([]);
  const [scheduledBills, setScheduledBills] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [loanProducts, setLoanProducts] = useState([]);
  const [loanApplications, setLoanApplications] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [interestRate, setInterestRate] = useState(0);
  const [selectedAccountForTx, setSelectedAccountForTx] = useState("");
  const [statementAccount, setStatementAccount] = useState("");
  const [statementRows, setStatementRows] = useState([]);
  const [statementRequested, setStatementRequested] = useState(false);
  const [statementRequests, setStatementRequests] = useState([]);
  const [statementMessage, setStatementMessage] = useState("");
  const [adminStatementRequests, setAdminStatementRequests] = useState([]);
  const [notificationCustomer, setNotificationCustomer] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    currentPassword: "",
    newPassword: "",
  });
  const [profileMessage, setProfileMessage] = useState("");

  const [accountMessage, setAccountMessage] = useState("");
  const [transferForm, setTransferForm] = useState({ fromAccountId: "", toAccountNumber: "", amount: "", description: "" });
  const [transferMessage, setTransferMessage] = useState("");
  const [pendingTransfer, setPendingTransfer] = useState({ transferId: "", otp: "" });

  const [manualBillForm, setManualBillForm] = useState({ accountId: "", payee: "", amount: "" });
  const [scheduleBillForm, setScheduleBillForm] = useState({ accountId: "", payee: "", amount: "", scheduledDate: "" });
  const [billMessage, setBillMessage] = useState("");

  const [loanForm, setLoanForm] = useState({
    customerId: "",
    loanProductId: "",
    requestedAmount: "",
    termMonths: "",
    purpose: "",
    monthlyIncome: "",
    occupation: "",
  });
  const [loanMessage, setLoanMessage] = useState("");

  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [complianceMessage, setComplianceMessage] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminAccessGranted, setAdminAccessGranted] = useState(false);
  const [adminAuthForm, setAdminAuthForm] = useState({ email: "", password: "" });
  const [adminAuthMessage, setAdminAuthMessage] = useState("");
  const [adminTransactions, setAdminTransactions] = useState([]);
  const [adminLoginLogs, setAdminLoginLogs] = useState([]);
  const [adminNotificationLogs, setAdminNotificationLogs] = useState([]);
  const [adminTransferLimit, setAdminTransferLimit] = useState(1000);
  const [adminReport, setAdminReport] = useState(null);
  const [adminLastUpdated, setAdminLastUpdated] = useState("");
  const [adminAccountForm, setAdminAccountForm] = useState({
    customerName: "",
    type: "Simple Access",
    openingBalance: "0",
    accountNumber: "",
  });
  const [adminAccountMessage, setAdminAccountMessage] = useState("");
  const [adminDepositForm, setAdminDepositForm] = useState({ accountId: "", amount: "", description: "" });
  const [adminDepositMessage, setAdminDepositMessage] = useState("");
  const refreshPromiseRef = useRef(null);

  const customerMap = useMemo(() => {
    const map = {};
    customers.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [customers]);

  const isAdminUser = Boolean(currentUser?.isAdmin);
  const effectiveShowAdmin = showAdmin || isAdminUser;

  useEffect(() => {
    if (authToken && currentUser) {
      loadInitialData();
    }
  }, [authToken, currentUser, showAdmin, adminAccessGranted]);

  useEffect(() => {
    if (!currentUser?.customerId || customers.length === 0) {
      return;
    }
    const profile = customers.find((customer) => String(customer.id) === String(currentUser.customerId));
    if (!profile) {
      return;
    }
    setProfileForm((prev) => ({
      ...prev,
      fullName: profile.fullName || "",
      email: profile.email || currentUser.email || "",
      mobile: profile.mobile || currentUser.mobile || "",
      currentPassword: "",
      newPassword: "",
    }));
  }, [customers, currentUser]);

  async function loadInitialData(options = {}) {
    const { silent = false } = options;
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshTask = (async () => {
    if (!silent) {
      setLoading(true);
    }
    setError("");
    try {
      const [customerRows, accountRows, scheduled, billHistoryRows, products, apps, invs, rate, sumRows, statementRequestRows] = await Promise.all([
        api.getCustomers(),
        api.getAccounts(),
        api.getScheduledBills(),
        api.getBillHistory(),
        api.getLoanProducts(),
        api.getLoanApplications(),
        api.getInterestRate(),
        api.getSummaries(),
        api.getStatementRequests(),
      ]);

      const hasAdminScope = Boolean(currentUser?.isAdmin || (showAdmin && adminAccessGranted));

      // OCP/SRP: data scoping extracted to filterDataByScope utility
      const {
        customers: visibleCustomers,
        accounts: visibleAccounts,
        scheduledBills: visibleScheduledBills,
        loanApplications: visibleLoanApplications,
        summaries: visibleSummaries,
      } = filterDataByScope(
        { customers: customerRows, accounts: accountRows, bills: scheduled, loans: apps, summaries: sumRows },
        { hasAdminScope, activeCustomerId: currentUser?.customerId }
      );

      setCustomers(visibleCustomers);
      setAccounts(visibleAccounts);
      setScheduledBills(visibleScheduledBills);
      setLoanProducts(products);
      setLoanApplications(visibleLoanApplications);
      setInterestRate(rate.reserveBankMinSavingsInterestRate);
      setSummaries(visibleSummaries);
      setBillHistory(
        hasAdminScope
          ? billHistoryRows
          : billHistoryRows.filter((b) => {
              const byCustomer = b.customerId && String(b.customerId) === String(currentUser?.customerId);
              const byAccount = b.accountId && visibleAccounts.some((a) => String(a.id) === String(b.accountId));
              return byCustomer || byAccount;
            })
      );
      setStatementRequests(statementRequestRows);
      setLastUpdatedAt(new Date().toISOString());
      if (hasAdminScope) {
        setAdminStatementRequests(statementRequestRows);
      }

      // Load transaction history for each visible account so Accounts tab can show transfer/bill history.
      if (visibleAccounts.length > 0) {
        const txResults = await Promise.allSettled(
          visibleAccounts.map((account) => api.getTransactions(account.id))
        );
        const mergedRows = txResults
          .filter((r) => r.status === "fulfilled")
          .flatMap((r) => r.value || []);
        setCustomerTransactions(mergedRows);
      } else {
        setCustomerTransactions([]);
      }

      if (visibleAccounts.length > 0) {
        const defaultAccountId = String(visibleAccounts[0].id);
        setSelectedAccountForTx((prev) => {
          if (hasAdminScope) {
            return visibleAccounts.some((a) => String(a.id) === String(prev)) ? String(prev) : "";
          }
          return visibleAccounts.some((a) => String(a.id) === String(prev)) ? prev : visibleAccounts[0].id;
        });
        setStatementAccount((prev) =>
          visibleAccounts.some((a) => String(a.id) === String(prev)) ? prev : visibleAccounts[0].id
        );
        setManualBillForm((prev) => ({
          ...prev,
          accountId: visibleAccounts.some((a) => String(a.id) === String(prev.accountId)) ? prev.accountId : defaultAccountId,
        }));
        setScheduleBillForm((prev) => ({
          ...prev,
          accountId: visibleAccounts.some((a) => String(a.id) === String(prev.accountId)) ? prev.accountId : defaultAccountId,
        }));
      } else {
        setSelectedAccountForTx("");
        setStatementAccount("");
        setManualBillForm((prev) => ({ ...prev, accountId: "" }));
        setScheduleBillForm((prev) => ({ ...prev, accountId: "" }));
      }
      setStatementRows([]);
      setStatementRequested(false);
      if (visibleCustomers.length > 0) {
        setNotificationCustomer((prev) =>
          visibleCustomers.some((c) => String(c.id) === String(prev)) ? prev : visibleCustomers[0].id
        );
        setLoanForm((prev) => ({
          ...prev,
          customerId: visibleCustomers.some((c) => String(c.id) === String(prev.customerId))
            ? prev.customerId
            : String(visibleCustomers[0].id),
        }));
      } else {
        setNotificationCustomer("");
      }
    } catch (err) {
      console.error("loadInitialData error:", err);
      setError(String(err?.message || err || "Failed to load data"));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
    })();

    refreshPromiseRef.current = refreshTask;
    try {
      return await refreshTask;
    } finally {
      if (refreshPromiseRef.current === refreshTask) {
        refreshPromiseRef.current = null;
      }
    }
  }

  useEffect(() => {
    if (!authToken || !currentUser) {
      return;
    }

    const refreshInBackground = () => {
      loadInitialData({ silent: true }).catch(() => {
        // Errors are handled in loadInitialData state; swallow here to keep interval alive.
      });
    };

    const timer = setInterval(refreshInBackground, 2000);
    return () => clearInterval(timer);
  }, [authToken, currentUser, showAdmin, adminAccessGranted]);

  useEffect(() => {
    if (!notificationCustomer) return;
    api.getNotifications(notificationCustomer).then(setNotifications).catch((err) => setError(err.message));
  }, [notificationCustomer]);

  // SRP: admin polling concern extracted to useAdminPoll hook
  useAdminPoll({
    enabled: Boolean((currentUser?.isAdmin || adminAccessGranted) && showAdmin),
    accounts,
    selectedAccountForTx,
    onData: ({ txRows, loginLogRows, notificationLogRows, limit, report, statementReqRows }) => {
      setAdminTransactions(txRows);
      setAdminLoginLogs(loginLogRows);
      setAdminNotificationLogs(notificationLogRows);
      setAdminTransferLimit(Number(limit.highValueTransferLimit || 1000));
      setAdminReport(report);
      setAdminStatementRequests(statementReqRows);
      setAdminLastUpdated(new Date().toISOString());
    },
    onError: (msg) => setAdminMessage(msg),
    intervalMs: 2000,
  });

  const totalBalance = accounts.filter(a => a.status === "active").reduce((sum, a) => sum + a.balance, 0);
  const currentYear = new Date().getFullYear();

  // ── Auth gate ────────────────────────────────────────────────────────────
  if (!authToken) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} currentYear={currentYear} />;
  }
  // ────────────────────────────────────────────────────────────────────────

  // ── Auth handlers ────────────────────────────────────────────────────────
  function handleLoginSuccess(token, user) {
    setAuth(token, user);
    setShowAdmin(Boolean(user?.isAdmin));
  }

  function onLogout() {
    clearAuth();
    setCustomerTransactions([]);
    setStatementRows([]);
    setStatementRequested(false);
    setStatementRequests([]);
    setAdminStatementRequests([]);
    setStatementMessage("");
    setAdminAccessGranted(false);
    setAdminAuthForm({ email: "", password: "" });
    setAdminAuthMessage("");
  }

  // Inactivity timeout: Auto-logout after 30 seconds of inactivity  
  // TEMPORARILY DISABLED FOR DEBUGGING
  /*
  useEffect(() => {
    if (!authToken || !currentUser) return;

    const TIMEOUT_MS = 30000;
    let timer;

    const startTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        clearToken();
        setAuthToken(null);
        setCurrentUser(null);
      }, TIMEOUT_MS);
    };

    const handleActivity = () => startTimer();

    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('mousemove', handleActivity, { passive: true });

    startTimer();

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
    };
  }, [authToken, currentUser]);
  */
  // ────────────────────────────────────────────────────────────────────────

  async function onInitiateTransfer(e) {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    setTransferMessage("");
    try {
      const payload = {
        ...transferForm,
        amount: Number(transferForm.amount),
      };
      const result = await api.initiateTransfer(payload);
      if (result.requiresOtp) {
        setPendingTransfer({ transferId: result.transferId, otp: result.otp });
        setTransferMessage("High-value transfer pending OTP. A verification code has been sent to your mobile by SMS.");
      } else {
        setPendingTransfer({ transferId: "", otp: "" });
        setTransferMessage("Transfer completed successfully.");
        await loadInitialData();
      }
    } catch (err) {
      setTransferMessage(err.message);
    }
  }

  async function onVerifyTransfer(e) {
    e.preventDefault();
    try {
      await api.verifyTransfer({ transferId: pendingTransfer.transferId, otp: pendingTransfer.otp });
      setTransferMessage("OTP verified and transfer completed.");
      setPendingTransfer({ transferId: "", otp: "" });
      await loadInitialData();
    } catch (err) {
      setTransferMessage(err.message);
    }
  }

  async function onManualBill(e) {
    e.preventDefault();
    setBillMessage("");
    try {
      await api.payBillManual({ ...manualBillForm, amount: Number(manualBillForm.amount) });
      setBillMessage("Manual bill payment processed.");
      await loadInitialData();
    } catch (err) {
      setBillMessage(err.message);
    }
  }

  async function onScheduleBill(e) {
    e.preventDefault();
    setBillMessage("");
    try {
      await api.scheduleBill({ ...scheduleBillForm, amount: Number(scheduleBillForm.amount) });
      setBillMessage("Scheduled bill payment created.");
      await loadInitialData();
    } catch (err) {
      setBillMessage(err.message);
    }
  }

  async function runScheduledBill(id) {
    setBillMessage("");
    try {
      await api.runScheduledBill(id);
      setBillMessage(`Scheduled payment ${id} processed.`);
      await loadInitialData();
    } catch (err) {
      setBillMessage(err.message);
    }
  }

  async function onSubmitStatementRequest(payload) {
    try {
      await api.createStatementRequest(payload);
      setStatementMessage("Statement request submitted. You can view it immediately.");
      await loadInitialData();
      setStatementRows([]);
      setStatementRequested(false);
    } catch (err) {
      setStatementMessage(err.message);
    }
  }

  async function fetchStatement(requestId) {
    try {
      const rows = await api.getStatementByRequest(requestId);
      setStatementRows(rows);
      setStatementRequested(true);
      setStatementMessage("Statement loaded.");
    } catch (err) {
      setStatementMessage(err.message);
    }
  }

  async function onDownloadStatement(requestId) {
    try {
      const { blob, contentDisposition } = await api.downloadStatementByRequest(requestId);
      const match = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
      const fileName = match?.[1] || `statement-request-${requestId}.csv`;
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setStatementMessage(err.message);
    }
  }

  async function onAdminUpdateStatementRequest(requestId, status) {
    setAdminMessage("");
    try {
      await api.updateAdminStatementRequest(requestId, { status });
      setAdminMessage(`Statement request ${status}.`);
      await loadInitialData();
    } catch (err) {
      setAdminMessage(err.message);
    }
  }

  async function onSubmitLoan(e) {
    e.preventDefault();
    setLoanMessage("");
    try {
      await api.createLoanApplication({
        ...loanForm,
        requestedAmount: Number(loanForm.requestedAmount),
        termMonths: Number(loanForm.termMonths),
        monthlyIncome: Number(loanForm.monthlyIncome || 0),
      });
      setLoanMessage("Loan application submitted.");
      await loadInitialData();
    } catch (err) {
      setLoanMessage(err.message);
    }
  }

  async function onUpdateProfile(e) {
    e.preventDefault();
    setProfileMessage("");
    try {
      const updatedProfile = await api.updateProfile({
        customerId: currentUser.customerId,
        email: profileForm.email,
        mobile: profileForm.mobile,
        currentPassword: profileForm.currentPassword,
        newPassword: profileForm.newPassword,
      });
      setCurrentUser((prev) => ({
        ...prev,
        fullName: updatedProfile.fullName,
        email: updatedProfile.email,
        mobile: updatedProfile.mobile,
      }));
      setProfileForm((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
      setProfileMessage("Profile updated successfully.");
      await loadInitialData();
    } catch (err) {
      setProfileMessage(err.message);
    }
  }

  async function onUpdateRate(e) {
    e.preventDefault();
    setComplianceMessage("");
    try {
      await api.updateInterestRate(interestRate);
      setComplianceMessage("Savings interest rate updated.");
      await loadInitialData();
    } catch (err) {
      setComplianceMessage(err.message);
    }
  }

  async function onGenerateSummaries() {
    setComplianceMessage("");
    try {
      const rows = await api.generateSummaries(Number(summaryYear));
      setSummaries(rows);
      setComplianceMessage(`Generated ${rows.length} annual interest summaries and submitted to FRCS.`);
    } catch (err) {
      setComplianceMessage(err.message);
    }
  }

  async function onAdminUpdateCustomer(customerId, updates) {
    setAdminMessage("");
    try {
      await api.updateCustomerAdmin(customerId, updates);
      setAdminMessage("Customer updated.");
      await loadInitialData();
    } catch (err) {
      setAdminMessage(err.message);
    }
  }

  async function onAdminUpdateAccount(accountId, updates) {
    setAdminMessage("");
    try {
      await api.updateAccountAdmin(accountId, updates);
      setAdminMessage("Account updated.");
      await loadInitialData();
    } catch (err) {
      setAdminMessage(err.message);
    }
  }

  async function onAdminFreezeAccount(accountId) {
    setAdminMessage("");
    try {
      await api.freezeAccountAdmin(accountId);
      setAdminMessage("Account frozen.");
      await loadInitialData();
    } catch (err) {
      setAdminMessage(err.message);
    }
  }

  async function onAdminUpdateLoanStatus(loanId, status) {
    setAdminMessage("");
    try {
      await api.updateLoanApplicationAdmin(loanId, { status });
      setAdminMessage(`Loan ${status}.`);
      await loadInitialData();
    } catch (err) {
      setAdminMessage(err.message);
    }
  }

  async function onAdminUpdateTransferLimit(e) {
    e.preventDefault();
    setAdminMessage("");
    try {
      const result = await api.updateTransferLimitAdmin(adminTransferLimit);
      setAdminTransferLimit(Number(result.highValueTransferLimit));
      setAdminMessage("High-value transfer limit updated.");
    } catch (err) {
      setAdminMessage(err.message);
    }
  }

  async function onAdminReverseTransaction(transactionId) {
    setAdminMessage("");
    try {
      await api.reverseTransactionAdmin(transactionId);
      setAdminMessage("Transaction reversed successfully.");
      await loadInitialData();
    } catch (err) {
      setAdminMessage(err.message);
    }
  }

  async function onCreateAdminAccount(e) {
    e.preventDefault();
    setAdminAccountMessage("");
    try {
      await api.createAccount({
        customerName: adminAccountForm.customerName,
        type: adminAccountForm.type,
        openingBalance: Number(adminAccountForm.openingBalance || 0),
        accountNumber: adminAccountForm.accountNumber || undefined,
      });
      setAdminAccountMessage("Account created successfully.");
      setAdminAccountForm({ customerName: "", type: "Simple Access", openingBalance: "0", accountNumber: "" });
      await loadInitialData();
    } catch (err) {
      setAdminAccountMessage(err.message);
    }
  }

  async function onAdminDeposit(e) {
    e.preventDefault();
    setAdminDepositMessage("");
    try {
      await api.createAdminDeposit({
        accountId: Number(adminDepositForm.accountId),
        amount: Number(adminDepositForm.amount),
        description: adminDepositForm.description,
      });
      setAdminDepositMessage("Deposit completed successfully.");
      setAdminDepositForm({ accountId: "", amount: "", description: "" });
      await loadInitialData();
    } catch (err) {
      setAdminDepositMessage(err.message);
    }
  }

  async function onVerifyAdminAccess(e) {
    e.preventDefault();
    setAdminAuthMessage("");
    try {
      const result = await api.login(adminAuthForm);
      setToken(result.token); // persist token in api layer before login handler
      handleLoginSuccess(result.token, {
        fullName: result.fullName,
        userId: result.userId,
        customerId: result.customerId,
        email: result.email,
        mobile: result.mobile,
        nationalId: result.nationalId,
        isAdmin: Boolean(result.isAdmin),
      });
      setAdminAccessGranted(true);
      setAdminAuthMessage("Admin access granted.");
    } catch (err) {
      setAdminAuthMessage(err.message);
    }
  }

  // ── Admin page view ───────────────────────────────────────────────────────
  if (effectiveShowAdmin) {
    return (
      <div className="app-shell">
        <header className="hero">
          <div className="hero-row">
            <BankBrand
              className="hero-brand"
              compact
              eyebrow="Administration"
              title="Bank of Fiji"
              subtitle="Admin dashboard with live monitoring and controls."
            />
            {currentUser && (
              <div className="hero-user">
                <span>Welcome, <strong>{currentUser.fullName}</strong></span>
                  {!isAdminUser && <button className="home-btn" onClick={() => setShowAdmin(false)}>Home</button>}
                <button className="logout-btn" onClick={onLogout}>Logout</button>
              </div>
            )}
          </div>
        </header>

        {!(currentUser?.isAdmin || adminAccessGranted) && (
          <AdminLockScreen
            adminAuthForm={adminAuthForm}
            setAdminAuthForm={setAdminAuthForm}
            onVerifyAdminAccess={onVerifyAdminAccess}
            adminAuthMessage={adminAuthMessage}
          />
        )}
        {(currentUser?.isAdmin || adminAccessGranted) && (
          <AdminPage
            customers={customers}
            accounts={accounts}
            transactions={adminTransactions}
            scheduledBills={scheduledBills}
            loanApplications={loanApplications}
            summaries={summaries}
            selectedAccountForTx={selectedAccountForTx}
            setSelectedAccountForTx={setSelectedAccountForTx}
            adminAccountForm={adminAccountForm}
            setAdminAccountForm={setAdminAccountForm}
            onCreateAdminAccount={onCreateAdminAccount}
            adminAccountMessage={adminAccountMessage}
            adminDepositForm={adminDepositForm}
            setAdminDepositForm={setAdminDepositForm}
            onAdminDeposit={onAdminDeposit}
            adminDepositMessage={adminDepositMessage}
            setAdminDepositMessage={setAdminDepositMessage}
            adminMessage={adminMessage}
            onAdminUpdateCustomer={onAdminUpdateCustomer}
            onAdminUpdateAccount={onAdminUpdateAccount}
            onAdminFreezeAccount={onAdminFreezeAccount}
            onAdminUpdateLoanStatus={onAdminUpdateLoanStatus}
            adminTransferLimit={adminTransferLimit}
            setAdminTransferLimit={setAdminTransferLimit}
            onAdminUpdateTransferLimit={onAdminUpdateTransferLimit}
            onAdminReverseTransaction={onAdminReverseTransaction}
            adminLoginLogs={adminLoginLogs}
            adminNotificationLogs={adminNotificationLogs}
            adminStatementRequests={adminStatementRequests}
            onAdminUpdateStatementRequest={onAdminUpdateStatementRequest}
            adminReport={adminReport}
            adminLastUpdated={adminLastUpdated}
            interestRate={interestRate}
            setInterestRate={setInterestRate}
            onUpdateRate={onUpdateRate}
            summaryYear={summaryYear}
            setSummaryYear={setSummaryYear}
            onGenerateSummaries={onGenerateSummaries}
            complianceMessage={complianceMessage}
          />
        )}

        <SiteFooter currentYear={currentYear} />
      </div>
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero-row">
          <BankBrand
            className="hero-brand"
            compact
            eyebrow="Online Banking"
            title="Bank of Fiji"
            subtitle="Home dashboard"
          />
          {currentUser && (
            <div className="hero-user">
              <span>Welcome, <strong>{currentUser.fullName}</strong></span>
              {!isAdminUser && <button className="admin-btn" onClick={() => { setShowAdmin(true); setAdminAuthMessage(""); }}>Admin</button>}
              <button className="logout-btn" onClick={onLogout}>Logout</button>
            </div>
          )}
        </div>
      </header>

      <div className="workspace-layout">
        <aside className="left-tabs">
          {currentUser ? (
            <nav className="tabs">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={tab === activeTab ? "tab active" : "tab"}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </nav>
          ) : (
            <p className="status">Loading...</p>
          )}
        </aside>

        <section className="tab-content">
          {error && <p className="status error"><strong>Error:</strong> {error}</p>}
          {loading && !error && <p className="status">Loading data...</p>}
          {!currentUser && !loading && !error && (
            <p className="status">Please wait while we load your account information...</p>
          )}
          
          {/* Debug info - remove after testing */}
          {!currentUser && !error && (
            <div style={{padding: '20px', color: '#999', fontSize: '12px', borderTop: '1px solid #eee', marginTop: '20px'}}>
              <p>Debug - authToken: {authToken ? '✓' : '✗'} | currentUser: {currentUser ? '✓' : '✗'} | loading: {loading ? '✓' : '✗'}</p>
            </div>
          )}

          {currentUser && !loading && activeTab === "Overview" && (
            <HomePage
              totalBalance={totalBalance}
              currentUser={currentUser}
              lastUpdatedAt={lastUpdatedAt}
              onRefreshOverview={loadInitialData}
              isRefreshing={loading}
            />
          )}

          {!loading && currentUser && activeTab === "Accounts" && (
            <AccountsTab
              accounts={accounts}
              currentUser={currentUser}
              accountMessage={accountMessage}
              setAccountMessage={setAccountMessage}
            />
          )}

          {!loading && currentUser && activeTab === "Transfers" && (
            <TransfersTab
              accounts={accounts}
              transferForm={transferForm}
              setTransferForm={setTransferForm}
              onInitiateTransfer={onInitiateTransfer}
              pendingTransfer={pendingTransfer}
              setPendingTransfer={setPendingTransfer}
              onVerifyTransfer={onVerifyTransfer}
              transferMessage={transferMessage}
              setTransferMessage={setTransferMessage}
            />
          )}

          {!loading && currentUser && activeTab === "Bill Payments" && (
            <BillPaymentsTab
              accounts={accounts}
              manualBillForm={manualBillForm}
              setManualBillForm={setManualBillForm}
              onManualBill={onManualBill}
              scheduleBillForm={scheduleBillForm}
              setScheduleBillForm={setScheduleBillForm}
              onScheduleBill={onScheduleBill}
              billHistory={billHistory}
              runScheduledBill={runScheduledBill}
              billMessage={billMessage}
            />
          )}

          {!loading && currentUser && activeTab === "Statements" && (
            <StatementsTab
              accounts={accounts}
              transactions={customerTransactions}
              customers={customers}
              statementAccount={statementAccount}
              setStatementAccount={setStatementAccount}
              statementRows={statementRows}
              statementRequested={statementRequested}
              statementRequests={statementRequests}
              statementMessage={statementMessage}
              setStatementMessage={setStatementMessage}
              currentUser={currentUser}
              fetchStatement={fetchStatement}
              onSubmitStatementRequest={onSubmitStatementRequest}
              onDownloadStatement={onDownloadStatement}
              notificationCustomer={notificationCustomer}
              setNotificationCustomer={setNotificationCustomer}
              notifications={notifications}
            />
          )}

          {!loading && currentUser && activeTab === "Loans" && (
            <LoansTab
              customers={customers}
              customerMap={customerMap}
              loanProducts={loanProducts}
              loanApplications={loanApplications}
              loanForm={loanForm}
              setLoanForm={setLoanForm}
              onSubmitLoan={onSubmitLoan}
              loanMessage={loanMessage}
              setLoanMessage={setLoanMessage}
            />
          )}

          {!loading && currentUser && activeTab === "Profile" && (
            <ProfileTab
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              onUpdateProfile={onUpdateProfile}
              profileMessage={profileMessage}
            />
          )}

        </section>
      </div>

      <SiteFooter currentYear={currentYear} />
    </div>
  );
}