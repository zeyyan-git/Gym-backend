const mongoose = require("mongoose");

// Cached connection: works both on a normal server and on Vercel serverless
let cached = global._mongooseCache || (global._mongooseCache = { conn: null, promise: null });

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("MongoDB Connected");
  } catch (error) {
    cached.promise = null;
    console.error("MongoDB Connection Error:", error.message);
    throw error;
  }
  return cached.conn;
};

module.exports = connectDB;
