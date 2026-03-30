import { useState } from "react";
import { jsPDF } from "jspdf";

export default function StatementsTab({
  accounts = [],
  transactions = [],
  statementRequests = [],
}) {
  const [activeSection, setActiveSection] = useState("Statement Preview");
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [monthsFilter, setMonthsFilter] = useState("all");
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeStatementRequests = Array.isArray(statementRequests) ? statementRequests : [];
  const hasAccounts = safeAccounts.length > 0;

  const formatDateTime = (value) => new Date(value).toLocaleString();
  const formatAmount = (value) => `FJD ${Number(value || 0).toFixed(2)}`;

  // Filter transactions based on type
  const filteredRows = safeTransactions.filter((r) => {
    if (filterType === "all") return true;
    return r.kind === filterType;
  });

  // Sort transactions
  const sortedRows = [...filteredRows].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  // Calculate summary statistics
  const totalCredit = safeTransactions
    .filter((r) => r.kind === "credit")
    .reduce((sum, r) => sum + r.amount, 0);
  const totalDebit = safeTransactions
    .filter((r) => r.kind === "debit")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalRequests = safeStatementRequests.length;

  const monthlyDocuments = Object.entries(
    safeTransactions.reduce((acc, row) => {
      const date = new Date(row.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(row);
      return acc;
    }, {})
  )
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, rows]) => {
      const monthDate = new Date(`${monthKey}-01T00:00:00`);
      return {
        key: monthKey,
        rows,
        monthLabel: monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
      };
    });

  const downloadMonthlyStatementPdf = (monthDoc) => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 14;
    const pageWidth = 210;
    const pageHeight = 297;
    const contentWidth = pageWidth - margin * 2;
    const rowHeight = 7;
    const statementRef = `BOF-${monthDoc.key.replace("-", "")}-${Date.now().toString().slice(-6)}`;
    let y = 0;

    const monthCredits = monthDoc.rows
      .filter((row) => row.kind === "credit")
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const monthDebits = monthDoc.rows
      .filter((row) => row.kind === "debit")
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const monthNet = monthCredits - monthDebits;

    const addFooter = () => {
      const pageNumber = doc.getNumberOfPages();
      doc.setDrawColor(220, 226, 235);
      doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
      doc.setTextColor(100, 110, 126);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Bank of Fiji | Confidential Banking Document", margin, pageHeight - 9);
      doc.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 9, { align: "right" });
      doc.setTextColor(0, 0, 0);
    };

    const addHeader = () => {
      y = 18;
      doc.setFillColor(0, 76, 125);
      doc.roundedRect(margin, y - 10, contentWidth, 24, 2, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("BANK OF FIJI", margin + 4, y);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Monthly E-Statement", margin + 4, y + 7);
      doc.setFont("helvetica", "bold");
      doc.text("Secure. Trusted. Local.", pageWidth - margin - 4, y + 7, { align: "right" });

      y += 20;
      doc.setTextColor(20, 30, 45);
      doc.setFillColor(245, 248, 252);
      doc.roundedRect(margin, y, contentWidth, 21, 1.5, 1.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Statement Details", margin + 4, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Period: ${monthDoc.monthLabel}`, margin + 4, y + 12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin + 4, y + 17);
      doc.text(`Reference: ${statementRef}`, pageWidth - margin - 4, y + 12, { align: "right" });
      doc.text("Currency: FJD", pageWidth - margin - 4, y + 17, { align: "right" });

      y += 27;
      const boxGap = 3;
      const boxWidth = (contentWidth - boxGap * 3) / 4;
      const summaryItems = [
        ["Transactions", String(monthDoc.rows.length)],
        ["Total Credits", formatAmount(monthCredits)],
        ["Total Debits", formatAmount(monthDebits)],
        ["Net Movement", formatAmount(monthNet)],
      ];

      summaryItems.forEach(([label, value], index) => {
        const x = margin + index * (boxWidth + boxGap);
        doc.setFillColor(248, 250, 253);
        doc.setDrawColor(215, 223, 235);
        doc.roundedRect(x, y, boxWidth, 17, 1.2, 1.2, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(85, 98, 118);
        doc.text(label, x + 2.5, y + 6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(20, 30, 45);
        doc.text(value, x + 2.5, y + 13);
      });

      y += 23;
    };

    const drawTableHeader = () => {
      doc.setFillColor(18, 60, 99);
      doc.rect(margin, y, contentWidth, rowHeight, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Date & Time", margin + 2, y + 4.8);
      doc.text("Type", margin + 58, y + 4.8);
      doc.text("Description", margin + 84, y + 4.8);
      doc.text("Amount (FJD)", pageWidth - margin - 2, y + 4.8, { align: "right" });
      doc.setTextColor(20, 30, 45);
      y += rowHeight;
    };

    const ensureSpace = (requiredHeight) => {
      if (y + requiredHeight > pageHeight - 18) {
        addFooter();
        doc.addPage();
        addHeader();
        drawTableHeader();
      }
    };

    addHeader();
    drawTableHeader();

    monthDoc.rows
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach((row, index) => {
        const descriptionLines = doc.splitTextToSize(row.description || "-", 72);
        const rowBlockHeight = Math.max(rowHeight, descriptionLines.length * 4.5 + 3);

        ensureSpace(rowBlockHeight + 1);

        if (index % 2 === 0) {
          doc.setFillColor(248, 251, 255);
          doc.rect(margin, y, contentWidth, rowBlockHeight, "F");
        }

        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y + rowBlockHeight, pageWidth - margin, y + rowBlockHeight);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.8);
        doc.setTextColor(28, 38, 52);
        doc.text(formatDateTime(row.createdAt), margin + 2, y + 5);

        const kindLabel = (row.kind || "-").toUpperCase();
        doc.setFont("helvetica", "bold");
        doc.setTextColor(kindLabel === "CREDIT" ? 8 : 140, kindLabel === "CREDIT" ? 120 : 35, kindLabel === "CREDIT" ? 68 : 35);
        doc.text(kindLabel, margin + 58, y + 5);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(28, 38, 52);
        doc.text(descriptionLines, margin + 84, y + 5);
        doc.text(formatAmount(row.amount), pageWidth - margin - 2, y + 5, { align: "right" });

        y += rowBlockHeight;
      });

    addFooter();

    doc.save(`statement-${monthDoc.key}.pdf`);
  };

  return (
    <section className="panel-grid">
      <article className="panel wide">
        <nav className="acct-tab-bar">
          {["Statement Preview", "E Documents"].map((s) => (
            <button key={s} type="button" className={`acct-tab-btn${activeSection === s ? " active" : ""}`} onClick={() => setActiveSection(s)}>{s}</button>
          ))}
        </nav>
        <div className="acct-tab-body">
          {!hasAccounts && (
            <p className="status error">No account found. Open an account before accessing statement services.</p>
          )}

          {activeSection === "Statement Preview" && (
            <>
              <h2>Statement Preview</h2>
              <div className="inline-controls">
                <label>
                  Filter by Type
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="all">All Transactions</option>
                    <option value="credit">Credit (Deposits)</option>
                    <option value="debit">Debit (Withdrawals)</option>
                  </select>
                </label>
                <label>
                  Sort
                  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </label>
                <p className="hint">Total requests: {totalRequests}</p>
              </div>
              {safeTransactions.length > 0 && (
                <div className="statement-summary">
                  <div className="summary-card"><strong>Total Credits:</strong> FJD {totalCredit.toFixed(2)}</div>
                  <div className="summary-card"><strong>Total Debits:</strong> FJD {totalDebit.toFixed(2)}</div>
                  <div className="summary-card"><strong>Net Change:</strong> FJD {(totalCredit - totalDebit).toFixed(2)}</div>
                  <div className="summary-card"><strong>Transaction Count:</strong> {sortedRows.length}</div>
                </div>
              )}
              {safeTransactions.length === 0 ? (
                <p className="no-data">{hasAccounts ? "No transactions yet. Complete a transfer or bill payment to see your history here." : "Statement preview is unavailable until you open an account."}</p>
              ) : sortedRows.length === 0 ? (
                <p className="no-data">No transactions match the selected filter.</p>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((row) => (
                        <tr key={row.id}>
                          <td>{formatDateTime(row.createdAt)}</td>
                          <td>{row.kind}</td>
                          <td>{row.description || "-"}</td>
                          <td>{formatAmount(row.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeSection === "E Documents" && (
            <>
              <h2>E Documents</h2>
              <p className="hint">Download monthly PDF statements from your transaction history.</p>
              {!hasAccounts ? (
                <p className="no-data">E-documents are unavailable until you open an account.</p>
              ) : monthlyDocuments.length === 0 ? (
                <p className="no-data">No monthly documents available yet.</p>
              ) : (
                <>
                  <div className="inline-controls">
                    <label>
                      Show Months
                      <select value={monthsFilter} onChange={(e) => setMonthsFilter(e.target.value)}>
                        <option value="1">Last 1 Month</option>
                        <option value="3">Last 3 Months</option>
                        <option value="6">Last 6 Months</option>
                        <option value="12">Last 12 Months</option>
                        <option value="all">All Time</option>
                      </select>
                    </label>
                  </div>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Transactions</th>
                          <th>Total Credits</th>
                          <th>Total Debits</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(monthsFilter === "all" ? monthlyDocuments : monthlyDocuments.slice(0, Number(monthsFilter))).map((monthDoc) => {
                          const monthCredits = monthDoc.rows
                            .filter((row) => row.kind === "credit")
                            .reduce((sum, row) => sum + Number(row.amount || 0), 0);
                          const monthDebits = monthDoc.rows
                            .filter((row) => row.kind === "debit")
                            .reduce((sum, row) => sum + Number(row.amount || 0), 0);

                          return (
                            <tr key={monthDoc.key}>
                              <td>{monthDoc.monthLabel}</td>
                              <td>{monthDoc.rows.length}</td>
                              <td>{formatAmount(monthCredits)}</td>
                              <td>{formatAmount(monthDebits)}</td>
                              <td>
                                <button type="button" onClick={() => downloadMonthlyStatementPdf(monthDoc)}>
                                  Download PDF
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

        </div>
      </article>
    </section>
  );
}
