import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { flushSync } from "react-dom";
import {
  authAPI,
  productsAPI,
  invoicesAPI,
  getToken,
} from "../services/api";

const AppContext = createContext();

const initialStats = {
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
  paidAmount: 0,
  unpaidAmount: 0,
};

function mapProduct(p) {
  if (!p) return null;
  const id =
    (p.customId && String(p.customId).trim()) ||
    (p._id != null ? String(p._id) : "");
  const expiry = p.expiryDate || p.expiry || "";
  return {
    ...p,
    id,
    expiry,
    expiryDate: p.expiryDate || "",
  };
}

function mapInvoice(inv) {
  return {
    id: inv.invoiceNumber,
    _id: inv._id,
    ref: inv.referenceNumber,
    amount: inv.amount,
    status: inv.status,
    dueDate: inv.dueDate,
    customer: inv.customerName,
    product: inv.product?._id || inv.product,
    createdAt: inv.createdAt,
  };
}

const DEFAULT_CARD_ORDER = ["revenue", "sold", "stock"];

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(initialStats);
  const [cardOrder, setCardOrderState] = useState(DEFAULT_CARD_ORDER);

  const cardStorageKey = user?.id
    ? `stockwise_card_order_${user.id}`
    : null;

  useEffect(() => {
    if (!cardStorageKey) {
      setCardOrderState(DEFAULT_CARD_ORDER);
      return;
    }
    try {
      const raw = localStorage.getItem(cardStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 3) setCardOrderState(parsed);
    } catch {
    }
  }, [cardStorageKey]);

  const setCardOrder = useCallback((next) => {
    setCardOrderState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      if (cardStorageKey) {
        try {
          localStorage.setItem(cardStorageKey, JSON.stringify(value));
        } catch {
        }
      }
      return value;
    });
  }, [cardStorageKey]);

  const fetchProducts = useCallback(async (search = "") => {
    try {
      const data = await productsAPI.getAll(search);
      const list = (data.products || []).map(mapProduct).filter(Boolean);
      setProducts(list);
    } catch (err) {
      console.error("fetchProducts:", err.message);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      const data = await invoicesAPI.getAll();
      setInvoices((data.invoices || []).map(mapInvoice));
    } catch (err) {
      console.error("fetchInvoices:", err.message);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await productsAPI.getStats();
      setStats({ ...initialStats, ...(data.stats || {}) });
    } catch (err) {
      console.error("fetchStats:", err.message);
    }
  }, []);

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

  useEffect(() => {
    if (!getToken()) return;
    (async () => {
      try {
        const data = await authAPI.getMe();
        const u = data.user;
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
      } catch (err) {
        if (err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchProducts();
    fetchInvoices();
    fetchStats();
  }, [user, fetchProducts, fetchInvoices, fetchStats]);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    flushSync(() => {
      setUser(data.user);
    });
    return data;
  };

  const signup = async (name, email, password) => {
    const data = await authAPI.signup(name, email, password);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    flushSync(() => {
      setUser(data.user);
    });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setProducts([]);
    setInvoices([]);
    setStats(initialStats);
  };

  const forgotPassword = async (email) => authAPI.forgotPassword(email);

  const resetPassword = async (token, password) =>
    authAPI.resetPassword(token, password);

  const addProduct = async (product) => {
    const payload = {
      name: product.name,
      customId: product.customId || "",
      category: product.category,
      price: Number(product.price),
      quantity: Number(product.quantity),
      unit: product.unit || "pcs",
      expiryDate: product.expiryDate || product.expiry || "",
      threshold: Number(product.threshold) || 5,
      image: product.image || null,
    };
    await productsAPI.create(payload);
    await fetchProducts();
    await fetchStats();
  };

  const addProductsBulk = async (rows) => {
    const data = await productsAPI.createBulk(rows);
    await fetchProducts();
    await fetchStats();
    return data;
  };

  const buyProduct = async (productMongoId, qty) => {
    await productsAPI.buy(productMongoId, qty);
    await fetchProducts();
    await fetchInvoices();
    await fetchStats();
  };

  const updateInvoiceStatus = async (invoiceId, status) => {
    const invoice = invoices.find(
      (i) => i.id === invoiceId || String(i._id) === String(invoiceId),
    );
    const realId = invoice?._id || invoiceId;
    await invoicesAPI.updateStatus(realId, status);
    await fetchInvoices();
    await fetchStats();
  };

  const deleteInvoice = async (invoiceId) => {
    const invoice = invoices.find(
      (i) => i.id === invoiceId || String(i._id) === String(invoiceId),
    );
    const realId = invoice?._id || invoiceId;
    await invoicesAPI.delete(realId);
    await fetchInvoices();
    await fetchStats();
  };

  const updateUser = async (data) => {
    const result = await authAPI.updateProfile(data);
    const updatedUser = result.user;
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    return result;
  };

  const changePassword = async (currentPassword, newPassword) =>
    authAPI.changePassword(currentPassword, newPassword);

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        signup,
        forgotPassword,
        resetPassword,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
