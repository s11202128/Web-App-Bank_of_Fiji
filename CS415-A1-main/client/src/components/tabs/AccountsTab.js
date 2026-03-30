import { useState } from "react";
import { api } from "../../api";

const ACCOUNT_SECTIONS = ["Summary", "My Accounts", "Open Account"];
const DEFAULT_ACCOUNT_TYPE_DETAILS = { desc: "Unknown type", fee: "N/A", interest: "N/A", bestFor: "N/A" };
const ACCOUNT_TYPE_DETAILS = {
  cheque: {
    desc: "Everyday transaction account for payments and transfers",
    fee: "FJD 2.50/month",
    interest: "None",
    bestFor: "Daily transactions and cheque access",
  },
  savings: {
    desc: "Interest-bearing savings account",
    fee: "None",
    interest: "3.25% p.a.",
    bestFor: "Building savings with interest",
  },
};

export default function AccountsTab({
  accounts,
  currentUser,
  accountMessage,
  setAccountMessage,
  createAccountRequest = api.createAccountRequest,
}) {
  const [activeSection, setActiveSection] = useState("Summary");
  const [newAccountForm, setNewAccountForm] = useState({
    type: "Savings",
    accountNumber: "",
  });
  const [latestRequest, setLatestRequest] = useState(null);

  const activeCustomerId = currentUser?.customerId || currentUser?.userId || currentUser?.id || "";

  // Filter accounts for current user
  const userAccounts = currentUser
    ? accounts.filter((a) => String(a.customerId) === String(activeCustomerId))
    : [];

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setAccountMessage("");
    if (!activeCustomerId) {
      setAccountMessage("❌ Unable to determine your customer ID. Please log out and sign in again.");
      return;
    }
    try {
      const createdRequest = await createAccountRequest({
        customerId: Number(activeCustomerId),
        type: newAccountForm.type,
        accountNumber: newAccountForm.accountNumber || undefined,
      });
      setLatestRequest(createdRequest);
      setAccountMessage("✅ Account request submitted. It will be activated after admin approval.");
      setNewAccountForm({ type: "Savings", accountNumber: "" });
      // Refresh would be done by parent component
      setTimeout(() => setAccountMessage(""), 3000);
    } catch (err) {
      setAccountMessage(`❌ ${err.message}`);
    }
  };

  const getAccountTypeDescription = (type) => {
    const normalizedType = String(type || "").toLowerCase();
    if (normalizedType === "simple access" || normalizedType === "cheque") {
      return ACCOUNT_TYPE_DETAILS.cheque;
    }
    return ACCOUNT_TYPE_DETAILS[normalizedType] || DEFAULT_ACCOUNT_TYPE_DETAILS;
  };

  const accountStats = userAccounts.reduce(
    (acc, a) => ({
      total: acc.total + (a.status === "active" ? a.balance : 0),
      count: acc.count + 1,
    }),
    { total: 0, count: 0 }
  );

  return (
    <section className="panel-grid">
      <article className="panel wide">
        {/* Horizontal section switcher */}
        <nav className="acct-tab-bar">
          {ACCOUNT_SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className={`acct-tab-btn${activeSection === s ? " active" : ""}`}
              onClick={() => setActiveSection(s)}
            >
              {s}
            </button>
          ))}
        </nav>

        <div className="acct-tab-body">

          {activeSection === "Summary" && (
            <>
              <h2>Account Summary</h2>
              <div className="account-summary">
                <div className="summary-item">
                  <span className="label">Total Accounts:</span>
                  <span className="value">{accountStats.count}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Combined Balance:</span>
                  <span className="value highlight">FJD {accountStats.total.toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Account Owner:</span>
                  <span className="value">{currentUser?.fullName || "N/A"}</span>
                </div>
              </div>
              <p className="hint">New account requests must be approved by admin before becoming active.</p>
            </>
          )}

          {activeSection === "My Accounts" && (
            <>
              <h2>My Accounts</h2>
              {userAccounts.length === 0 ? (
                <p className="no-data">You have no accounts yet. Open a new account to get started.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Account #</th>
                      <th>Account Holder</th>
                      <th>Type</th>
                      <th>Balance</th>
                      <th>Fee/Interest</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userAccounts.map((a) => {
                      const typeInfo = getAccountTypeDescription(a.type);
                      return (
                        <tr key={a.id} className={`account-row account-${a.status}`}>
                          <td className="account-number">{a.accountNumber}</td>
                          <td>{a.accountHolder || currentUser?.fullName || "N/A"}</td>
                          <td>
                            <div>
                              <strong>{a.type === "Simple Access" ? "Cheque" : a.type}</strong>
                              <p className="hint">{typeInfo.desc}</p>
                            </div>
                          </td>
                          <td className="balance">
                            {a.status === "active" ? (
                              <strong>FJD {Number(a.balance).toFixed(2)}</strong>
                            ) : (
                              <span className="balance-pending" title="Awaiting admin approval">—</span>
                            )}
                          </td>
                          <td className="fee-interest">
                            <div>
                              <p>💰 {typeInfo.interest}</p>
                              <p>💳 {typeInfo.fee}</p>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge status-${a.status}`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="date">
                            {new Date(a.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeSection === "Open Account" && (
            <>
              <form className="admin-form" onSubmit={handleCreateAccount}>
                <label>
                  Customer ID
                  <input value={activeCustomerId} readOnly />
                </label>
                <label>
                  Account Type
                  <select
                    value={newAccountForm.type}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, type: e.target.value })}
                    required
                  >
                    <option value="Simple Access">Cheque</option>
                    <option value="Savings">Savings</option>
                  </select>
                </label>
                <label>
                  Account Number (optional — 12 digits)
                  <input
                    value={newAccountForm.accountNumber}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, accountNumber: e.target.value })}
                    placeholder="Leave blank to auto-generate"
                  />
                </label>
                <button type="submit">Submit Request</button>
              </form>
              {accountMessage && (
                <p className={`status ${accountMessage.includes("✅") ? "success" : "error"}`}>
                  {accountMessage}
                </p>
              )}
              {latestRequest && (
                <div className="status-card">
                  <p className="hint">Latest request status</p>
                  <p>
                    Account <strong>{latestRequest.accountNumber}</strong> is
                    {" "}<span className={`status-badge status-${latestRequest.status}`}>{latestRequest.status}</span>
                  </p>
                </div>
              )}
            </>
          )}

        </div>
      </article>
    </section>
  );
}
