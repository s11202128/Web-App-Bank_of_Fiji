import { useMemo, useState } from "react";

export default function AdminCustomersTab({ customers, accounts = [], onAdminUpdateCustomer }) {
  const [tinInputs, setTinInputs] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const customerAccountData = useMemo(() => {
    return accounts.reduce((map, account) => {
      const customerId = String(account.customerId || "");
      if (!customerId) {
        return map;
      }
      if (!map[customerId]) {
        map[customerId] = {
          numbers: [],
          ids: [],
          types: [],
          balances: [],
        };
      }

      if (account.accountNumber) {
        map[customerId].numbers.push(String(account.accountNumber));
      }
      if (account.id !== undefined && account.id !== null) {
        map[customerId].ids.push(String(account.id));
      }
      if (account.type) {
        map[customerId].types.push(String(account.type));
      }

      const parsedBalance = Number(account.balance);
      const balanceLabel = Number.isFinite(parsedBalance) ? `FJD ${parsedBalance.toFixed(2)}` : "FJD 0.00";
      map[customerId].balances.push(balanceLabel);
      return map;
    }, {});
  }, [accounts]);

  const filteredCustomers = customers.filter((customer) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return true;
    }
    const accountEntry = customerAccountData[String(customer.id)] || {
      numbers: [],
      ids: [],
      types: [],
      balances: [],
    };
    return [customer.fullName, customer.email, customer.mobile, customer.nationalId, ...accountEntry.numbers, ...accountEntry.ids, ...accountEntry.types, ...accountEntry.balances]
      .some((value) => String(value || "").toLowerCase().includes(query));
  });

  return (
    <article className="panel wide admin-customers-panel">
      <h3>Customer Management</h3>
      <div className="inline-controls admin-customers-toolbar">
        <label>
          Search Customers
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, phone, ID, or account number"
          />
        </label>
      </div>
      <div className="table-wrapper admin-customers-table-wrap">
        <table className="admin-customers-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Account Number</th>
              <th>Account ID</th>
              <th>Account Type</th>
              <th>Balance</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>National ID</th>
              <th>Residency</th>
              <th>TIN</th>
              <th>Verification</th>
              <th>Registration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c) => {
              const accountEntry = customerAccountData[String(c.id)] || {
                numbers: [],
                ids: [],
                types: [],
                balances: [],
              };
              return (
                <tr key={c.id}>
                  <td className="monospace">{c.id}</td>
                  <td className="monospace">{accountEntry.numbers.length ? accountEntry.numbers.join(", ") : "-"}</td>
                  <td className="monospace">{accountEntry.ids.length ? accountEntry.ids.join(", ") : "-"}</td>
                  <td>{accountEntry.types.length ? accountEntry.types.join(", ") : "-"}</td>
                  <td>{accountEntry.balances.length ? accountEntry.balances.join(", ") : "-"}</td>
                  <td>{c.fullName}</td>
                  <td>{c.email}</td>
                  <td className="monospace">{c.mobile}</td>
                  <td className="monospace">{c.nationalId || "-"}</td>
                  <td>{c.residencyStatus || "resident"}</td>
                  <td className="monospace">{c.tin || "-"}</td>
                  <td>{c.identityVerified ? "Verified" : c.emailVerified ? "Email Verified" : "Pending"}</td>
                  <td>{c.registrationStatus || "approved"}</td>
                  <td>{c.status || "active"}</td>
                  <td>
                    <div className="inline-controls admin-customer-actions">
                      <input
                        placeholder="TIN"
                        value={tinInputs[c.id] ?? c.tin ?? ""}
                        onChange={(e) => setTinInputs({ ...tinInputs, [c.id]: e.target.value })}
                      />
                      <button type="button" onClick={() => onAdminUpdateCustomer(c.id, { tin: tinInputs[c.id] ?? c.tin ?? "" })}>
                        Update TIN
                      </button>
                      <button type="button" onClick={() => onAdminUpdateCustomer(c.id, { residencyStatus: "resident" })}>Resident</button>
                      <button type="button" onClick={() => onAdminUpdateCustomer(c.id, { residencyStatus: "non-resident" })}>Non-Resident</button>
                      <button type="button" onClick={() => onAdminUpdateCustomer(c.id, { identityVerified: true })}>Verify ID</button>
                      <button type="button" onClick={() => onAdminUpdateCustomer(c.id, { emailVerified: true })}>Verify Email</button>
                      <button type="button" onClick={() => onAdminUpdateCustomer(c.id, { registrationStatus: "approved" })}>Approve</button>
                      <button type="button" onClick={() => onAdminUpdateCustomer(c.id, { status: "disabled" })}>Disable</button>
                      <button type="button" onClick={() => onAdminUpdateCustomer(c.id, { status: "locked" })}>Lock</button>
                      <button type="button" onClick={() => onAdminUpdateCustomer(c.id, { status: "active", failedLoginAttempts: 0, lockedUntil: null })}>Unlock</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
