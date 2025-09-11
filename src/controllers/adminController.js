const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (admin) => {
  return jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// @desc   Register new admin
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await Admin.findOne({ email });
    if (exists) return res.status(400).json({ message: "Admin already exists" });

    const admin = await Admin.create({ name, email, password, role });
    res.status(201).json({
      message: "Admin registered successfully",
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc   Login admin
// controllers/adminController.js (login)
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// @desc   Get all admins
exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc   Delete admin
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json({ message: "Admin deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
