// routes/saleRoutes.js
const express = require("express");
const { createSale, listSales, deleteSale, getSale, createReturn } = require("../controllers/saleController");

const router = express.Router();
router.get("/", listSales);
router.post("/", createSale);
router.delete("/:id", deleteSale);
router.get("/:id", getSale); // New route for getting single sale details
router.post("/return", createReturn)
module.exports = router;
