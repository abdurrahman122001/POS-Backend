// seedAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Admin = require("./src/models/Admin");

const MONGO_URI = process.env.MONGODB_URI; // make sure you set this in your .env file

async function seedAdmin() {
  try {
    if (!MONGO_URI) {
      console.error("❌ MONGO_URI not found. Please set it in .env");
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const email = "admin@example.com";
    const plainPassword = "Admin@123"; // default password

    // Check if admin already exists
    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log("✅ Admin already exists:", existing.email);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create admin
    const admin = new Admin({
      name: "Default Admin",
      email,
      password: hashedPassword,
      role: "superadmin",
    });

    await admin.save();
    console.log("🎉 Admin created successfully!");
    console.log("Email:", email);
    console.log("Password:", plainPassword);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding admin:", err);
    process.exit(1);
  }
}

seedAdmin();
