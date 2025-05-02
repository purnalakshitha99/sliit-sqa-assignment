// backend/controllers/categoryController.js
const Category = require("../models/Category");

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name, color, icon } = req.body;

    // Check if category already exists for this user
    const existingCategory = await Category.findOne({
      user: req.user.id,
      name: name,
    });

    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({
      user: req.user.id,
      name,
      color,
      icon,
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all categories for a user
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user.id }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a category
const updateCategory = async (req, res) => {
  try {
    const { name, color, icon } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if the category belongs to the user
    if (category.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this category" });
    }

    // Update fields
    category.name = name || category.name;
    category.color = color || category.color;
    category.icon = icon || category.icon;

    await category.save();

    res.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a category
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if the category belongs to the user
    if (category.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this category" });
    }

    await category.deleteOne();

    res.json({ message: "Category removed" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};