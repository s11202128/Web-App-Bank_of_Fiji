export default function AdminReportsTab({ adminReport, scheduledBills, summaries }) {
  const metrics = adminReport?.metrics || {};
  const accountBreakdown = adminReport?.accountTypeBreakdown || [];
  const loanBreakdown = adminReport?.loanStatusBreakdown || [];
  const acctMax = accountBreakdown.reduce((m, r) => Math.max(m, r.value), 1);
  const loanMax = loanBreakdown.reduce((m, r) => Math.max(m, r.value), 1);

  return (
    <section className="panel-grid">
      <article className="panel">
        <h3>Operational Snapshot</h3>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Total Customers</td><td>{metrics.totalCustomers ?? "-"}</td></tr>
            <tr><td>Total Accounts</td><td>{metrics.totalAccounts ?? "-"}</td></tr>
            <tr><td>Total Deposits</td><td>{metrics.totalDeposits != null ? `FJD ${Number(metrics.totalDeposits).toFixed(2)}` : "-"}</td></tr>
            <tr><td>Pending Loans</td><td>{metrics.pendingLoans ?? "-"}</td></tr>
            <tr><td>Frozen/Suspended Accounts</td><td>{metrics.frozenAccounts ?? "-"}</td></tr>
            <tr><td>Today's Transactions</td><td>{metrics.todaysTransactions ?? "-"}</td></tr>
            <tr><td>Scheduled Bills</td><td>{scheduledBills.length}</td></tr>
            <tr><td>Interest Summaries</td><td>{summaries.length}</td></tr>
          </tbody>
        </table>
      </article>

      <article className="panel">
        <h3>Account Type Distribution</h3>
        <div className="mini-chart">
          {accountBreakdown.map((row) => {
            const height = Math.max(8, Math.round((row.value / acctMax) * 100));
            return (
              <div key={row.label} className="mini-chart-col">
                <div className="mini-bar" style={{ height: `${height}%` }} />
                <span className="mini-chart-label">{row.label}</span>
                <span className="mini-chart-value">{row.value}</span>
              </div>
            );
          })}
        </div>
      </article>

      <article className="panel">
        <h3>Loan Status Distribution</h3>
        <div className="mini-chart">
          {loanBreakdown.map((row) => {
            const height = Math.max(8, Math.round((row.value / loanMax) * 100));
            return (
              <div key={row.label} className="mini-chart-col">
                <div className="mini-bar amount" style={{ height: `${height}%` }} />
                <span className="mini-chart-label">{row.label}</span>
                <span className="mini-chart-value">{row.value}</span>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
}
