const Invoice = require("../models/Invoice");
const Product = require("../models/Product");

const getAllInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id })
      .populate("product", "name category price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    next(error);
  }
};

const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("product", "name category price unit");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["Paid", "Unpaid"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be "Paid" or "Unpaid"',
      });
    }

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status },
      { new: true },
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Invoice marked as ${status}`,
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully!",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  deleteInvoice,
};
