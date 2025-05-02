// backend/controllers/expenseController.js
const Expense = require("../models/Expense")
const PDFDocument = require("pdfkit")
const fs = require("fs")
const path = require("path")
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")

// Create a new expense
const createExpense = async (req, res) => {
  try {
    const { title, amount, category, description, date } = req.body

    // Handle receipt file if uploaded
    let receipt = null
    if (req.file) {
      receipt = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      }
    }

    const expense = await Expense.create({
      user: req.user.id,
      title,
      amount: Number.parseFloat(amount),
      category,
      description,
      date: date ? new Date(date) : new Date(),
      receipt,
    })

    // Don't send the actual image data in the response
    const expenseResponse = {
      ...expense.toObject(),
      receipt: receipt ? true : false,
    }

    res.status(201).json(expenseResponse)
  } catch (error) {
    console.error("Error creating expense:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get all expenses for a user
const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category, sortBy, sortOrder } = req.query

    console.log("Filter request:", { startDate, endDate, category, sortBy, sortOrder })

    // Build query
    const query = { user: new mongoose.Types.ObjectId(req.user.id) }

    // Date filtering
    if (startDate || endDate) {
      query.date = {}
      if (startDate) {
        const parsedStartDate = new Date(startDate)
        // Set time to beginning of day (00:00:00)
        parsedStartDate.setHours(0, 0, 0, 0)
        query.date.$gte = parsedStartDate
      }
      if (endDate) {
        const parsedEndDate = new Date(endDate)
        // Set time to end of day (23:59:59)
        parsedEndDate.setHours(23, 59, 59, 999)
        query.date.$lte = parsedEndDate
      }
    }

    // Category filtering
    if (category && category.trim() !== "") {
      query.category = category
    }

    console.log("Query:", JSON.stringify(query))

    // Build sort options
    const sort = {}
    if (sortBy) {
      sort[sortBy] = sortOrder === "desc" ? -1 : 1
    } else {
      sort.date = -1 // Default sort by date descending
    }

    console.log("Sort:", JSON.stringify(sort))

    const expenses = await Expense.find(query).sort(sort)

    console.log(`Found ${expenses.length} expenses`)

    // Transform expenses to not include the actual image data
    const transformedExpenses = expenses.map((expense) => {
      const expenseObj = expense.toObject()
      if (expenseObj.receipt) {
        expenseObj.receipt = true // Just indicate receipt exists
      }
      return expenseObj
    })

    res.json(transformedExpenses)
  } catch (error) {
    console.error("Error fetching expenses:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get a single expense by ID
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" })
    }

    // Check if the expense belongs to the user
    if (expense.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to access this expense" })
    }

    // Don't send the actual image data in the response
    const expenseResponse = {
      ...expense.toObject(),
      receipt: expense.receipt ? true : false,
    }

    res.json(expenseResponse)
  } catch (error) {
    console.error("Error fetching expense:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update an expense
const updateExpense = async (req, res) => {
  try {
    const { title, amount, category, description, date } = req.body

    const expense = await Expense.findById(req.params.id)

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" })
    }

    // Check if the expense belongs to the user
    if (expense.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this expense" })
    }

    // Update fields
    expense.title = title || expense.title
    expense.amount = amount ? Number.parseFloat(amount) : expense.amount
    expense.category = category || expense.category
    expense.description = description !== undefined ? description : expense.description
    expense.date = date ? new Date(date) : expense.date

    // Handle receipt file if uploaded
    if (req.file) {
      expense.receipt = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      }
    }

    await expense.save()

    // Don't send the actual image data in the response
    const expenseResponse = {
      ...expense.toObject(),
      receipt: expense.receipt ? true : false,
    }

    res.json(expenseResponse)
  } catch (error) {
    console.error("Error updating expense:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Delete an expense
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" })
    }

    // Check if the expense belongs to the user
    if (expense.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this expense" })
    }

    await expense.deleteOne()

    res.json({ message: "Expense removed" })
  } catch (error) {
    console.error("Error deleting expense:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get expense statistics
const getExpenseStats = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query

    console.log("Stats request:", { period, startDate, endDate, userId: req.user.id })

    // Validate dates
    let start, end
    if (startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
    } else {
      // Default to current month if no dates provided
      const now = new Date()
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    // Build match stage for aggregation
    const match = {
      user: new mongoose.Types.ObjectId(req.user.id),
      date: { $gte: start, $lte: end },
    }

    console.log("Match stage:", JSON.stringify(match))

    // Build group stage based on period
    let groupStage
    if (period === "day") {
      groupStage = {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          day: { $dayOfMonth: "$date" },
        },
      }
    } else if (period === "month") {
      groupStage = {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
      }
    } else if (period === "year") {
      groupStage = {
        _id: {
          year: { $year: "$date" },
        },
      }
    } else {
      // Default to category grouping
      groupStage = {
        _id: "$category",
      }
    }

    // Add total calculation to group stage
    groupStage.total = { $sum: "$amount" }
    groupStage.count = { $sum: 1 }

    console.log("Group stage:", JSON.stringify(groupStage))

    // Run aggregation with error handling
    let stats = []
    try {
      stats = await Expense.aggregate([
        { $match: match },
        { $group: groupStage },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ])
      console.log("Stats results:", stats.length)
    } catch (aggError) {
      console.error("Aggregation error:", aggError)
      // Return empty stats instead of failing
      stats = []
    }

    // Calculate overall total with error handling
    let totalAmount = 0
    try {
      const totalResult = await Expense.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      totalAmount = totalResult.length > 0 ? totalResult[0].total : 0
    } catch (totalError) {
      console.error("Total calculation error:", totalError)
      // Calculate total manually if aggregation fails
      const expenses = await Expense.find(match)
      totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    }

    res.json({
      stats,
      totalAmount,
      period,
      startDate: start,
      endDate: end,
    })
  } catch (error) {
    console.error("Error getting expense stats:", error)
    // Send a more detailed error response
    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
    })
  }
}

