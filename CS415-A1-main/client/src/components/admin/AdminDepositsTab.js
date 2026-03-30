import { useEffect, useState } from "react";

export default function AdminDepositsTab({
  accounts,
  adminDepositForm,
  setAdminDepositForm,
  onAdminDeposit,
  adminDepositMessage,
  setAdminDepositMessage,
}) {
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [submittedDeposit, setSubmittedDeposit] = useState(null);

  const eligibleAccounts = (accounts || []).filter(
    (a) => !["frozen", "suspended", "closed", "rejected"].includes(String(a.status || "").toLowerCase())
  );

  useEffect(() => {
    if (adminDepositMessage && adminDepositMessage.includes("Deposit completed successfully")) {
      setDepositSuccess(true);
    }
  }, [adminDepositMessage]);

  function handleSubmit(event) {
    const selectedAccount = eligibleAccounts.find((account) => String(account.id) === String(adminDepositForm.accountId));
    setSubmittedDeposit({
      accountId: selectedAccount?.id || adminDepositForm.accountId,
      accountHolder: selectedAccount?.accountHolder || "Unknown Holder",
      accountNumber: selectedAccount?.accountNumber || "-",
      amount: Number(adminDepositForm.amount || 0),
      description: adminDepositForm.description || "Admin deposit",
      submittedAt: new Date().toLocaleString(),
    });
    onAdminDeposit(event);
  }

  function handleAnotherDeposit() {
    setDepositSuccess(false);
    setSubmittedDeposit(null);
    if (setAdminDepositMessage) setAdminDepositMessage("");
  }

  return (
    <article className="panel wide">
      <h3>Deposit for Customer</h3>
      {depositSuccess ? (
        <div className="transfer-success-screen">
          <h2>Deposit Completed Successfully</h2>
          <p className="hint">The customer account has been credited successfully.</p>
          <div className="success-details">
            <p><strong>Account Holder:</strong> {submittedDeposit?.accountHolder || "Unknown Holder"}</p>
            <p><strong>Account Number:</strong> {submittedDeposit?.accountNumber || "-"}</p>
            <p><strong>Deposit Amount:</strong> FJD {Number(submittedDeposit?.amount || 0).toLocaleString()}</p>
            <p><strong>Description:</strong> {submittedDeposit?.description || "Admin deposit"}</p>
            <p><strong>Submitted:</strong> {submittedDeposit?.submittedAt || "N/A"}</p>
          </div>
          <div className="transfer-success-actions">
            <button type="button" onClick={handleAnotherDeposit}>Make Another Deposit</button>
          </div>
        </div>
      ) : (
        <>
          <form className="admin-form" onSubmit={handleSubmit}>
            <label>
              Customer Account
              <select
                value={adminDepositForm.accountId}
                onChange={(e) => setAdminDepositForm({ ...adminDepositForm, accountId: e.target.value })}
                required
              >
                <option value="">Select account</option>
                {eligibleAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.id} | {a.accountHolder || "Unknown Holder"} | {a.accountNumber || "-"} | Customer {a.customerId} | FJD {Number(a.balance || 0).toFixed(2)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Deposit Amount (FJD)
              <div className="loan-currency-input">
                <span className="loan-currency-prefix">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={adminDepositForm.amount}
                  onChange={(e) => setAdminDepositForm({ ...adminDepositForm, amount: e.target.value })}
                  required
                />
              </div>
            </label>

            <label>
              Description
              <input
                value={adminDepositForm.description}
                onChange={(e) => setAdminDepositForm({ ...adminDepositForm, description: e.target.value })}
                placeholder="Admin cash deposit"
              />
            </label>

            <button type="submit">Deposit Now</button>
          </form>
          <p className="status">{adminDepositMessage}</p>
        </>
      )}
    </article>
  );
}
