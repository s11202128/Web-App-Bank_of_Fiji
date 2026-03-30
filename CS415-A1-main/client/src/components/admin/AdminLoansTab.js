export default function AdminLoansTab({ loanApplications, onAdminUpdateLoanStatus }) {
  function formatLoanDate(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  }

  return (
    <article className="panel wide">
      <h3 className="loan-management-title">Loan Application Management</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Sent At</th>
            <th>Approved/Rejected At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loanApplications.map((loan, index) => {
            const normalizedStatus = String(loan.status || "").toLowerCase();
            const canReview = ["submitted", "pending"].includes(normalizedStatus);

            return (
              <tr key={loan.id}>
                <td>{index + 1}</td>
                <td>{loan.customerId}</td>
                <td>FJD {Number(loan.requestedAmount || 0).toFixed(2)}</td>
                <td>{loan.status}</td>
                <td>{formatLoanDate(loan.submittedAt || loan.createdAt)}</td>
                <td>{formatLoanDate(loan.reviewedAt)}</td>
                <td>
                  {canReview ? (
                    <div className="inline-controls">
                      <button type="button" onClick={() => onAdminUpdateLoanStatus(loan.id, "approved")}>Approve</button>
                      <button type="button" onClick={() => onAdminUpdateLoanStatus(loan.id, "rejected")}>Reject</button>
                    </div>
                  ) : normalizedStatus === "approved" ? (
                    <span className="status success">Approved</span>
                  ) : normalizedStatus === "rejected" ? (
                    <span className="status error">Rejected</span>
                  ) : (
                    <span className="status">Finalized</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </article>
  );
}
