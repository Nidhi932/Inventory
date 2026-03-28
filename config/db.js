const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri || typeof uri !== "string" || !uri.trim()) {
    const err = new Error(
      "MONGO_URI is missing. Add it to your .env file in the project root.",
    );
    console.error(`${err.message}`);
    throw err;
  }

  try {
    const conn = await mongoose.connect(uri.trim());
    console.log(`MongoDB Connected`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
