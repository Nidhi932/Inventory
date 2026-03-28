const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getProductById,
  createProduct,
  createProductsBulk,
  updateProduct,
  deleteProduct,
  buyProduct,
  getStats,
} = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");

router.get("/stats", protect, getStats);
router.get("/", protect, getAllProducts);
router.get("/:id", protect, getProductById);
router.post("/", protect, createProduct);
router.post("/bulk", protect, createProductsBulk);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);
router.post("/:id/buy", protect, buyProduct);

module.exports = router;
