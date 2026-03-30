export default function ProfileTab({ profileForm, setProfileForm, onUpdateProfile, profileMessage }) {
  return (
    <section className="panel-grid">
      <article className="panel wide">
        <h2>Profile Management</h2>
        <form className="admin-form" onSubmit={onUpdateProfile}>
          <label>
            Full Name
            <input
              value={profileForm.fullName}
              readOnly
              disabled
              required
            />
            <p className="hint">Name changes require in-person verification at a Bank of Fiji branch.</p>
          </label>
          <label>
            Email Address
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              required
            />
          </label>
          <label>
            Phone Number
            <input
              value={profileForm.mobile}
              onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
              required
            />
          </label>
          <label>
            Current Password
            <input
              type="password"
              value={profileForm.currentPassword}
              onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
              placeholder="Required only when changing password"
            />
          </label>
          <label>
            New Password
            <input
              type="password"
              value={profileForm.newPassword}
              onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
              placeholder="Leave blank to keep current password"
            />
          </label>
          <button type="submit" className="btn-primary">Save Profile</button>
        </form>
        {profileMessage && <p className={`status ${profileMessage.toLowerCase().includes("success") ? "success" : "error"}`}>{profileMessage}</p>}
      </article>
    </section>
  );
}