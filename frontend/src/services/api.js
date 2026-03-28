function normalizeApiRoot(url) {
  if (!url) return url;
  const trimmed = url.replace(/\/$/, "");
  if (trimmed.endsWith("/api")) return trimmed;
  return `${trimmed}/api`;
}

// Production (Vercel): set `VITE_API_URL` to your Render API origin, e.g. https://xxx.onrender.com
// (exposed as import.meta.env.VITE_API_URL). Dev: omit it — Vite proxies `/api` to the backend.
function apiBase() {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) return normalizeApiRoot(fromEnv);
  if (import.meta.env.DEV) return "/api";
  throw new Error(
    "VITE_API_URL is not set. Add it in Vercel environment variables (your Render API URL, e.g. https://xxx.onrender.com).",
  );
}

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const handleResponse = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  let data = {};
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw httpError(
        text?.slice(0, 120) ||
          `Server error (${res.status}). Check VITE_API_URL and that the API is running.`,
        res.status,
      );
    }
  }
  if (!res.ok) {
    throw httpError(
      data.message || `Request failed (${res.status}).`,
      res.status,
    );
  }
  return data;
};

async function apiFetch(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (e) {
    if (e.status) throw e;
    const err = new Error(
      import.meta.env.DEV
        ? "Cannot reach the API. Start the backend from /backend (npm run dev) while using the Vite dev server, or run npm run dev:all from the repo root."
        : "Cannot reach the API. Confirm VITE_API_URL on Vercel matches your Render API URL and that CORS FRONTEND_URL on Render includes this site.",
    );
    err.status = 0;
    throw err;
  }
  return handleResponse(res);
}

export const authAPI = {
  signup: (name, email, password) =>
    apiFetch(`${apiBase()}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email, password) =>
    apiFetch(`${apiBase()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  forgotPassword: (email) =>
    apiFetch(`${apiBase()}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token, password) =>
    apiFetch(`${apiBase()}/auth/reset-password/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }),

  getMe: () => apiFetch(`${apiBase()}/auth/me`, { headers: authHeaders() }),

  updateProfile: (data) =>
    apiFetch(`${apiBase()}/auth/update-profile`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  changePassword: (currentPassword, newPassword) =>
    apiFetch(`${apiBase()}/auth/change-password`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

export const productsAPI = {
  getAll: (search = "") => {
    const url = search
      ? `${apiBase()}/products?search=${encodeURIComponent(search)}`
      : `${apiBase()}/products`;
    return apiFetch(url, { headers: authHeaders() });
  },

  getStats: () =>
    apiFetch(`${apiBase()}/products/stats`, { headers: authHeaders() }),

  create: (productData) =>
    apiFetch(`${apiBase()}/products`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(productData),
    }),

  createBulk: (productsArray) =>
    apiFetch(`${apiBase()}/products/bulk`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ products: productsArray }),
    }),

  buy: (id, quantity, customerName = "Walk-in Customer") =>
    apiFetch(`${apiBase()}/products/${id}/buy`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ quantity, customerName }),
    }),
};

export const invoicesAPI = {
  getAll: () => apiFetch(`${apiBase()}/invoices`, { headers: authHeaders() }),

  updateStatus: (id, status) =>
    apiFetch(`${apiBase()}/invoices/${id}/status`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    }),

  delete: (id) =>
    apiFetch(`${apiBase()}/invoices/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    }),
};

export { getToken, authHeaders, handleResponse, apiBase as getBaseUrl };
