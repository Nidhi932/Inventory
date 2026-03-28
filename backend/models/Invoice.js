const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    invoiceNumber: {
      type: String,
      required: true,
    },

    referenceNumber: {
      type: String,
      required: true,
    },

    customerName: {
      type: String,
      default: "Walk-in Customer",
      trim: true,
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },

    status: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },

    dueDate: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Invoice", invoiceSchema);
