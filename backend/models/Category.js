// backend/models/Category.js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: "#6366f1", // Default color
    },
    icon: {
      type: String,
      default: "tag", // Default icon name
    },
  },
  {
    timestamps: true,
  }
);

// Ensure categories are unique per user
categorySchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);