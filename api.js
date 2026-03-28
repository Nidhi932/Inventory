

const BASE_URL = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
};

export const authAPI = {
  signup: async (name, email, password) => {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(res);
  },


  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },


  forgotPassword: async (email) => {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },


  getMe: async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },


  updateProfile: async (data) => {
    const res = await fetch(`${BASE_URL}/auth/update-profile`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  changePassword: async (currentPassword, newPassword) => {
    const res = await fetch(`${BASE_URL}/auth/change-password`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(res);
  },
};


export const productsAPI = {
  getAll: async (search = "") => {
    const url = search
      ? `${BASE_URL}/products?search=${encodeURIComponent(search)}`
      : `${BASE_URL}/products`;
    const res = await fetch(url, { headers: authHeaders() });
    return handleResponse(res);
  },

  getStats: async () => {
    const res = await fetch(`${BASE_URL}/products/stats`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  create: async (productData) => {
    const res = await fetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(productData),
    });
    return handleResponse(res);
  },

  createBulk: async (productsArray) => {
    const res = await fetch(`${BASE_URL}/products/bulk`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ products: productsArray }),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await fetch(`${BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (id) => {
    const res = await fetch(`${BASE_URL}/products/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  buy: async (id, quantity, customerName = "Walk-in Customer") => {
    const res = await fetch(`${BASE_URL}/products/${id}/buy`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ quantity, customerName }),
    });
    return handleResponse(res);
  },
};

export const invoicesAPI = {
  getAll: async () => {
    const res = await fetch(`${BASE_URL}/invoices`, {
      headers: authHeaders(),
    });
    return handleResponse(res);
  },

  updateStatus: async (id, status) => {
    const res = await fetch(`${BASE_URL}/invoices/${id}/status`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  delete: async (id) => {
    const res = await fetch(`${BASE_URL}/invoices/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handleResponse(res);
  },
};
