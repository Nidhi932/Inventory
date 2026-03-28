import { useState, useId } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  emptyFieldErrors,
  hasAnyFieldError,
  validateLoginForm,
  validateSignupForm,
  validateRecoveryEmail,
  validateRecoveryPasswordStep,
} from "../utils/authValidation";
import "./Auth.css";

const COMPANY_NAME = "Company name";
const HERO_LOGIN = "/auth-hero.svg";
const HERO_ONBOARD_EMAIL = "/auth-onboard-email.png";
const HERO_ONBOARD_PASSWORD = "/auth-onboard-password.png";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(() => emptyFieldErrors());
  const [success, setSuccess] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup, forgotPassword, resetPassword } = useApp();
  const navigate = useNavigate();

  function onFieldChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setSuccess("");
    setApiError("");
  }

  function goToMode(next) {
    setMode(next);
    setFieldErrors(emptyFieldErrors());
    setSuccess("");
    setApiError("");
    setShowPassword(false);
    if (next !== "recovery") {
      setRecoveryStep(1);
    }
    if (next === "login" || next === "signup") {
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        otp: "",
      });
    }
  }

  function startRecoveryFlow() {
    setMode("recovery");
    setRecoveryStep(1);
    setFieldErrors(emptyFieldErrors());
    setSuccess("");
    setApiError("");
    setForm((f) => ({
      ...f,
      otp: "",
      password: "",
      confirmPassword: "",
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSuccess("");
    setApiError("");
    setFieldErrors(emptyFieldErrors());

    if (mode === "login") {
      const errs = validateLoginForm(form);
      if (hasAnyFieldError(errs)) {
        setFieldErrors(errs);
        return;
      }
    } else if (mode === "signup") {
      const errs = validateSignupForm(form);
      if (hasAnyFieldError(errs)) {
        setFieldErrors(errs);
        return;
      }
    } else if (mode === "recovery") {
      if (recoveryStep === 1) {
        const errs = validateRecoveryEmail(form);
        if (hasAnyFieldError(errs)) {
          setFieldErrors(errs);
          return;
        }
      } else {
        const errs = validateRecoveryPasswordStep(form);
        if (!form.otp?.trim()) {
          setFieldErrors((prev) => ({
            ...prev,
            otp: "Enter the reset code from your email.",
          }));
          return;
        }
        if (hasAnyFieldError(errs)) {
          setFieldErrors(errs);
          return;
        }
      }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email.trim(), form.password);
        navigate("/dashboard");
      } else if (mode === "signup") {
        await signup(form.name.trim(), form.email.trim(), form.password);
        navigate("/dashboard");
      } else if (mode === "recovery") {
        if (recoveryStep === 1) {
          const data = await forgotPassword(form.email.trim());
          const token = data.resetToken;
          setForm((f) => ({
            ...f,
            otp: token || "",
            password: "",
            confirmPassword: "",
          }));
          setSuccess(
            token
              ? "Reset code filled for testing (dev). Check email in production."
              : "If that email is registered, a reset link was sent.",
          );
          setRecoveryStep(2);
        } else {
          await resetPassword(form.otp.trim(), form.password);
          setSuccess("Password updated. You can sign in now.");
          setMode("login");
          setRecoveryStep(1);
          setForm((f) => ({
            ...f,
            password: "",
            confirmPassword: "",
            otp: "",
          }));
        }
      }
    } catch (err) {
      setApiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const formSideClass =
    mode === "recovery"
      ? `auth-form-side auth-form-side--recovery auth-form-side--r${recoveryStep}`
      : "auth-form-side";

  const heroSrc =
    mode === "recovery"
      ? recoveryStep === 1
        ? HERO_ONBOARD_EMAIL
        : HERO_ONBOARD_PASSWORD
      : HERO_LOGIN;

  const showWelcomeBlock = mode === "login" || mode === "signup";

  return (
    <div className="auth">
      <section className={formSideClass} aria-label="Account">
        <div className="auth-form-inner">
          {mode === "recovery" && recoveryStep === 1 ? (
            <>
              <header className="auth-header">
                <h1 className="auth-title auth-title--brand">{COMPANY_NAME}</h1>
                <p className="auth-subtitle">
                  Enter your registered email. We&apos;ll send a password reset
                  link (reset code is shown in dev mode).
                </p>
              </header>

              <form className="auth-form" onSubmit={onSubmit} noValidate>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="recovery-email">
                    E-mail
                  </label>
                  <input
                    id="recovery-email"
                    className={
                      fieldErrors.email
                        ? "auth-input auth-input--invalid"
                        : "auth-input"
                    }
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={onFieldChange}
                    placeholder="Enter your registered email"
                    aria-invalid={fieldErrors.email ? "true" : "false"}
                    aria-describedby={
                      fieldErrors.email ? "recovery-email-error" : undefined
                    }
                  />
                  <FieldError
                    id="recovery-email-error"
                    message={fieldErrors.email}
                  />
                </div>

                {success ? (
                  <p className="auth-msg auth-msg--success">{success}</p>
                ) : null}
                {apiError ? (
                  <p className="auth-msg auth-msg--error" role="alert">
                    {apiError}
                  </p>
                ) : null}

                <button
                  className="auth-btn-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="auth-spinner" aria-hidden />
                  ) : (
                    "Send Mail"
                  )}
                </button>

                <button
                  className="auth-link-btn"
                  type="button"
                  onClick={() => goToMode("login")}
                >
                  ← Back to log in
                </button>
              </form>
            </>
          ) : mode === "recovery" && recoveryStep === 2 ? (
            <>
              <header className="auth-header">
                <h1 className="auth-title">Create new password</h1>
                <p className="auth-subtitle">
                  Paste the reset code from your email, then choose a new
                  password.
                </p>
              </header>

              <form className="auth-form" onSubmit={onSubmit} noValidate>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="recovery-otp">
                    Reset code
                  </label>
                  <input
                    id="recovery-otp"
                    className={
                      fieldErrors.otp
                        ? "auth-input auth-input--invalid"
                        : "auth-input"
                    }
                    name="otp"
                    autoComplete="one-time-code"
                    value={form.otp}
                    onChange={onFieldChange}
                    placeholder="Paste code from email"
                    aria-invalid={fieldErrors.otp ? "true" : "false"}
                    aria-describedby={
                      fieldErrors.otp ? "recovery-otp-error" : undefined
                    }
                  />
                  <FieldError
                    id="recovery-otp-error"
                    message={fieldErrors.otp}
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="recovery-new-pass">
                    New password
                  </label>
                  <div className="auth-password-wrap">
                    <input
                      id="recovery-new-pass"
                      className={
                        fieldErrors.password
                          ? "auth-input auth-input--with-toggle auth-input--invalid"
                          : "auth-input auth-input--with-toggle"
                      }
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={onFieldChange}
                      placeholder="at least 8 characters"
                      aria-invalid={fieldErrors.password ? "true" : "false"}
                      aria-describedby={
                        fieldErrors.password
                          ? "recovery-password-error"
                          : undefined
                      }
                    />
                    <button
                      type="button"
                      className="auth-eye"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <FieldError
                    id="recovery-password-error"
                    message={fieldErrors.password}
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="recovery-confirm-pass">
                    Confirm password
                  </label>
                  <div className="auth-password-wrap">
                    <input
                      id="recovery-confirm-pass"
                      className={
                        fieldErrors.confirmPassword
                          ? "auth-input auth-input--with-toggle auth-input--invalid"
                          : "auth-input auth-input--with-toggle"
                      }
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={onFieldChange}
                      placeholder="at least 8 characters"
                      aria-invalid={
                        fieldErrors.confirmPassword ? "true" : "false"
                      }
                      aria-describedby={
                        fieldErrors.confirmPassword
                          ? "recovery-confirm-error"
                          : undefined
                      }
                    />
                    <button
                      type="button"
                      className="auth-eye"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <FieldError
                    id="recovery-confirm-error"
                    message={fieldErrors.confirmPassword}
                  />
                </div>

                {apiError ? (
                  <p className="auth-msg auth-msg--error" role="alert">
                    {apiError}
                  </p>
                ) : null}

                <button
                  className="auth-btn-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="auth-spinner" aria-hidden />
                  ) : (
                    "Reset password"
                  )}
                </button>

                <button
                  className="auth-link-btn"
                  type="button"
                  onClick={() => {
                    setRecoveryStep(1);
                    setFieldErrors(emptyFieldErrors());
                  }}
                >
                  ← Back
                </button>
              </form>
            </>
          ) : mode === "signup" ? (
            <>
              <header className="auth-header">
                <h1 className="auth-title">Create your account</h1>
                <p className="auth-subtitle">
                  Enter your details to get started. Use at least 8 characters
                  for your password.
                </p>
              </header>

              <form
                className="auth-form"
                onSubmit={onSubmit}
                noValidate
                autoComplete="off"
              >
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-name">
                    Full name
                  </label>
                  <input
                    id="auth-name"
                    className={
                      fieldErrors.name
                        ? "auth-input auth-input--invalid"
                        : "auth-input"
                    }
                    name="name"
                    type="text"
                    autoComplete="off"
                    value={form.name}
                    onChange={onFieldChange}
                    aria-invalid={fieldErrors.name ? "true" : "false"}
                    aria-describedby={
                      fieldErrors.name ? "auth-name-error" : undefined
                    }
                  />
                  <FieldError id="auth-name-error" message={fieldErrors.name} />
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-email-signup">
                    Email
                  </label>
                  <input
                    id="auth-email-signup"
                    className={
                      fieldErrors.email
                        ? "auth-input auth-input--invalid"
                        : "auth-input"
                    }
                    name="email"
                    type="email"
                    autoComplete="off"
                    value={form.email}
                    onChange={onFieldChange}
                    aria-invalid={fieldErrors.email ? "true" : "false"}
                    aria-describedby={
                      fieldErrors.email ? "auth-email-signup-error" : undefined
                    }
                  />
                  <FieldError
                    id="auth-email-signup-error"
                    message={fieldErrors.email}
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-password-signup">
                    Password
                  </label>
                  <div className="auth-password-wrap">
                    <input
                      id="auth-password-signup"
                      className={
                        fieldErrors.password
                          ? "auth-input auth-input--with-toggle auth-input--invalid"
                          : "auth-input auth-input--with-toggle"
                      }
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={onFieldChange}
                      aria-invalid={fieldErrors.password ? "true" : "false"}
                      aria-describedby={
                        fieldErrors.password
                          ? "auth-password-signup-error"
                          : undefined
                      }
                    />
                    <button
                      type="button"
                      className="auth-eye"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <FieldError
                    id="auth-password-signup-error"
                    message={fieldErrors.password}
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-confirm">
                    Confirm password
                  </label>
                  <input
                    id="auth-confirm"
                    className={
                      fieldErrors.confirmPassword
                        ? "auth-input auth-input--invalid"
                        : "auth-input"
                    }
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={onFieldChange}
                    aria-invalid={
                      fieldErrors.confirmPassword ? "true" : "false"
                    }
                    aria-describedby={
                      fieldErrors.confirmPassword
                        ? "auth-confirm-error"
                        : undefined
                    }
                  />
                  <FieldError
                    id="auth-confirm-error"
                    message={fieldErrors.confirmPassword}
                  />
                </div>

                {apiError ? (
                  <p className="auth-msg auth-msg--error" role="alert">
                    {apiError}
                  </p>
                ) : null}

                <button
                  className="auth-btn-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="auth-spinner" aria-hidden />
                  ) : (
                    "Sign up"
                  )}
                </button>

                <p className="auth-footer">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="auth-link-inline"
                    onClick={() => goToMode("login")}
                  >
                    Log in
                  </button>
                </p>
              </form>
            </>
          ) : (
            <>
              <header className="auth-header">
                <h1 className="auth-title">Log in to your account</h1>
                <p className="auth-subtitle">
                  Welcome back! Please enter your details.
                </p>
              </header>

              <form className="auth-form" onSubmit={onSubmit} noValidate>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-email">
                    Email
                  </label>
                  <input
                    id="auth-email"
                    className={
                      fieldErrors.email
                        ? "auth-input auth-input--invalid"
                        : "auth-input"
                    }
                    name="email"
                    type="email"
                    autoComplete="username"
                    value={form.email}
                    onChange={onFieldChange}
                    aria-invalid={fieldErrors.email ? "true" : "false"}
                    aria-describedby={
                      fieldErrors.email ? "auth-email-error" : undefined
                    }
                  />
                  <FieldError
                    id="auth-email-error"
                    message={fieldErrors.email}
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-password">
                    Password
                  </label>
                  <div className="auth-password-wrap">
                    <input
                      id="auth-password"
                      className={
                        fieldErrors.password
                          ? "auth-input auth-input--with-toggle auth-input--invalid"
                          : "auth-input auth-input--with-toggle"
                      }
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={form.password}
                      onChange={onFieldChange}
                      aria-invalid={fieldErrors.password ? "true" : "false"}
                      aria-describedby={
                        fieldErrors.password ? "auth-password-error" : undefined
                      }
                    />
                    <button
                      type="button"
                      className="auth-eye"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <FieldError
                    id="auth-password-error"
                    message={fieldErrors.password}
                  />
                </div>

                <div className="auth-row-forgot">
                  <span />
                  <button
                    type="button"
                    className="auth-link-inline"
                    onClick={startRecoveryFlow}
                  >
                    Forgot Password?
                  </button>
                </div>

                {success ? (
                  <p className="auth-msg auth-msg--success">{success}</p>
                ) : null}
                {apiError ? (
                  <p className="auth-msg auth-msg--error" role="alert">
                    {apiError}
                  </p>
                ) : null}

                <button
                  className="auth-btn-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="auth-spinner" aria-hidden />
                  ) : (
                    "Sign in"
                  )}
                </button>

                <p className="auth-footer">
                  Don&apos;t you have an account?{" "}
                  <button
                    type="button"
                    className="auth-link-inline"
                    onClick={() => goToMode("signup")}
                  >
                    Sign up
                  </button>
                </p>
              </form>
            </>
          )}
        </div>
      </section>

      <aside
        className={
          showWelcomeBlock
            ? "auth-welcome-side"
            : "auth-welcome-side auth-welcome-side--illustration-only"
        }
      >
        {showWelcomeBlock ? (
          <div className="auth-welcome-top">
            <p className="auth-welcome-line">
              Welcome to
              <br />
              Myntra.
            </p>
            <svg
              width="101"
              height="101"
              viewBox="0 0 101 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M89.4395 66.8703C86.7623 73.2016 82.5748 78.7808 77.2433 83.1199C71.9117 87.459 65.5984 90.4261 58.8552 91.7616C52.112 93.0972 45.1444 92.7605 38.5614 90.7812C31.9784 88.8018 25.9805 85.2399 21.0921 80.407C16.2036 75.5741 12.5735 69.6173 10.5191 63.0573C8.4647 56.4973 8.04852 49.534 9.30696 42.776C10.5654 36.018 13.4602 29.6712 17.7381 24.2905C22.0161 18.9097 27.5471 14.6588 33.8475 11.9094"
                fill="#A36BFD"
              />
              <path
                d="M89.4395 66.8703C86.7623 73.2016 82.5748 78.7808 77.2433 83.1199C71.9117 87.459 65.5984 90.4261 58.8552 91.7616C52.1121 93.0972 45.1444 92.7605 38.5614 90.7812C31.9784 88.8018 25.9805 85.2399 21.0921 80.407C16.2036 75.5741 12.5735 69.6173 10.5191 63.0573C8.4647 56.4973 8.04852 49.534 9.30696 42.776C10.5654 36.018 13.4602 29.6712 17.7381 24.2905C22.0161 18.9097 27.5471 14.6588 33.8474 11.9094"
                stroke="white"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M92.5833 50.5001C92.5833 44.9736 91.4948 39.5013 89.3799 34.3955C87.265 29.2897 84.1652 24.6505 80.2574 20.7427C76.3496 16.8349 71.7104 13.735 66.6046 11.6202C61.4988 9.50527 56.0265 8.41675 50.5 8.41675V50.5001H92.5833Z"
                fill="#60CDAC"
                stroke="white"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : null}

        <div className="auth-hero-wrap">
          <img className="auth-hero-img" src={heroSrc} alt="" />
        </div>
      </aside>
    </div>
  );
}

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="auth-field-error" role="alert">
      {message}
    </p>
  );
}

