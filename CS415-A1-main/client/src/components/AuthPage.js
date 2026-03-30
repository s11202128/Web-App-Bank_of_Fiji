import { useState } from "react";
import { api, setToken } from "../api";
import BankBrand from "./BankBrand";

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function AuthPage({ onLoginSuccess, currentYear }) {
  const [authView, setAuthView] = useState("login");
  const [authForm, setAuthForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [resetForm, setResetForm] = useState({ email: "", resetId: "", code: "", newPassword: "", confirmPassword: "" });
  const [authMessage, setAuthMessage] = useState("");
  const [authHint, setAuthHint] = useState("");
  const [showPw, setShowPw] = useState({});
  const [loginPasswordError, setLoginPasswordError] = useState("");

  function togglePw(key) {
    setShowPw((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function onAuthViewChange(view) {
    setAuthView(view);
    setAuthMessage("");
    setAuthHint("");
    setLoginPasswordError("");
  }

  async function onLogin(e) {
    e.preventDefault();
    setAuthMessage("");
    setLoginPasswordError("");
    try {
      const result = await api.login({ email: authForm.email, password: authForm.password });
      setToken(result.token);
      onLoginSuccess(result.token, {
        fullName: result.fullName,
        userId: result.userId,
        customerId: result.customerId,
        email: result.email,
        mobile: result.mobile,
        nationalId: result.nationalId,
        isAdmin: Boolean(result.isAdmin),
      });
    } catch (err) {
      const genericMessage = "Invalid email or password.";
      setLoginPasswordError(genericMessage);
      setAuthMessage(genericMessage);
    }
  }

  async function onRegister(e) {
    e.preventDefault();
    setAuthMessage("");
    if (authForm.password !== authForm.confirmPassword) {
      setAuthMessage("Passwords do not match");
      return;
    }
    try {
      const result = await api.register({
        fullName: authForm.fullName,
        mobile: authForm.mobile,
        email: authForm.email,
        password: authForm.password,
        confirmPassword: authForm.confirmPassword,
      });
      setAuthMessage(result.message || "Registration successful. You can now sign in.");
      setAuthHint("");
      setAuthView("login");
      setAuthForm({ ...authForm, password: "", confirmPassword: "" });
    } catch (err) {
      setAuthMessage(err.message);
    }
  }

  async function onRequestReset(e) {
    e.preventDefault();
    setAuthMessage("");
    try {
      const result = await api.requestPasswordReset({ email: resetForm.email });
      setAuthMessage(result.message || "Password reset code generated.");
      setAuthHint(result.simulatedResetCode ? `Reset ID: ${result.resetId} | Code: ${result.simulatedResetCode}` : "");
      setResetForm((prev) => ({
        ...prev,
        resetId: result.resetId || "",
        code: result.simulatedResetCode || "",
      }));
      setAuthView("reset");
    } catch (err) {
      setAuthMessage(err.message);
    }
  }

  async function onResetPassword(e) {
    e.preventDefault();
    setAuthMessage("");
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setAuthMessage("Passwords do not match");
      return;
    }
    try {
      await api.resetPassword({
        email: resetForm.email,
        resetId: resetForm.resetId,
        otp: resetForm.code,
        newPassword: resetForm.newPassword,
      });
      setAuthMessage("Password reset complete. Sign in with your new password.");
      setAuthHint("");
      setAuthView("login");
    } catch (err) {
      setAuthMessage(err.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <BankBrand
          className="auth-hero-brand"
          title="Bank of Fiji"
          subtitle={authView === "login" ? "Sign in to access your banking dashboard." : "Create your online banking account."}
        />
      </header>
      <section className="panel-grid">
        <article className="panel auth-card">
          {authView === "login" ? (
            <>
              <h2>Sign In</h2>
              <form onSubmit={onLogin}>
                <label>
                  Email
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    required
                    autoComplete="email"
                  />
                </label>
                <label>
                  Password
                  <div className="pw-wrap">
                    <input
                      className={loginPasswordError ? "auth-input-error" : ""}
                      type={showPw.loginPw ? "text" : "password"}
                      value={authForm.password}
                      onChange={(e) => {
                        setAuthForm({ ...authForm, password: e.target.value });
                        if (loginPasswordError) {
                          setLoginPasswordError("");
                          setAuthMessage("");
                        }
                      }}
                      required
                      autoComplete="current-password"
                    />
                    <button type="button" className="pw-toggle" onClick={() => togglePw("loginPw")} aria-label={showPw.loginPw ? "Hide password" : "Show password"}>
                      <EyeIcon open={showPw.loginPw} />
                    </button>
                  </div>
                  {loginPasswordError && <p className="auth-inline-error">{loginPasswordError}</p>}
                </label>
                <button type="submit" className="btn-primary">Sign In</button>
              </form>
              {authMessage && <p className={authMessage.startsWith("Registration") ? "status ok" : "status error"}>{authMessage}</p>}
              <div className="auth-switch-row">
                <button type="button" className="auth-action-row" onClick={() => onAuthViewChange("register")}>
                  <span className="auth-action-row__label">New customer?</span>
                  <span className="auth-action-row__cta">Create an account <span className="auth-action-row__arrow">&#8594;</span></span>
                </button>
                <button type="button" className="auth-action-row" onClick={() => onAuthViewChange("forgot")}>
                  <span className="auth-action-row__label">Forgot your password?</span>
                  <span className="auth-action-row__cta">Recover access <span className="auth-action-row__arrow">&#8594;</span></span>
                </button>
              </div>
            </>
          ) : authView === "register" ? (
            <>
              <h2>Create Account</h2>
              <form onSubmit={onRegister}>
                <label>
                  Full Name
                  <input
                    value={authForm.fullName}
                    onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                    required
                    autoComplete="name"
                  />
                </label>
                <label>
                  Mobile Number
                  <input
                    value={authForm.mobile}
                    placeholder="+6797001001"
                    onChange={(e) => setAuthForm({ ...authForm, mobile: e.target.value })}
                    required
                    autoComplete="tel"
                  />
                </label>
                <label>
                  Email Address
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    required
                    autoComplete="email"
                  />
                </label>
                <label>
                  Password <span className="hint-inline">(min 8 characters)</span>
                  <div className="pw-wrap">
                    <input
                      type={showPw.regPw ? "text" : "password"}
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <button type="button" className="pw-toggle" onClick={() => togglePw("regPw")} aria-label={showPw.regPw ? "Hide password" : "Show password"}>
                      <EyeIcon open={showPw.regPw} />
                    </button>
                  </div>
                </label>
                <label>
                  Confirm Password
                  <div className="pw-wrap">
                    <input
                      type={showPw.regConfirm ? "text" : "password"}
                      value={authForm.confirmPassword}
                      onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                      required
                      autoComplete="new-password"
                    />
                    <button type="button" className="pw-toggle" onClick={() => togglePw("regConfirm")} aria-label={showPw.regConfirm ? "Hide password" : "Show password"}>
                      <EyeIcon open={showPw.regConfirm} />
                    </button>
                  </div>
                </label>
                <button type="submit" className="btn-primary">Create Account</button>
              </form>
              {authMessage && <p className="status error">{authMessage}</p>}
              {authHint && <p className="otp-notice">{authHint}</p>}
              <p className="auth-switch">
                Already have an account?{" "}
                <button type="button" className="link-btn" onClick={() => onAuthViewChange("login")}>
                  Sign in here
                </button>
              </p>
            </>
          ) : authView === "forgot" ? (
            <>
              <h2>Forgot Password</h2>
              <form onSubmit={onRequestReset}>
                <label>
                  Email Address
                  <input
                    type="email"
                    value={resetForm.email}
                    onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })}
                    required
                  />
                </label>
                <button type="submit" className="btn-primary">Send Reset Code</button>
              </form>
              {authMessage && <p className="status error">{authMessage}</p>}
              {authHint && <p className="otp-notice">{authHint}</p>}
              <p className="auth-switch">
                Remembered it?{" "}
                <button type="button" className="link-btn" onClick={() => onAuthViewChange("login")}>
                  Sign in here
                </button>
              </p>
            </>
          ) : (
            <>
              <h2>Reset Password</h2>
              <form onSubmit={onResetPassword}>
                <label>
                  Email Address
                  <input
                    type="email"
                    value={resetForm.email}
                    onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Reset ID
                  <input
                    value={resetForm.resetId}
                    onChange={(e) => setResetForm({ ...resetForm, resetId: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Reset Code
                  <input
                    value={resetForm.code}
                    onChange={(e) => setResetForm({ ...resetForm, code: e.target.value })}
                    required
                  />
                </label>
                <label>
                  New Password
                  <div className="pw-wrap">
                    <input
                      type={showPw.resetNewPw ? "text" : "password"}
                      value={resetForm.newPassword}
                      onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                      required
                    />
                    <button type="button" className="pw-toggle" onClick={() => togglePw("resetNewPw")} aria-label={showPw.resetNewPw ? "Hide password" : "Show password"}>
                      <EyeIcon open={showPw.resetNewPw} />
                    </button>
                  </div>
                </label>
                <label>
                  Confirm New Password
                  <div className="pw-wrap">
                    <input
                      type={showPw.resetConfirm ? "text" : "password"}
                      value={resetForm.confirmPassword}
                      onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                      required
                    />
                    <button type="button" className="pw-toggle" onClick={() => togglePw("resetConfirm")} aria-label={showPw.resetConfirm ? "Hide password" : "Show password"}>
                      <EyeIcon open={showPw.resetConfirm} />
                    </button>
                  </div>
                </label>
                <button type="submit" className="btn-primary">Reset Password</button>
              </form>
              {authMessage && <p className="status error">{authMessage}</p>}
              {authHint && <p className="otp-notice">{authHint}</p>}
              <p className="auth-switch">
                Back to{" "}
                <button type="button" className="link-btn" onClick={() => onAuthViewChange("login")}>
                  Sign in
                </button>
              </p>
            </>
          )}
        </article>

      </section>
    </div>
  );
}
