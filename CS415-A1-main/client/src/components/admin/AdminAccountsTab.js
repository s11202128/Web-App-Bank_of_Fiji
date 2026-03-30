export default function AdminAccountsTab({
  accounts,
  adminAccountForm,
  setAdminAccountForm,
  onCreateAdminAccount,
  adminAccountMessage,
  onAdminUpdateAccount,
  onAdminFreezeAccount,
}) {
  const sortedAccounts = [...accounts].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

  const renderActions = (account) => {
    const status = String(account.status || "").toLowerCase();

    if (status === "pending_approval") {
      return (
        <>
          <button type="button" onClick={() => onAdminUpdateAccount(account.id, { status: "active" })}>Approve</button>
          <button type="button" onClick={() => onAdminUpdateAccount(account.id, { status: "rejected" })}>Reject</button>
        </>
      );
    }

    if (status === "frozen") {
      return (
        <button type="button" onClick={() => onAdminUpdateAccount(account.id, { status: "active" })}>Unfreeze</button>
      );
    }

    if (status === "active") {
      return (
        <button type="button" onClick={() => onAdminFreezeAccount(account.id)}>Freeze</button>
      );
    }

    return (
      <button type="button" onClick={() => onAdminUpdateAccount(account.id, { status: "active" })}>Set Active</button>
    );
  };

  return (
    <section className="panel-grid">
      <article className="panel wide">
        <h3>Open New Account</h3>
        <form className="admin-form" onSubmit={onCreateAdminAccount}>
          <label>
            Customer Name
            <input
              value={adminAccountForm.customerName}
              onChange={(e) => setAdminAccountForm({ ...adminAccountForm, customerName: e.target.value })}
              placeholder="Type full name (existing or new customer)"
              required
            />
          </label>
          <label>
            Account Type
            <select
              value={adminAccountForm.type}
              onChange={(e) => setAdminAccountForm({ ...adminAccountForm, type: e.target.value })}
              required
            >
              <option value="Simple Access">Cheque</option>
              <option value="Savings">Savings</option>
            </select>
          </label>
          <label>
            Opening Balance
            <input
              type="number"
              min="0"
              step="0.01"
              value={adminAccountForm.openingBalance}
              onChange={(e) => setAdminAccountForm({ ...adminAccountForm, openingBalance: e.target.value })}
            />
          </label>
          <label>
            Account Number (optional — 12 digits)
            <input
              value={adminAccountForm.accountNumber}
              onChange={(e) => setAdminAccountForm({ ...adminAccountForm, accountNumber: e.target.value })}
              placeholder="Leave blank to auto-generate"
            />
          </label>
          <button type="submit">Create Account</button>
        </form>
        <p className="status">{adminAccountMessage}</p>
      </article>

      <article className="panel wide">
        <h3>Manage Account Requests</h3>
        {sortedAccounts.length === 0 ? (
          <p className="hint">No accounts found.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Account ID</th>
                  <th>Account #</th>
                  <th>Customer ID</th>
                  <th>Holder</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAccounts.map((account) => (
                  <tr key={account.id}>
                    <td>{account.id}</td>
                    <td>{account.accountNumber}</td>
                    <td>{account.customerId}</td>
                    <td>{account.accountHolder || "-"}</td>
                    <td>{account.type}</td>
                    <td>
                      <span className={`status-badge status-${account.status}`}>
                        {account.status}
                      </span>
                    </td>
                    <td>FJD {Number(account.balance || 0).toFixed(2)}</td>
                    <td>
                      <div className="inline-controls">
                        {renderActions(account)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
