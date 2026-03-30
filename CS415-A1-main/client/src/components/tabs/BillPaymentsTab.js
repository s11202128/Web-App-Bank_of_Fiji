import { useState } from "react";

export default function BillPaymentsTab({
  accounts,
  manualBillForm,
  setManualBillForm,
  onManualBill,
  scheduleBillForm,
  setScheduleBillForm,
  onScheduleBill,
  billHistory,
  runScheduledBill,
  billMessage,
}) {
  const manualPayeeOptions = [
    "EFL Electricity",
    "Water Authority Fiji",
    "Vodafone Fiji",
    "Digicel Fiji",
    "FNPF Contribution",
    "Municipal Rates",
  ];

  const [activeBillTab, setActiveBillTab] = useState("pay");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const hasAccounts = (accounts || []).length > 0;

  const hasSharedBillDetails = Boolean(manualBillForm.payee && manualBillForm.amount);

  function updateSharedBillDetails(field, value) {
    setManualBillForm({ ...manualBillForm, [field]: value });
    setScheduleBillForm({ ...scheduleBillForm, [field]: value });
  }

  function handleBillSubmit(e) {
    if (scheduleEnabled) {
      onScheduleBill(e);
      return;
    }
    onManualBill(e);
  }

  return (
    <section className="panel-grid">
      <article className="panel wide">
        <nav className="acct-tab-bar">
          <button type="button" className={`acct-tab-btn${activeBillTab === "pay" ? " active" : ""}`} onClick={() => setActiveBillTab("pay")}>Pay a Bill</button>
          <button type="button" className={`acct-tab-btn${activeBillTab === "history" ? " active" : ""}`} onClick={() => setActiveBillTab("history")}>Bill History</button>
        </nav>

        <div className="acct-tab-body">
        {!hasAccounts && (
          <p className="status error">No account found. Open an account before using bill payment services.</p>
        )}
        {activeBillTab === "pay" ? (
          <>
          <form onSubmit={handleBillSubmit}>
            <label>
              Schedule Option
              <select
                value={scheduleEnabled ? "on" : "off"}
                onChange={(e) => setScheduleEnabled(e.target.value === "on")}
              >
                <option value="off">Off</option>
                <option value="on">On</option>
              </select>
            </label>
            <label>
              Payee
              <select
                value={manualBillForm.payee}
                onChange={(e) => updateSharedBillDetails("payee", e.target.value)}
                required
              >
                <option value="">Select biller</option>
                {manualPayeeOptions.map((payee) => (
                  <option key={payee} value={payee}>{payee}</option>
                ))}
              </select>
            </label>
            <label>
              Amount
              <input
                type="number"
                min="1"
                step="0.01"
                value={manualBillForm.amount}
                onChange={(e) => updateSharedBillDetails("amount", e.target.value)}
                required
              />
            </label>
            {scheduleEnabled && (
              <>
                <label>
                  Scheduled Date
                  <input
                    type="date"
                    value={scheduleBillForm.scheduledDate}
                    onChange={(e) => setScheduleBillForm({ ...scheduleBillForm, scheduledDate: e.target.value })}
                    required
                  />
                </label>
                <p className="hint">Schedule is ON. Payment will be processed on the selected date.</p>
              </>
            )}
            <button
              type="submit"
              disabled={!hasAccounts || !hasSharedBillDetails || (scheduleEnabled && !scheduleBillForm.scheduledDate)}
            >
              {scheduleEnabled ? "Schedule" : "Pay Now"}
            </button>
          </form>
          <p className="status">{billMessage}</p>
          </>
        ) : (
          <>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Account</th>
                <th>Payee</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {billHistory.length === 0 ? (
                <tr>
                  <td colSpan="7">No bill history available.</td>
                </tr>
              ) : (
                billHistory.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{b.accountId || "-"}</td>
                    <td>{b.payee}</td>
                    <td>FJD {b.amount.toFixed(2)}</td>
                    <td>{b.scheduledDate || b.createdAt}</td>
                    <td>{b.status}</td>
                    <td>
                      <button disabled={b.status !== "scheduled"} onClick={() => runScheduledBill(b.id)}>
                        Run
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <p className="status">{billMessage}</p>
          </>
        )}
        </div>
      </article>
    </section>
  );
}
