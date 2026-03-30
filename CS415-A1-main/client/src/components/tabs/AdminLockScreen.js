export default function AdminLockScreen({ adminAuthForm, setAdminAuthForm, onVerifyAdminAccess, adminAuthMessage }) {
  return (
    <section className="panel-grid">
      <article className="panel auth-card">
        <h2>Admin Access</h2>
        <p className="hint">Enter admin email and password to open the admin dashboard.</p>
        <form onSubmit={onVerifyAdminAccess}>
          <label>
            Admin Email
            <input
              type="email"
              value={adminAuthForm.email}
              onChange={(e) => setAdminAuthForm({ ...adminAuthForm, email: e.target.value })}
              required
            />
          </label>
          <label>
            Admin Password
            <input
              type="password"
              value={adminAuthForm.password}
              onChange={(e) => setAdminAuthForm({ ...adminAuthForm, password: e.target.value })}
              required
            />
          </label>
          <button type="submit">Unlock Admin Page</button>
        </form>
        {adminAuthMessage && <p className="status">{adminAuthMessage}</p>}
      </article>
    </section>
  );
}
