const express = require("express");
const {
  registerAdmin,
  loginAdmin,
  getAdmins,
  deleteAdmin,
} = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Public
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

// Protected
router.get("/", authMiddleware, getAdmins);
router.delete("/:id", authMiddleware, deleteAdmin);

module.exports = router;
