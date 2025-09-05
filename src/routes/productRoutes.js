// routes/products.js
const router = require("express").Router();
const ctrl = require("../controllers/productController");

router.get("/", ctrl.listProducts);
router.get("/:id", ctrl.getProduct);
router.post("/", ctrl.createProduct);
router.put("/:id", ctrl.updateProduct);
router.delete("/:id", ctrl.deleteProduct);

module.exports = router;
