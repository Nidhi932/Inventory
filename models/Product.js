const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customId: {
      type: String,
      trim: true,
      default: "",
    },

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },

    unit: {
      type: String,
      default: "pcs",
      trim: true,
    },

    expiryDate: {
      type: String,
      default: "",
    },

    threshold: {
      type: Number,
      default: 5,
      min: [0, "Threshold cannot be negative"],
    },

    status: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out of Stock"],
      default: "In Stock",
    },

    sold: {
      type: Number,
      default: 0,
    },

    image: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.methods.updateStatus = function () {
  if (this.quantity === 0) {
    this.status = "Out of Stock";
  } else if (this.quantity <= this.threshold) {
    this.status = "Low Stock";
  } else {
    this.status = "In Stock";
  }
};

productSchema.pre("save", function (next) {
  this.updateStatus();
  next();
});

module.exports = mongoose.model("Product", productSchema);