function EyeIcon() {
  const clipId = useId();
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M0.833313 9.99992C0.833313 9.99992 4.16665 3.33325 9.99998 3.33325C15.8333 3.33325 19.1666 9.99992 19.1666 9.99992C19.1666 9.99992 15.8333 16.6666 9.99998 16.6666C4.16665 16.6666 0.833313 9.99992 0.833313 9.99992Z"
          stroke="#9A9A9A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.99998 12.4999C11.3807 12.4999 12.5 11.3806 12.5 9.99992C12.5 8.61921 11.3807 7.49992 9.99998 7.49992C8.61927 7.49992 7.49998 8.61921 7.49998 9.99992C7.49998 11.3806 8.61927 12.4999 9.99998 12.4999Z"
          stroke="#9A9A9A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.82l2.92 2.92c1.42-1.16 2.65-2.55 3.44-4.24-1.73-3.89-6-7-11-7-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l3.28 3.28C3.55 8.99 1.73 10.5 1 12c1.73 3.89 6 7 11 7 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55A3 3 0 0 0 9 12c0 1.66 1.34 3 3 3 .35 0 .69-.06 1.01-.17l1.55 1.55c-.86.5-1.86.79-2.56.79-2.76 0-5-2.24-5-5 0-.7.29-1.7.78-2.57z"
        fill="currentColor"
      />
    </svg>
  );
}
