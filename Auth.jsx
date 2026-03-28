import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import "./Auth.css";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup, forgotPassword } = useApp();
  const navigate = useNavigate();

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        if (!form.email || !form.password) {
          setError("Please fill in all fields.");
          return;
        }
        await login(form.email, form.password);
        navigate("/dashboard");

      } else if (mode === "signup") {
        if (!form.name || !form.email || !form.password) {
          setError("Please fill in all fields.");
          return;
        }
        if (form.password !== form.confirmPassword) {
          setError("Passwords don't match.");
          return;
        }
        if (form.password.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
        }
        await signup(form.name, form.email, form.password);
        navigate("/dashboard");

      } else if (mode === "forgot") {
        if (!form.email) {
          setError("Please enter your email address.");
          return;
        }
        await forgotPassword(form.email);
        setSuccess("If that email is registered, a reset link has been sent.");
        setForm((f) => ({ ...f, email: "" }));
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
    setSuccess("");
  };

  return (
    <div className="auth">
      <div className="auth__left">
        <div className="auth__left-content">
          <div className="auth__brand">
            <div className="auth__brand-logo">▲</div>
            <span className="auth__brand-name">Stockwise</span>
          </div>
          <h2 className="auth__tagline">
            Manage inventory.<br />Drive growth.
          </h2>
          <p className="auth__tagline-sub">
            The all-in-one system for products, sales, invoices, and analytics.
          </p>
          <div className="auth__stats">
            <div className="auth__stat">
              <span className="auth__stat-num">12k+</span>
              <span>Products</span>
            </div>
            <div className="auth__stat">
              <span className="auth__stat-num">98%</span>
              <span>Uptime</span>
            </div>
            <div className="auth__stat">
              <span className="auth__stat-num">50k+</span>
              <span>Invoices</span>
            </div>
          </div>
        </div>
        <div className="auth__decor">
          <div className="auth__decor-circle auth__decor-circle--1"></div>
          <div className="auth__decor-circle auth__decor-circle--2"></div>
        </div>
      </div>

      <div className="auth__right">
        <div className="auth__card scale-in">

          {mode === "forgot" ? (
            <>
              <div className="auth__card-header">
                <h2>Reset Password</h2>
                <p>Enter your email to receive a reset link.</p>
              </div>
              <form onSubmit={submit} className="auth__form">
                <div className="auth__field">
                  <label>Email Address</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handle}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                {error && <p className="auth__error">{error}</p>}
                {success && <p className="auth__success">{success}</p>}
                <button className="auth__submit" disabled={loading}>
                  {loading ? <span className="auth__spinner" /> : "Send Reset Link"}
                </button>
                <button
                  type="button"
                  className="auth__back"
                  onClick={() => switchMode("login")}
                >
                  ← Back to Login
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="auth__tabs">
                <button
                  type="button"
                  className={`auth__tab ${mode === "login" ? "auth__tab--active" : ""}`}
                  onClick={() => switchMode("login")}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`auth__tab ${mode === "signup" ? "auth__tab--active" : ""}`}
                  onClick={() => switchMode("signup")}
                >
                  Sign Up
                </button>
              </div>

              <div className="auth__card-header">
                <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
                <p>
                  {mode === "login"
                    ? "Sign in to your workspace."
                    : "Start managing your inventory."}
                </p>
              </div>

              <form onSubmit={submit} className="auth__form">
                {mode === "signup" && (
                  <div className="auth__field">
                    <label>Full Name</label>
                    <input
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handle}
                      placeholder="Aryan Desai"
                      autoComplete="name"
                    />
                  </div>
                )}
                <div className="auth__field">
                  <label>Email Address</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handle}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                <div className="auth__field">
                  <label>Password</label>
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handle}
                    placeholder="••••••••"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                </div>
                {mode === "signup" && (
                  <div className="auth__field">
                    <label>Confirm Password</label>
                    <input
                      name="confirmPassword"
                      type="password"
                      value={form.confirmPassword}
                      onChange={handle}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                )}
                {mode === "login" && (
                  <button
                    type="button"
                    className="auth__forgot-link"
                    onClick={() => switchMode("forgot")}
                  >
                    Forgot password?
                  </button>
                )}
                {error && <p className="auth__error">{error}</p>}
                {success && <p className="auth__success">{success}</p>}
                <button className="auth__submit" disabled={loading}>
                  {loading ? (
                    <span className="auth__spinner" />
                  ) : mode === "login" ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
