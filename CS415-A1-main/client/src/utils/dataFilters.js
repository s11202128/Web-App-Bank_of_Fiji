/**
 * filterDataByScope — SRP: only responsible for scoping raw API rows to the
 * records a given session is allowed to see.
 *
 * OCP: new data types can be scoped by extending the rawData shape and return
 * value without modifying existing filter logic.
 *
 * @param {object} rawData
 * @param {Array}  rawData.customers
 * @param {Array}  rawData.accounts
 * @param {Array}  rawData.bills
 * @param {Array}  rawData.loans
 * @param {Array}  rawData.summaries
 * @param {object} scope
 * @param {boolean} scope.hasAdminScope   - true → return all rows
 * @param {string|number} scope.activeCustomerId
 * @returns {{ customers, accounts, scheduledBills, loanApplications, summaries }}
 */
export function filterDataByScope(rawData, { hasAdminScope, activeCustomerId }) {
  const { customers, accounts, bills, loans, summaries } = rawData;

  const visibleCustomers = hasAdminScope
    ? customers
    : customers.filter((c) => String(c.id) === String(activeCustomerId));

  const visibleCustomerIds = new Set(visibleCustomers.map((c) => String(c.id)));

  const visibleAccounts = hasAdminScope
    ? accounts
    : accounts.filter((a) => visibleCustomerIds.has(String(a.customerId)));

  const visibleAccountIds = new Set(visibleAccounts.map((a) => String(a.id)));

  const visibleScheduledBills = hasAdminScope
    ? bills
    : bills.filter((b) => {
        const byAccount = b.accountId && visibleAccountIds.has(String(b.accountId));
        const byCustomer = b.customerId && visibleCustomerIds.has(String(b.customerId));
        return byAccount || byCustomer;
      });

  const visibleLoanApplications = hasAdminScope
    ? loans
    : loans.filter((l) => visibleCustomerIds.has(String(l.customerId)));

  const visibleSummaries = hasAdminScope
    ? summaries
    : summaries.filter((s) => visibleCustomerIds.has(String(s.customerId)));

  return {
    customers: visibleCustomers,
    accounts: visibleAccounts,
    scheduledBills: visibleScheduledBills,
    loanApplications: visibleLoanApplications,
    summaries: visibleSummaries,
  };
}
