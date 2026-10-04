// Run with: npm run seed
// Creates (or resets the password of) the admin account defined in .env
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Admin = require("./models/Admin");

const seedAdmin = async () => {
  await connectDB();

const ADMIN_NAME = "Zuhair";
const ADMIN_EMAIL = "myfitnessgym@gmail.com";
const ADMIN_PASSWORD = "Admin@123";

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  const existing = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() });

  if (existing) {
    existing.password = ADMIN_PASSWORD;
    existing.name = ADMIN_NAME || existing.name;
    await existing.save();
    console.log(`Admin password reset for ${ADMIN_EMAIL}`);
  } else {
    await Admin.create({
      name: ADMIN_NAME || "Gym Admin",
      email: ADMIN_EMAIL.toLowerCase(),
      password: ADMIN_PASSWORD,
    });
    console.log(`Admin created: ${ADMIN_EMAIL}`);
  }

  mongoose.connection.close();
  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
