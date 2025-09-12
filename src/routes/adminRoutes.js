const express = require("express");
const {
  registerAdmin,
  loginAdmin,
  forgotPasswordAdmin, 
  resetPasswordAdmin,
  getAdmins,
  deleteAdmin,
} = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Public
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/forgot-password", forgotPasswordAdmin);
router.post("/reset-password/:token", resetPasswordAdmin);
// Protected
router.get("/", authMiddleware, getAdmins);
router.delete("/:id", authMiddleware, deleteAdmin);

module.exports = router;
