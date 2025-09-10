// routes/tender.routes.js
const express = require("express");
const {
  listDenoms,
  getDenom,
  createDenom,
  updateDenom,
  deleteDenom,
  seedDefaults,
} = require("../controllers/tenderController");

const router = express.Router();

router.get("/", listDenoms);           // /api/tender-denoms?active=true
router.get("/seed", seedDefaults);     // seeding helper
router.get("/:id", getDenom);
router.post("/", createDenom);
router.put("/:id", updateDenom);
router.delete("/:id", deleteDenom);

module.exports = router;
