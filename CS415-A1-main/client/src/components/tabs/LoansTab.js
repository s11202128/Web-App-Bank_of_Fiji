import { useEffect, useState } from "react";

export default function LoansTab({
  customers,
  customerMap,
  loanProducts,
  loanApplications,
  loanForm,
  setLoanForm,
  onSubmitLoan,
  loanMessage,
  setLoanMessage,
}) {
  const [activeSection, setActiveSection] = useState("Apply for Loan");
  const [loanSuccess, setLoanSuccess] = useState(false);
  const [submittedLoan, setSubmittedLoan] = useState(null);

  function formatLoanDate(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  }

  useEffect(() => {
    if (loanMessage && loanMessage.includes("Loan application submitted")) {
      const selectedCustomer = customers.find((c) => String(c.id) === String(loanForm.customerId));
      const selectedProduct = loanProducts.find((p) => String(p.id) === String(loanForm.loanProductId));
      setSubmittedLoan({
        customerName: selectedCustomer?.fullName || "N/A",
        productName: selectedProduct?.name || "N/A",
        requestedAmount: Number(loanForm.requestedAmount || 0),
        termMonths: Number(loanForm.termMonths || 0),
        submittedAt: new Date().toLocaleString(),
      });
      setLoanSuccess(true);
    }
  }, [loanMessage, customers, loanProducts, loanForm]);

  function handleAnotherLoan() {
    setLoanSuccess(false);
    setSubmittedLoan(null);
    if (setLoanMessage) setLoanMessage("");
    setLoanForm({
      ...loanForm,
      requestedAmount: "",
      termMonths: "",
      purpose: "",
      monthlyIncome: "",
      occupation: "",
    });
  }

  function handleGoToApplications() {
    setLoanSuccess(false);
    setSubmittedLoan(null);
    if (setLoanMessage) setLoanMessage("");
    setActiveSection("My Applications");
  }

  return (
    <section className="panel-grid">
      <article className="panel wide">
        <nav className="acct-tab-bar">
          {["Loan Products", "Apply for Loan", "My Applications"].map((s) => (
            <button key={s} type="button" className={`acct-tab-btn${activeSection === s ? " active" : ""}`} onClick={() => setActiveSection(s)}>{s}</button>
          ))}
        </nav>

        <div className="acct-tab-body">

          {activeSection === "Loan Products" && (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Annual Rate</th>
                  <th>Max Amount</th>
                  <th>Term</th>
                </tr>
              </thead>
              <tbody>
                {loanProducts.map((lp) => (
                  <tr key={lp.id}>
                    <td>{lp.name}</td>
                    <td>{(lp.annualRate * 100).toFixed(2)}%</td>
                    <td>FJD {lp.maxAmount.toFixed(2)}</td>
                    <td>{lp.minTermMonths}-{lp.maxTermMonths} months</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeSection === "Apply for Loan" && (
            <>
              {loanSuccess ? (
                <div className="transfer-success-screen">
                  <h2>Loan Application Submitted Successfully</h2>
                  <p className="hint">Your loan request has been recorded and is now pending review.</p>
                  <div className="success-details">
                    <p><strong>Customer:</strong> {submittedLoan?.customerName || "N/A"}</p>
                    <p><strong>Product:</strong> {submittedLoan?.productName || "N/A"}</p>
                    <p><strong>Requested Amount:</strong> FJD {Number(submittedLoan?.requestedAmount || 0).toLocaleString()}</p>
                    <p><strong>Term:</strong> {submittedLoan?.termMonths || 0} months</p>
                    <p><strong>Submitted:</strong> {submittedLoan?.submittedAt || "N/A"}</p>
                  </div>
                  <div className="transfer-success-actions">
                    <button type="button" onClick={handleAnotherLoan}>Submit Another Loan</button>
                    <button type="button" onClick={handleGoToApplications}>View My Applications</button>
                  </div>
                </div>
              ) : (
                <>
                  <form className="loan-form-horizontal" onSubmit={onSubmitLoan}>
                    <label>
                      Customer
                      <select value={loanForm.customerId} onChange={(e) => setLoanForm({ ...loanForm, customerId: e.target.value })} required>
                        <option value="">Select</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>{c.fullName}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Loan Product
                      <select value={loanForm.loanProductId} onChange={(e) => setLoanForm({ ...loanForm, loanProductId: e.target.value })} required>
                        <option value="">Select</option>
                        {loanProducts.map((lp) => (
                          <option key={lp.id} value={lp.id}>{lp.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Requested Amount
                      <div className="loan-currency-input">
                        <span className="loan-currency-prefix">$</span>
                        <input type="number" min="1" value={loanForm.requestedAmount} onChange={(e) => setLoanForm({ ...loanForm, requestedAmount: e.target.value })} required />
                      </div>
                    </label>
                    <label>
                      Term (months)
                      <input type="number" min="1" value={loanForm.termMonths} onChange={(e) => setLoanForm({ ...loanForm, termMonths: e.target.value })} required />
                    </label>
                    <label>
                      Purpose
                      <input value={loanForm.purpose} onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })} required />
                    </label>
                    <label>
                      Monthly Income
                      <div className="loan-currency-input">
                        <span className="loan-currency-prefix">FJD</span>
                        <input type="number" min="0" value={loanForm.monthlyIncome} onChange={(e) => setLoanForm({ ...loanForm, monthlyIncome: e.target.value })} />
                      </div>
                    </label>
                    <label>
                      Occupation
                      <input value={loanForm.occupation} onChange={(e) => setLoanForm({ ...loanForm, occupation: e.target.value })} />
                    </label>
                    <button type="submit">Submit Application</button>
                  </form>
                  <p className="status loan-apply-status">{loanMessage}</p>
                </>
              )}
            </>
          )}

          {activeSection === "My Applications" && (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Term</th>
                  <th>Status</th>
                  <th>Sent At</th>
                  <th>Approved/Rejected At</th>
                </tr>
              </thead>
              <tbody>
                {loanApplications.map((a, index) => (
                  <tr key={a.id}>
                    <td>{index + 1}</td>
                    <td>{customerMap[a.customerId]?.fullName || a.customerId}</td>
                    <td>{loanProducts.find((p) => p.id === a.loanProductId)?.name || a.loanProductId}</td>
                    <td>FJD {a.requestedAmount.toFixed(2)}</td>
                    <td>{a.termMonths}</td>
                    <td>{a.status}</td>
                    <td>{formatLoanDate(a.submittedAt || a.createdAt)}</td>
                    <td>{formatLoanDate(a.reviewedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      </article>
    </section>
  );
}
