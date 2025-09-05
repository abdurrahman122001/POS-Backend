const router = require("express").Router();
const ctrl = require("../controllers/subcategoryController");


router.get("/", ctrl.listSubcategories);
router.get("/:id", ctrl.getSubcategory);
router.post("/", ctrl.createSubcategory);
router.put("/:id", ctrl.updateSubcategory);
router.delete("/:id", ctrl.deleteSubcategory);


module.exports = router;