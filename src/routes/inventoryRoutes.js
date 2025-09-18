const express = require("express");
const router = express.Router();
const inv = require("../controllers/inventoryController");

router.post("/movements", inv.createMovement);
router.get("/movements", inv.listMovements);
router.get("/balance/:productId", inv.getBalance);
router.post("/recalculate/:productId", inv.recalculateBalance);

module.exports = router;
