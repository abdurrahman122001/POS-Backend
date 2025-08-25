// routes/safeDropIn.routes.js
const express = require("express");
const {
  createSafeDropIn,
  getSafeDropIns,
  getSafeDropInById,
  updateSafeDropIn,
  deleteSafeDropIn,
} = require("../controllers/safeDropInController");

const router = express.Router();

// /api/safe-drop-ins
router.get("/", getSafeDropIns);
router.post("/", createSafeDropIn);
router.get("/:id", getSafeDropInById);
router.put("/:id", updateSafeDropIn);
router.delete("/:id", deleteSafeDropIn);

module.exports = router;
