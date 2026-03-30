export default function AdminStatementsTab({ statementRequests }) {
  return (
    <section className="panel-grid">
      <article className="panel wide">
        <h3>Statement Request Log</h3>
        <p className="hint">Requests are immediately available to users and no admin approval is required.</p>
        <table>
          <thead>
            <tr>
              <th>Requested</th>
              <th>Customer</th>
              <th>Account Holder</th>
              <th>Account Number</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {statementRequests.map((request) => (
              <tr key={request.id}>
                <td>{new Date(request.createdAt).toLocaleString()}</td>
                <td>{request.fullName}</td>
                <td>{request.accountHolder}</td>
                <td>{request.accountNumber}</td>
                <td>{request.fromDate}</td>
                <td>{request.toDate}</td>
                <td>{request.status}</td>
              </tr>
            ))}
            {statementRequests.length === 0 && (
              <tr>
                <td colSpan="7" className="no-data">No statement requests yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </article>
    </section>
  );
}
