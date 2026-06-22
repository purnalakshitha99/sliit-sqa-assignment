// backend/routes/categoryRoutes.js
const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { createCategory, getCategories, updateCategory, deleteCategory } = require("../controllers/categoryController");

const router = express.Router();

// All routes are protected
router.use(protect);

// Create and get categories
router.route("/").post(createCategory).get(getCategories);

// Update and delete specific category
router.route("/:id").put(updateCategory).delete(deleteCategory);

module.exports = router;