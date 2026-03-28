const cron = require("node-cron");
const Product = require("./models/Product");

async function syncStockStatuses() {
  await Product.updateMany({ quantity: 0 }, { status: "Out of Stock" });

  const inStock = await Product.find({ quantity: { $gt: 0 } });
  let fixedCount = 0;
  for (const product of inStock) {
    const correctStatus =
      product.quantity <= product.threshold ? "Low Stock" : "In Stock";
    if (product.status !== correctStatus) {
      product.status = correctStatus;
      await product.save({ validateBeforeSave: false });
      fixedCount++;
    }
  }
  return { fixedCount };
}

const startCronJobs = () => {
  console.log("Cron jobs initialized");

  cron.schedule("0 * * * *", async () => {
    console.log("Running scheduled stock status check");

    try {
      const { fixedCount } = await syncStockStatuses();
      console.log(`Cron: Stock sync done (threshold fixes: ${fixedCount})`);
    } catch (error) {
      console.error("Cron job error:", error.message);
    }
  });

  cron.schedule("0 0 * * *", async () => {
    try {
      const totalProducts = await Product.countDocuments();
      const lowStock = await Product.countDocuments({ status: "Low Stock" });
      const outOfStock = await Product.countDocuments({
        status: "Out of Stock",
      });

      console.log("Daily Inventory Summary:");
      console.log(`Total Products: ${totalProducts}`);
      console.log(`Low Stock: ${lowStock}`);
      console.log(`Out of Stock: ${outOfStock}`);
    } catch (error) {
      console.error("Daily summary error:", error.message);
    }
  });
};

module.exports = { startCronJobs, syncStockStatuses };
