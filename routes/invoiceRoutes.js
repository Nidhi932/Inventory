const express = require("express");
const router = express.Router();

const {
  getAllInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  deleteInvoice,
} = require("../controllers/invoiceController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getAllInvoices);
router.get("/:id", protect, getInvoiceById);
router.put("/:id/status", protect, updateInvoiceStatus);
router.delete("/:id", protect, deleteInvoice);

module.exports = router;
