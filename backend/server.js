require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorMiddleware");
const { startCronJobs } = require("./cronJobs");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");

const app = express();

const normalizeOrigin = (o) => o.replace(/\/$/, "");
const extraOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => normalizeOrigin(s.trim()))
  .filter(Boolean);
const frontendOrigins = [
  ...extraOrigins,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (frontendOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }
      callback(null, false);
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));

app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);

app.use("/api/invoices", invoiceRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running!",
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
    });
  }
  res.status(404).type("text/plain").send("Not found");
});

app.use(errorHandler);

startCronJobs();

const PORT = Number(process.env.PORT) || 5001;

async function start() {
  if (!process.env.JWT_SECRET?.trim()) {
    console.error("");
    console.error("JWT_SECRET is missing in backend/.env");
    console.error("");
    process.exit(1);
  }

  try {
    await connectDB();
  } catch {
    console.error("");
    console.error(
      "Fix backend/.env: set MONGO_URI to a valid MongoDB connection string.",
    );
    console.error("");
    process.exit(1);
  }

  const server = app
    .listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use.`);
      } else {
        console.error("Server error:", err.message);
      }
      process.exit(1);
    });

  return server;
}

start();
