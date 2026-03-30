const API_BASE = import.meta.env.VITE_API_BASE || "/api";

let _authToken = null;
export function setToken(token) { _authToken = token; }
export function clearToken() { _authToken = null; }

async function request(path, options = {}) {
  if ((path === "/accounts" || path === "/accounts/request") && String(options.method || "GET").toUpperCase() === "POST" && options.body) {
    try {
      const payload = JSON.parse(options.body);
      const accountNumber = String(payload?.accountNumber || "").trim();
      if (accountNumber && !/^\d{12}$/.test(accountNumber)) {
        throw new Error("Reenter 12 digit number");
      }
    } catch (err) {
      if (err instanceof Error && err.message === "Reenter 12 digit number") {
        throw err;
      }
    }
  }

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (_authToken) {
    headers["Authorization"] = `Bearer ${_authToken}`;
  }
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error("Cannot reach backend server. Start server on port 4000 and try again.");
  }

  if (!response.ok) {
    let message = "Request failed";
    try {
      const payload = await response.json();
      message = payload.error || message;
    } catch (err) {
      message = `${response.status} ${response.statusText}`;
    }
    throw new Error(message);
  }

  const ct = response.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

async function requestBlob(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };
  if (_authToken) {
    headers["Authorization"] = `Bearer ${_authToken}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error("Cannot reach backend server. Start server on port 4000 and try again.");
  }

  if (!response.ok) {
    let message = "Request failed";
    try {
      const payload = await response.json();
      message = payload.error || message;
    } catch (err) {
      message = `${response.status} ${response.statusText}`;
    }
    throw new Error(message);
  }

  return {
    blob: await response.blob(),
    contentDisposition: response.headers.get("content-disposition") || "",
  };
}

export const api = {
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  requestPasswordReset: (body) => request("/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),
  resetPassword: (body) => request("/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),
  verifyAdminCredentials: (body) => request("/auth/admin-verify", { method: "POST", body: JSON.stringify(body) }),
  getCustomers: () => request("/customers"),
  getAdminCustomers: (query = "") => request(`/admin/customers${query ? `?q=${encodeURIComponent(query)}` : ""}`),
  updateCustomerAdmin: (id, body) => request(`/admin/customers/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  getDashboard: (customerId) => request(`/dashboard?customerId=${encodeURIComponent(customerId)}`),
  getProfile: (customerId) => request(`/profile/${encodeURIComponent(customerId)}`),
  updateProfile: (body) => request("/update-profile", { method: "PUT", body: JSON.stringify(body) }),
  getAccounts: () => request("/accounts"),
  createAccount: (body) => request("/accounts", { method: "POST", body: JSON.stringify(body) }),
  createAccountRequest: (body) => request("/accounts/request", { method: "POST", body: JSON.stringify(body) }),
  updateAccountAdmin: (id, body) => request(`/admin/accounts/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  freezeAccountAdmin: (id) => request(`/admin/accounts/${id}/freeze`, { method: "POST" }),
  getTransactions: (accountId) => request(`/transactions?accountId=${encodeURIComponent(accountId)}`),
  getTransactionsPaginated: ({
    accountId,
    accountNumber,
    page = 1,
    pageSize = 20,
    type,
    fromDate,
    toDate,
    minAmount,
    maxAmount,
  }) => {
    const params = new URLSearchParams();
    if (accountId !== undefined && accountId !== null && String(accountId) !== "") {
      params.set("accountId", String(accountId));
    }
    if (accountNumber !== undefined && accountNumber !== null && String(accountNumber) !== "") {
      params.set("accountNumber", String(accountNumber));
    }
    params.set("paginated", "true");
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (type) params.set("type", String(type));
    if (fromDate) params.set("fromDate", String(fromDate));
    if (toDate) params.set("toDate", String(toDate));
    if (minAmount !== undefined && minAmount !== null && String(minAmount) !== "") {
      params.set("minAmount", String(minAmount));
    }
    if (maxAmount !== undefined && maxAmount !== null && String(maxAmount) !== "") {
      params.set("maxAmount", String(maxAmount));
    }
    return request(`/transactions?${params.toString()}`);
  },
  getAccountDetails: (accountId, limit = 20) =>
    request(`/accounts/${encodeURIComponent(accountId)}/details?limit=${encodeURIComponent(limit)}`),
  getAdminTransactions: (accountNumber) => {
    const suffix = accountNumber ? `?accountNumber=${encodeURIComponent(accountNumber)}` : "";
    return request(`/admin/transactions${suffix}`);
  },
  getAdminLoginLogs: (limit = 200) => request(`/admin/login-logs?limit=${encodeURIComponent(limit)}`),
  reverseTransactionAdmin: (id) => request(`/admin/transactions/${id}/reverse`, { method: "POST" }),
  getTransferHistoryAdmin: () => request("/admin/transfers"),
  getAdminDashboardReport: () => request("/admin/dashboard-report"),
  getTransferLimitAdmin: () => request("/admin/transfer-limit"),
  updateTransferLimitAdmin: (highValueTransferLimit) =>
    request("/admin/transfer-limit", {
      method: "PUT",
      body: JSON.stringify({ highValueTransferLimit: Number(highValueTransferLimit) }),
    }),
  initiateTransfer: (body) => request("/transfers/initiate", { method: "POST", body: JSON.stringify(body) }),
  validateTransferDestination: (body) =>
    request("/transfers/validate-destination", { method: "POST", body: JSON.stringify(body) }),
  initiateTransaction: (body) => request("/transaction/initiate", { method: "POST", body: JSON.stringify(body) }),
  sendOtp: (body) => request("/otp/send", { method: "POST", body: JSON.stringify(body) }),
  verifyOtp: (body) => request("/otp/verify", { method: "POST", body: JSON.stringify(body) }),
  verifyTransfer: (body) => request("/transfers/verify", { method: "POST", body: JSON.stringify(body) }),
  payBillManual: (body) => request("/bills/manual", { method: "POST", body: JSON.stringify(body) }),
  scheduleBill: (body) => request("/bills/scheduled", { method: "POST", body: JSON.stringify(body) }),
  getScheduledBills: () => request("/bills/scheduled"),
  getBillHistory: () => request("/bills/history"),
  runScheduledBill: (id) => request(`/bills/scheduled/${id}/run`, { method: "POST" }),
  getStatement: (accountId) => request(`/statements/${accountId}`),
  createStatementRequest: (body) => request("/statements/request", { method: "POST", body: JSON.stringify(body) }),
  getStatementRequests: () => request("/statements/requests"),
  getAdminStatementRequests: () => request("/admin/statement-requests"),
  updateAdminStatementRequest: (id, body) => request(`/admin/statement-requests/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  getStatementByRequest: (requestId) => request(`/statements/request/${encodeURIComponent(requestId)}`),
  downloadStatementByRequest: (requestId) => requestBlob(`/statements/request/${encodeURIComponent(requestId)}/download`),
  getNotifications: (customerId) => request(`/notifications/${customerId}`),
  sendNotification: (body) => request("/notifications/send", { method: "POST", body: JSON.stringify(body) }),
  getNotificationHistory: (customerId = null, limit = 200) => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (customerId !== null && customerId !== undefined) {
      params.set("customerId", String(customerId));
    }
    return request(`/notifications/history?${params.toString()}`);
  },
  getInterestRate: () => request("/config/interest-rate"),
  updateInterestRate: (rate) =>
    request("/config/interest-rate", {
      method: "PUT",
      body: JSON.stringify({ reserveBankMinSavingsInterestRate: Number(rate) }),
    }),
  generateSummaries: (year) => request("/year-end/interest-summaries", { method: "POST", body: JSON.stringify({ year }) }),
  getSummaries: () => request("/year-end/interest-summaries"),
  getLoanProducts: () => request("/loan-products"),
  createLoanApplication: (body) => request("/loan-applications", { method: "POST", body: JSON.stringify(body) }),
  getLoanApplications: () => request("/loan-applications"),
  updateLoanApplicationAdmin: (id, body) => request(`/admin/loan-applications/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  getNotificationLogsAdmin: (limit = 200) => request(`/admin/notifications/logs?limit=${encodeURIComponent(limit)}`),
  sendTestSmsAdmin: (body) => request("/admin/test-sms", { method: "POST", body: JSON.stringify(body) }),
  getOtpAttemptsAdmin: (limit = 200) => request(`/admin/otp-attempts?limit=${encodeURIComponent(limit)}`),
  statementDownloadUrl: (accountId) => `${API_BASE}/statements/${accountId}/download`,
    createAdminDeposit: (body) => request("/admin/deposits", { method: "POST", body: JSON.stringify(body) }),
};
