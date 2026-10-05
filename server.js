require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const Admin = require("./models/Admin");

const authRoutes = require("./routes/authRoutes");
const memberRoutes = require("./routes/memberRoutes");

const configOk = Boolean(process.env.JWT_SECRET && process.env.MONGO_URI);
if (!configOk) console.error("JWT_SECRET and MONGO_URI must be set");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : true,
  })
);
app.use(express.json());

// Stop early if settings are missing, then make sure the database is connected
app.use(async (req, res, next) => {
  if (!configOk) {
    return res.status(500).json({ message: "Server is not configured (missing environment variables)" });
  }
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.get("/", (req, res) => {
  res.json({ message: "Gym Management API is running" });
});

// One-time admin creation (for hosts without a terminal).
// Works only if SETUP_KEY is set AND no admin exists yet. Admin details come from env vars.
// Open: /api/setup-admin?key=YOUR_SETUP_KEY   then DELETE the SETUP_KEY variable.
app.get("/api/setup-admin", async (req, res) => {
  try {
    const { SETUP_KEY, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!SETUP_KEY || req.query.key !== SETUP_KEY) {
      return res.status(404).json({ message: "Route not found" });
    }
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return res.status(400).json({ message: "ADMIN_EMAIL and ADMIN_PASSWORD must be set" });
    }
    if ((await Admin.countDocuments()) > 0) {
      return res.status(409).json({ message: "An admin already exists. Delete SETUP_KEY now." });
    }
    await Admin.create({
      name: ADMIN_NAME || "Gym Admin",
      email: ADMIN_EMAIL.toLowerCase(),
      password: ADMIN_PASSWORD,
    });
    res.json({ message: "Admin created. Now delete SETUP_KEY and ADMIN_PASSWORD from your environment variables." });
  } catch (err) {
    res.status(500).json({ message: "Setup failed", error: err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong", error: err.message });
});

// Start a normal server only when not running on Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
