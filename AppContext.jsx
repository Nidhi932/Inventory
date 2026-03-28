import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const AppContext = createContext();

const BASE_URL = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    salesCount: 0,
    totalPurchase: 0,
    purchaseCount: 0,
    totalItems: 0,
    lowStock: 0,
    totalProducts: 0,
    categories: 0,
    topSelling: [],
    salesData: [],
  });
  const [cardOrder, setCardOrder] = useState(["revenue", "sold", "stock"]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  }, []);

  const fetchProducts = useCallback(async (search = "") => {
    try {
      const url = search
        ? `${BASE_URL}/products?search=${encodeURIComponent(search)}`
        : `${BASE_URL}/products`;
      const res = await fetch(url, { headers: authHeaders() });
      const data = await handleResponse(res);
      setProducts(data.products || []);
    } catch (err) {
      console.error("fetchProducts error:", err.message);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/invoices`, {
        headers: authHeaders(),
      });
      const data = await handleResponse(res);
      const mapped = (data.invoices || []).map((inv) => ({
        id: inv.invoiceNumber,
        _id: inv._id,
        ref: inv.referenceNumber,
        amount: inv.amount,
        status: inv.status,
        dueDate: inv.dueDate,
        customer: inv.customerName,
        product: inv.product?._id || inv.product,
      }));
      setInvoices(mapped);
    } catch (err) {
      console.error("fetchInvoices error:", err.message);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/products/stats`, {
        headers: authHeaders(),
      });
      const data = await handleResponse(res);
      setStats(data.stats || {});
    } catch (err) {
      console.error("fetchStats error:", err.message);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchInvoices();
      fetchStats();
    }
  }, [user, fetchProducts, fetchInvoices, fetchStats]);

  const login = async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(res);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const signup = async (name, email, password) => {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await handleResponse(res);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setProducts([]);
    setInvoices([]);
    setStats({
      totalSales: 0,
      salesCount: 0,
      totalPurchase: 0,
      purchaseCount: 0,
      totalItems: 0,
      lowStock: 0,
      totalProducts: 0,
      categories: 0,
      topSelling: [],
      salesData: [],
    });
  };

  const forgotPassword = async (email) => {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  };

  const addProduct = async (product) => {
    const res = await fetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(product),
    });
    const data = await handleResponse(res);
    await fetchProducts();
    await fetchStats();
    return data;
  };

  const addProductsBulk = async (productsArray) => {
    const res = await fetch(`${BASE_URL}/products/bulk`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ products: productsArray }),
    });
    const data = await handleResponse(res);
    await fetchProducts();
    await fetchStats();
    return data;
  };

  const buyProduct = async (productId, qty) => {
    const res = await fetch(`${BASE_URL}/products/${productId}/buy`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ quantity: qty }),
    });
    const data = await handleResponse(res);
    await fetchProducts();
    await fetchInvoices();
    await fetchStats();
    return data;
  };

  const updateInvoiceStatus = async (invoiceId, status) => {
    const invoice = invoices.find(
      (i) => i.id === invoiceId || i._id === invoiceId,
    );
    const realId = invoice?._id || invoiceId;

    const res = await fetch(`${BASE_URL}/invoices/${realId}/status`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    await handleResponse(res);
    await fetchInvoices();
    await fetchStats();
  };

  const deleteInvoice = async (invoiceId) => {
    const invoice = invoices.find(
      (i) => i.id === invoiceId || i._id === invoiceId,
    );
    const realId = invoice?._id || invoiceId;

    const res = await fetch(`${BASE_URL}/invoices/${realId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    await handleResponse(res);
    await fetchInvoices();
    await fetchStats();
  };

  const updateUser = async (data) => {
    const res = await fetch(`${BASE_URL}/auth/update-profile`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse(res);
    const updatedUser = result.user;
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    return result;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await fetch(`${BASE_URL}/auth/change-password`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(res);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        signup,
        forgotPassword,
        products,
        fetchProducts,
        addProduct,
        addProductsBulk,
        buyProduct,
        invoices,
        fetchInvoices,
        updateInvoiceStatus,
        deleteInvoice,
        stats,
        fetchStats,
        updateUser,
        changePassword,
        cardOrder,
        setCardOrder,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
