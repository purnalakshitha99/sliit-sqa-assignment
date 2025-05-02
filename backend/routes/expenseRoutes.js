// backend/routes/expenseRoutes.js
const express = require("express")
const { protect } = require("../middleware/authMiddleware")
const upload = require("../middleware/multer")
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  generatePDF,
  getReceiptImage,
} = require("../controllers/expenseController")

const router = express.Router()

// Create expense with optional receipt upload
router.post("/", protect, upload.single("receipt"), createExpense)

// Get all expenses with filtering
router.get("/", protect, getExpenses)

// Get expense statistics
router.get("/stats", protect, getExpenseStats)

// Generate PDF report
router.get("/pdf", protect, generatePDF)

// Get receipt image - this route doesn't use the protect middleware
// because it accepts a token in the query parameter
router.get("/:id/receipt", getReceiptImage)

// Get, update, delete specific expense
router
  .route("/:id")
  .get(protect, getExpenseById)
  .put(protect, upload.single("receipt"), updateExpense)
  .delete(protect, deleteExpense)

module.exports = router
