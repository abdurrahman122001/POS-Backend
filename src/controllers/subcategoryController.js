const Subcategory = require("../models/Subcategory");
const Category = require("../models/Category");

// Helper to handle Mongo duplicate key errors cleanly
const isDupKeyError = (err) => err && err.code === 11000;

// GET /subcategories/:id
exports.getSubcategory = async (req, res) => {
    try {
        const item = await Subcategory.findById(req.params.id).populate({
            path: "category",
            select: "name isActive",
        });
        if (!item) return res.status(404).json({ message: "Subcategory not found" });
        res.json(item);
    } catch (err) {
        res.status(400).json({ message: "Invalid ID" });
    }
};


// POST /subcategories
// body: { name, description?, image?, isActive?, category }
exports.createSubcategory = async (req, res) => {
    try {
        const { name, description = "", image, isActive = true, category } = req.body;


        if (!name || !category) {
            return res.status(400).json({ message: "'name' and 'category' are required" });
        }


        const catExists = await Category.findById(category);
        if (!catExists) return res.status(404).json({ message: "Parent category not found" });


        const created = await Subcategory.create({
            name: name.trim(),
            description: description.trim(),
            image,
            isActive,
            category,
        });


        const populated = await created.populate({ path: "category", select: "name isActive" });
        res.status(201).json(populated);
    } catch (err) {
        if (isDupKeyError(err)) {
            return res
                .status(409)
                .json({ message: "A subcategory with this name already exists in the selected category" });
        }
        res.status(500).json({ message: "Failed to create subcategory" });
    }
};
// GET /subcategories?search=&category=&isActive=true
exports.listSubcategories = async (req, res) => {
    try {
        const { search = "", category, isActive } = req.query;


        const filter = {};
        if (search) filter.name = { $regex: search, $options: "i" };
        if (category) filter.category = category;
        if (typeof isActive !== "undefined") filter.isActive = isActive === "true";


        const items = await Subcategory.find(filter)
            .populate({ path: "category", select: "name isActive" })
            .sort({ createdAt: -1 });


        res.json(items);
    } catch (err) {
        res.status(500).json({ message: "Failed to load subcategories" });
    }
};


// PUT /subcategories/:id
exports.updateSubcategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, image, isActive, category } = req.body;


        if (category) {
            const catExists = await Category.findById(category);
            if (!catExists) return res.status(404).json({ message: "Parent category not found" });
        }


        const update = {};
        if (typeof name !== "undefined") update.name = name.trim();
        if (typeof description !== "undefined") update.description = (description || "").trim();
        if (typeof image !== "undefined") update.image = image;
        if (typeof isActive !== "undefined") update.isActive = !!isActive;
        if (typeof category !== "undefined") update.category = category;


        const updated = await Subcategory.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
        }).populate({ path: "category", select: "name isActive" });


        if (!updated) return res.status(404).json({ message: "Subcategory not found" });


        res.json(updated);
    } catch (err) {
        if (isDupKeyError(err)) {
            return res
                .status(409)
                .json({ message: "A subcategory with this name already exists in the selected category" });
        }
        res.status(500).json({ message: "Failed to update subcategory" });
    }
};


// DELETE /subcategories/:id
exports.deleteSubcategory = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Subcategory.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: "Subcategory not found" });
        res.json({ message: "Subcategory deleted" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete subcategory" });
    }
};