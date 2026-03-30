import { useState } from "react";

export default function AdminMonitoringTab({
  accounts,
  transactions,
  selectedAccountForTx,
  setSelectedAccountForTx,
  adminTransferLimit,
  setAdminTransferLimit,
  onAdminUpdateTransferLimit,
  onAdminReverseTransaction,
  adminLoginLogs,
  adminNotificationLogs,
}) {
  const [activeView, setActiveView] = useState("transactions");

  const formatLogDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }
    return new Intl.DateTimeFormat("en-FJ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(date);
  };

  const VIEWS = [
    { id: "transactions", label: "TRANSACTIONS" },
    { id: "controls", label: "TRANSFER CONTROLS" },
    { id: "notifications", label: "NOTIFICATION LOG" },
    { id: "logins", label: "LOGIN ACTIVITY" },
  ];

  return (
    <section className="panel-grid">
      <article className="panel wide monitoring-dashboard">
        <nav className="acct-tab-bar" style={{ marginBottom: "16px" }}>
          {VIEWS.map((view) => (
            <button
              key={view.id}
              type="button"
              className={`acct-tab-btn${view.id === activeView ? " active" : ""}`}
              onClick={() => setActiveView(view.id)}
            >
              {view.label}
            </button>
          ))}
        </nav>

        {activeView === "transactions" && (
          <>
        <h3>Transaction Monitoring</h3>
        <div className="inline-controls">
          <label>
            Filter by Account
            <select value={selectedAccountForTx} onChange={(e) => setSelectedAccountForTx(e.target.value)}>
              <option value="">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.id} - {a.accountNumber || "N/A"}</option>
              ))}
            </select>
          </label>
        </div>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Risk</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.createdAt).toLocaleString()}</td>
                <td>{t.kind}</td>
                <td>FJD {Number(t.amount).toFixed(2)}</td>
                <td>{t.description}</td>
                <td>{t.suspicious ? "Flagged" : "Normal"}</td>
                <td>
                  <button type="button" disabled={t.status === "reversed"} onClick={() => onAdminReverseTransaction(t.id)}>
                    Reverse
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </>
        )}

        {activeView === "controls" && (
          <>
        <h3>Transfer Controls</h3>
        <form onSubmit={onAdminUpdateTransferLimit}>
          <label>
            High-value transfer limit (FJD)
            <input
              type="number"
              min="1"
              value={adminTransferLimit}
              onChange={(e) => setAdminTransferLimit(e.target.value)}
            />
          </label>
          <button type="submit">Update Limit</button>
        </form>
        <p className="hint">Transfers at or above this amount require OTP verification.</p>
          </>
        )}

        {activeView === "notifications" && (
          <>
        <h3>Notification Log</h3>
        <ul className="feed">
          {adminNotificationLogs.slice(0, 14).map((log) => (
            <li key={log.id}>
              <strong>{formatLogDate(log.timestamp || log.createdAt || log.updatedAt)}:</strong> {log.message}
            </li>
          ))}
        </ul>
          </>
        )}

        {activeView === "logins" && (
          <>
        <h3>Login Activity</h3>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>User Type</th>
              <th>Email</th>
              <th>Result</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {adminLoginLogs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.userType}</td>
                <td>{log.email}</td>
                <td>{log.success ? "Success" : "Failed"}</td>
                <td>{log.failureReason || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
          </>
        )}
      </article>
    </section>
  );
}
