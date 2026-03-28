const Product = require("../models/Product");
const Invoice = require("../models/Invoice");
const { syncStockStatuses } = require("../cronJobs");

const getNextInvoiceNumber = async (userId) => {
  const count = await Invoice.countDocuments({ user: userId });
  return `INV${String(count + 1).padStart(3, "0")}`;
};

const getAllProducts = async (req, res, next) => {
  try {
    const { search } = req.query;

    let filter = { user: req.user._id };

    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { category: { $regex: search.trim(), $options: "i" } },
        { customId: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, customId, category, price, quantity, unit, expiryDate, threshold, image } =
      req.body;

    if (!name || !category || price === undefined || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, category, price, and quantity are required",
      });
    }

    if (customId && customId.trim()) {
      const existing = await Product.findOne({
        user: req.user._id,
        customId: customId.trim(),
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Product ID "${customId}" is already in use`,
        });
      }
    }

    const product = await Product.create({
      user: req.user._id,
      name,
      customId: customId?.trim() || "",
      category,
      price: Number(price),
      quantity: Number(quantity),
      unit: unit || "pcs",
      expiryDate: expiryDate || "",
      threshold: Number(threshold) || 5,
      image: image || null,
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully!",
      product,
    });
  } catch (error) {
    next(error);
  }
};

const createProductsBulk = async (req, res, next) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of products",
      });
    }

    const toInsert = products.map((p) => ({
      user: req.user._id,
      name: p.name || "Unnamed Product",
      customId: p.customId?.trim() || "",
      category: p.category || "Other",
      price: Number(p.price) || 0,
      quantity: Number(p.quantity) || 0,
      unit: p.unit || "pcs",
      expiryDate: p.expiryDate || "",
      threshold: Number(p.threshold) || 5,
      image: null,
    }));

    const inserted = await Product.insertMany(toInsert, { ordered: false });

    for (const prod of inserted) {
      if (prod.quantity === 0) {
        prod.status = "Out of Stock";
      } else if (prod.quantity <= prod.threshold) {
        prod.status = "Low Stock";
      } else {
        prod.status = "In Stock";
      }
      await prod.save();
    }

    res.status(201).json({
      success: true,
      message: `${inserted.length} products added successfully!`,
      count: inserted.length,
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const fields = ["name", "category", "price", "quantity", "unit", "expiryDate", "threshold", "image", "customId"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully!",
      product,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully!",
    });
  } catch (error) {
    next(error);
  }
};

const buyProduct = async (req, res, next) => {
  try {
    const { quantity, customerName } = req.body;

    if (!quantity || Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid quantity",
      });
    }

    const qty = Number(quantity);

    const product = await Product.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.quantity < qty) {
      return res.status(400).json({
        success: false,
        message: `Not enough stock. Only ${product.quantity} ${product.unit} available.`,
      });
    }

    product.quantity -= qty;
    product.sold += qty;
    await product.save();

    const invoiceNumber = await getNextInvoiceNumber(req.user._id);
    const count = await Invoice.countDocuments({ user: req.user._id });

    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const invoice = await Invoice.create({
      user: req.user._id,
      product: product._id,
      invoiceNumber,
      referenceNumber: `REF-2026-${String(count + 1).padStart(3, "0")}`,
      customerName: customerName || "Walk-in Customer",
      amount: product.price * qty,
      status: "Unpaid",
      dueDate,
      quantity: qty,
    });

    await syncStockStatuses();

    res.status(200).json({
      success: true,
      message: "Purchase successful!",
      product,
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const products = await Product.find({ user: userId });
    const invoices = await Invoice.find({ user: userId });

    const paid = invoices.filter((i) => i.status === "Paid");
    const unpaid = invoices.filter((i) => i.status === "Unpaid");

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const salesData = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      const year = date.getFullYear();
      const monthStart = new Date(year, date.getMonth(), 1);
      const monthEnd = new Date(year, date.getMonth() + 1, 0, 23, 59, 59);

      const monthInvoices = invoices.filter((inv) => {
        const d = new Date(inv.createdAt);
        return d >= monthStart && d <= monthEnd;
      });

      const sales = monthInvoices
        .filter((i) => i.status === "Paid")
        .reduce((sum, i) => sum + i.amount, 0);

      const purchase = monthInvoices.reduce((sum, i) => sum + i.amount, 0);

      salesData.push({ month: monthName, sales, purchase });
    }

    const stats = {
      totalSales: paid.reduce((s, i) => s + i.amount, 0),
      salesCount: paid.length,
      totalPurchase: products.reduce((s, p) => s + p.price * (p.sold || 0), 0),
      purchaseCount: products.reduce((s, p) => s + (p.sold || 0), 0),
      totalItems: products.reduce((s, p) => s + p.quantity, 0),
      lowStock: products.filter((p) => p.status === "Low Stock").length,
      outOfStock: products.filter((p) => p.status === "Out of Stock").length,
      totalProducts: products.length,
      categories: [...new Set(products.map((p) => p.category))].length,
      topSelling: [...products]
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5)
        .map((p) => ({
          id: p._id,
          name: p.name,
          category: p.category,
          sold: p.sold,
          price: p.price,
        })),
      salesData,
      paidAmount: paid.reduce((s, i) => s + i.amount, 0),
      unpaidAmount: unpaid.reduce((s, i) => s + i.amount, 0),
    };

    res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  createProductsBulk,
  updateProduct,
  deleteProduct,
  buyProduct,
  getStats,
};
