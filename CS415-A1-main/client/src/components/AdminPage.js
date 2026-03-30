import { useState } from "react";
import AdminOverviewTab from "./admin/AdminOverviewTab";
import AdminCustomersTab from "./admin/AdminCustomersTab";
import AdminAccountsTab from "./admin/AdminAccountsTab";
import AdminDepositsTab from "./admin/AdminDepositsTab";
import AdminLoansTab from "./admin/AdminLoansTab";
import AdminMonitoringTab from "./admin/AdminMonitoringTab";
import ComplianceTab from "./tabs/ComplianceTab";

const ADMIN_SECTIONS = ["Overview", "Customers", "Accounts", "Deposits", "Loans", "Monitoring", "Compliance"];

export default function AdminPage({
  customers,
  accounts,
  transactions,
  scheduledBills,
  loanApplications,
  summaries,
  selectedAccountForTx,
  setSelectedAccountForTx,
  adminAccountForm,
  setAdminAccountForm,
  onCreateAdminAccount,
  adminAccountMessage,
  adminDepositForm,
  setAdminDepositForm,
  onAdminDeposit,
  adminDepositMessage,
  setAdminDepositMessage,
  adminMessage,
  onAdminUpdateCustomer,
  onAdminUpdateAccount,
  onAdminFreezeAccount,
  onAdminUpdateLoanStatus,
  adminTransferLimit,
  setAdminTransferLimit,
  onAdminUpdateTransferLimit,
  onAdminReverseTransaction,
  adminLoginLogs,
  adminNotificationLogs,
  adminReport,
  adminLastUpdated,
  interestRate,
  setInterestRate,
  onUpdateRate,
  summaryYear,
  setSummaryYear,
  onGenerateSummaries,
  complianceMessage,
}) {
  const [activeSection, setActiveSection] = useState("Overview");

  return (
    <div className="admin-grid">
      <section className="panel-grid">
        <article className="panel wide">
          <h2>Admin Dashboard</h2>
        </article>
      </section>

      <div className="workspace-layout">
        <aside className="left-tabs">
          <div className="admin-tabs" role="tablist" aria-label="Admin sections">
            {ADMIN_SECTIONS.map((section) => (
              <button
                key={section}
                type="button"
                className={activeSection === section ? "admin-tab active" : "admin-tab"}
                onClick={() => setActiveSection(section)}
              >
                {section}
              </button>
            ))}
          </div>
        </aside>

        <section className="tab-content">
          {activeSection === "Overview" && (
            <AdminOverviewTab
              customers={customers}
              accounts={accounts}
              adminReport={adminReport}
              adminLastUpdated={adminLastUpdated}
              adminMessage={adminMessage}
            />
          )}
          {activeSection === "Customers" && (
            <AdminCustomersTab
              customers={customers}
              accounts={accounts}
              onAdminUpdateCustomer={onAdminUpdateCustomer}
            />
          )}
          {activeSection === "Accounts" && (
            <AdminAccountsTab
              accounts={accounts}
              adminAccountForm={adminAccountForm}
              setAdminAccountForm={setAdminAccountForm}
              onCreateAdminAccount={onCreateAdminAccount}
              adminAccountMessage={adminAccountMessage}
              onAdminUpdateAccount={onAdminUpdateAccount}
              onAdminFreezeAccount={onAdminFreezeAccount}
            />
          )}
          {activeSection === "Deposits" && (
            <AdminDepositsTab
              accounts={accounts}
              adminDepositForm={adminDepositForm}
              setAdminDepositForm={setAdminDepositForm}
              onAdminDeposit={onAdminDeposit}
              adminDepositMessage={adminDepositMessage}
              setAdminDepositMessage={setAdminDepositMessage}
            />
          )}
          {activeSection === "Loans" && (
            <AdminLoansTab loanApplications={loanApplications} onAdminUpdateLoanStatus={onAdminUpdateLoanStatus} />
          )}
          {activeSection === "Monitoring" && (
            <AdminMonitoringTab
              accounts={accounts}
              transactions={transactions}
              selectedAccountForTx={selectedAccountForTx}
              setSelectedAccountForTx={setSelectedAccountForTx}
              adminTransferLimit={adminTransferLimit}
              setAdminTransferLimit={setAdminTransferLimit}
              onAdminUpdateTransferLimit={onAdminUpdateTransferLimit}
              onAdminReverseTransaction={onAdminReverseTransaction}
              adminLoginLogs={adminLoginLogs}
              adminNotificationLogs={adminNotificationLogs}
            />
          )}
          {activeSection === "Compliance" && (
            <ComplianceTab
              interestRate={interestRate}
              setInterestRate={setInterestRate}
              onUpdateRate={onUpdateRate}
              summaryYear={summaryYear}
              setSummaryYear={setSummaryYear}
              onGenerateSummaries={onGenerateSummaries}
              summaries={summaries}
              complianceMessage={complianceMessage}
            />
          )}
        </section>
      </div>
    </div>
  );
}

