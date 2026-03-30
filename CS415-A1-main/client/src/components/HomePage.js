function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatLastUpdated(value) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleString("en-FJ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCif(currentUser) {
  const raw = currentUser?.customerId || currentUser?.userId || currentUser?.id || "";
  return String(raw).padStart(7, "0");
}

export default function HomePage({ totalBalance, currentUser, lastUpdatedAt, onRefreshOverview, isRefreshing }) {
  const displayName = (currentUser?.fullName || "Customer").toUpperCase();
  const firstName = (currentUser?.fullName || "Customer").split(" ")[0];
  const greeting = getGreeting();
  const currentDate = new Date().toLocaleDateString("en-FJ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="overview-shell">
      <article className="panel overview-header-card">
        <div className="overview-header">
          <div>
            <p className="overview-date">{currentDate}</p>
            <p className="overview-welcome">{greeting}, {firstName}!</p>
          </div>

          <div className="overview-meta">
            <span>Last update {formatLastUpdated(lastUpdatedAt)}</span>
            <button type="button" className="link-btn overview-refresh" onClick={onRefreshOverview} disabled={isRefreshing}>
              {isRefreshing ? "Updating..." : "Update now"}
            </button>
            <p className="overview-cif">CIF: {formatCif(currentUser)}</p>
          </div>
        </div>
      </article>

      <article className="panel overview-balance-card">
        <div className="overview-balance-icon" aria-hidden="true">$</div>
        <div className="overview-balance-content">
          <p className="overview-balance-label">Total balance by currency</p>
          <h2 className="overview-balance-value">{totalBalance.toFixed(2)} FJD</h2>
        </div>
      </article>
    </section>
  );
}