// Generate PDF report of expenses
const generatePDF = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query

    // Build query
    const query = { user: req.user.id }

    // Date filtering
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) query.date.$lte = new Date(endDate)
    }

    // Category filtering
    if (category) query.category = category

    // Get expenses
    const expenses = await Expense.find(query).sort({ date: -1 })

    // Calculate total
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    // Create a PDF document
    const doc = new PDFDocument()

    // Set response headers
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename=expenses-report-${Date.now()}.pdf`)

    // Pipe the PDF to the response
    doc.pipe(res)

    // Add content to the PDF
    doc.fontSize(20).text("Expense Report", { align: "center" })
    doc.moveDown()

    // Add date range
    if (startDate || endDate) {
      doc
        .fontSize(12)
        .text(
          `Period: ${startDate ? new Date(startDate).toLocaleDateString() : "All"} to ${endDate ? new Date(endDate).toLocaleDateString() : "Present"}`,
          { align: "center" },
        )
      doc.moveDown()
    }

    // Add category if filtered
    if (category) {
      doc.fontSize(12).text(`Category: ${category}`, { align: "center" })
      doc.moveDown()
    }

    // Add table headers
    doc.fontSize(12)
    doc.text("Date", 50, doc.y, { width: 100 })
    doc.text("Title", 150, doc.y - doc.currentLineHeight(), { width: 150 })
    doc.text("Category", 300, doc.y - doc.currentLineHeight(), { width: 100 })
    doc.text("Amount", 400, doc.y - doc.currentLineHeight(), { width: 100, align: "right" })

    doc.moveDown()
    doc.lineCap("butt").moveTo(50, doc.y).lineTo(500, doc.y).stroke()
    doc.moveDown()

    // Add expenses
    expenses.forEach((expense) => {
      const y = doc.y
      doc.text(new Date(expense.date).toLocaleDateString(), 50, y, { width: 100 })
      doc.text(expense.title, 150, y, { width: 150 })
      doc.text(expense.category, 300, y, { width: 100 })
      doc.text(`$${expense.amount.toFixed(2)}`, 400, y, { width: 100, align: "right" })
      doc.moveDown()
    })

    // Add total
    doc.moveDown()
    doc.lineCap("butt").moveTo(50, doc.y).lineTo(500, doc.y).stroke()
    doc.moveDown()

    doc.fontSize(14).text(`Total: $${total.toFixed(2)}`, 400, doc.y, { width: 100, align: "right" })

    // Finalize the PDF
    doc.end()
  } catch (error) {
    console.error("Error generating PDF:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get receipt image
const getReceiptImage = async (req, res) => {
  try {
    console.log("Receipt image request for expense ID:", req.params.id)
    console.log("Token from query:", req.query.token ? "Present" : "Not present")

    // Get user ID from either req.user (from middleware) or from token in query
    let userId = req.user ? req.user.id : null

    // If token is provided in query, verify it and get user ID
    if (!userId && req.query.token) {
      try {
        const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET)
        userId = decoded.id
        console.log("Decoded user ID from token:", userId)
      } catch (tokenError) {
        console.error("Invalid token:", tokenError)
        return res.status(401).send("Unauthorized - Invalid token")
      }
    }

    if (!userId) {
      console.error("No user ID found in request")
      return res.status(401).send("Unauthorized - No user ID")
    }

    // Find the expense by ID
    const expense = await Expense.findById(req.params.id)

    if (!expense) {
      console.error("Expense not found:", req.params.id)
      return res.status(404).send("Expense not found")
    }

    console.log("Expense user ID:", expense.user.toString())
    console.log("Request user ID:", userId)

    // Check if the expense belongs to the user
    if (expense.user.toString() !== userId) {
      console.error("User not authorized to access this receipt")
      return res.status(403).send("Not authorized to access this receipt")
    }

    if (!expense.receipt || !expense.receipt.data) {
      console.error("No receipt image found for expense:", req.params.id)
      return res.status(404).send("No receipt image found")
    }

    // Set proper cache control headers to prevent caching issues
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private")
    res.set("Pragma", "no-cache")
    res.set("Expires", "0")
    res.set("Content-Type", expense.receipt.contentType)

    console.log("Sending receipt image with content type:", expense.receipt.contentType)
    res.send(expense.receipt.data)
  } catch (error) {
    console.error("Error fetching receipt image:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  generatePDF,
  getReceiptImage,
}
