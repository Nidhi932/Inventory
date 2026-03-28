export const MIN_PASSWORD_LEN = 8;
export const MAX_PASSWORD_LEN = 128;
export const MIN_NAME_LEN = 2;
export const MAX_NAME_LEN = 80;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emptyFieldErrors() {
  return {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  };
}

export function hasAnyFieldError(errors) {
  return Object.values(errors).some(Boolean);
}

export function validateEmail(value) {
  const v = (value || "").trim();
  if (!v) return "Email is required.";
  if (!EMAIL_RE.test(v)) return "Enter a valid email address.";
  return "";
}

export function validateName(value) {
  const v = (value || "").trim();
  if (!v) return "Name is required.";
  if (v.length < MIN_NAME_LEN)
    return `Name must be at least ${MIN_NAME_LEN} characters.`;
  if (v.length > MAX_NAME_LEN)
    return `Name must be at most ${MAX_NAME_LEN} characters.`;
  return "";
}

export function validatePassword(value) {
  if (!value) return "Password is required.";
  if (value.length < MIN_PASSWORD_LEN)
    return `Password must be at least ${MIN_PASSWORD_LEN} characters.`;
  if (value.length > MAX_PASSWORD_LEN)
    return `Password must be at most ${MAX_PASSWORD_LEN} characters.`;
  return "";
}

export function validateLoginPassword(value) {
  if (!value || !String(value).trim()) return "Password is required.";
  return "";
}

export function validateOtp(value) {
  const v = (value || "").trim();
  if (!v) return "Enter the 6-digit code sent to your email.";
  if (!/^\d{6}$/.test(v)) return "OTP must be exactly 6 numbers.";
  return "";
}

export function validateSignupForm(form) {
  const errors = emptyFieldErrors();
  errors.name = validateName(form.name);
  errors.email = validateEmail(form.email);
  errors.password = validatePassword(form.password);

  const conf = form.confirmPassword || "";
  if (!conf.trim()) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export function validateLoginForm(form) {
  const errors = emptyFieldErrors();
  errors.email = validateEmail(form.email);
  errors.password = validateLoginPassword(form.password);
  return errors;
}

export function validateRecoveryEmail(form) {
  const errors = emptyFieldErrors();
  errors.email = validateEmail(form.email);
  return errors;
}

export function validateRecoveryPasswordStep(form) {
  const errors = emptyFieldErrors();
  errors.password = validatePassword(form.password);

  const conf = form.confirmPassword || "";
  if (!conf.trim()) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export function validateOtpField(form) {
  const errors = emptyFieldErrors();
  errors.otp = validateOtp(form.otp);
  return errors;
}
