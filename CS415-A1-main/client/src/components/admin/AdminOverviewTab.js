export default function AdminOverviewTab({ customers, accounts, adminReport, adminLastUpdated, adminMessage }) {
  const customerMap = customers.reduce((map, customer) => {
    map[customer.id] = customer;
    return map;
  }, {});

  const metrics = adminReport?.metrics || {
    totalCustomers: customers.length,
    totalAccounts: accounts.length,
    totalDeposits: accounts.reduce((s, a) => s + Number(a.balance || 0), 0),
    pendingLoans: 0,
    frozenAccounts: 0,
    todaysTransactions: 0,
  };

  return (
    <section className="panel-grid">
      {adminMessage && (
        <article className="panel wide">
          <p className="status">{adminMessage}</p>
        </article>
      )}
      {adminLastUpdated && (
        <article className="panel wide">
          <p className="hint">Last updated: {new Date(adminLastUpdated).toLocaleString()}</p>
        </article>
      )}

      <article className="panel metric-card">
        <h3>Total Customers</h3>
        <p className="metric">{metrics.totalCustomers}</p>
      </article>
      <article className="panel metric-card">
        <h3>Total Accounts</h3>
        <p className="metric">{metrics.totalAccounts}</p>
      </article>
      <article className="panel metric-card admin-total-deposit-card">
        <h3>Total Deposits</h3>
        <p className="metric admin-total-deposit-value">FJD {Number(metrics.totalDeposits || 0).toFixed(2)}</p>
      </article>
      <article className="panel metric-card">
        <h3>Today's Transactions</h3>
        <p className="metric">{metrics.todaysTransactions}</p>
      </article>
      <article className="panel metric-card">
        <h3>Pending Loans</h3>
        <p className="metric">{metrics.pendingLoans}</p>
      </article>
      <article className="panel metric-card">
        <h3>Frozen / Suspended</h3>
        <p className="metric">{metrics.frozenAccounts}</p>
      </article>

      <article className="panel wide">
        <h3>Recent Transactions</h3>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Account</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {(adminReport?.recentTransactions || []).map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.createdAt).toLocaleString()}</td>
                <td>{t.accountId}</td>
                <td>{t.kind}</td>
                <td>FJD {Number(t.amount).toFixed(2)}</td>
                <td>{t.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <article className="panel wide">
        <h3>Account Snapshot</h3>
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Balance</th>
              <th>Monthly Fee</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{customerMap[a.customerId]?.fullName || a.customerId}</td>
                <td>{a.type}</td>
                <td>FJD {Number(a.balance || 0).toFixed(2)}</td>
                <td>FJD {Number(a.maintenanceFee || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}
