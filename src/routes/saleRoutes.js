// routes/saleRoutes.js
const express = require("express");
const { createSale, listSales } = require("../controllers/saleController");

const router = express.Router();
router.get("/", listSales);
router.post("/", createSale);

module.exports = router;
