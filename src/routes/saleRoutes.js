// routes/saleRoutes.js
const express = require("express");
const { createSale, listSales, deleteSale, getSale } = require("../controllers/saleController");

const router = express.Router();
router.get("/", listSales);
router.post("/", createSale);
router.delete("/:id", deleteSale);
router.get("/:id", getSale); // New route for getting single sale details

module.exports = router;
