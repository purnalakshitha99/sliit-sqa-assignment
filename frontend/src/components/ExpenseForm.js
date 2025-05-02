"use client"

import { useState, useEffect } from "react"
import "../styles/ExpenseForm.css"
import { X, Upload } from "lucide-react"
import { toast } from "react-toastify"

const ExpenseForm = ({ expense, onSubmit, onCancel, categories, isEditing = false }) => {
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [receipt, setReceipt] = useState(null)
  const [fileName, setFileName] = useState("No file chosen")
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (expense) {
      setTitle(expense.title || "")
      setAmount(expense.amount ? expense.amount.toString() : "")
      setCategory(expense.category || "")
      setDescription(expense.description || "")

      // Format date for input
      if (expense.date) {
        const expenseDate = new Date(expense.date)
        setDate(expenseDate.toISOString().split("T")[0])
      }

      // We can't set the file input value for security reasons
      // But we can show a placeholder filename if receipt exists
      if (expense.receipt) {
        setFileName("Receipt available")
      }
    } else {
      // Set today's date as default for new expenses
      const today = new Date()
      setDate(today.toISOString().split("T")[0])
    }
  }, [expense])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file")
        return
      }

      console.log("Selected file:", file)
      console.log("File type:", file.type)
      console.log("File size:", file.size)
      setReceipt(file)
      setFileName(file.name)
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!title.trim()) newErrors.title = "Title is required"
    if (!amount) newErrors.amount = "Amount is required"
    else if (isNaN(Number.parseFloat(amount)) || Number.parseFloat(amount) <= 0) {
      newErrors.amount = "Amount must be a positive number"
    }
    if (!category) newErrors.category = "Category is required"
    if (!date) newErrors.date = "Date is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) return

    const expenseData = {
      title,
      amount: Number.parseFloat(amount),
      category,
      description,
      date,
    }

    // Only add receipt if it exists
    if (receipt) {
      expenseData.receipt = receipt
      console.log("Adding receipt to form data:", receipt.name)
    }

    onSubmit(expenseData)

    // Reset form if not editing
    if (!isEditing) {
      setTitle("")
      setAmount("")
      setCategory("")
      setDescription("")
      const today = new Date()
      setDate(today.toISOString().split("T")[0])
      setReceipt(null)
      setFileName("No file chosen")
    }
  }

  return (
    <div className="expense-form-container">
      <div className="expense-form-header">
        <h3>{isEditing ? "Edit Expense" : "Add New Expense"}</h3>
        {onCancel && (
          <button type="button" className="close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="expense-form" encType="multipart/form-data">
        <div className="form-grid">
          <div className="input-group">
            <label htmlFor="title" className="input-label">
              Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="What did you spend on?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={errors.title ? "error" : ""}
            />
            {errors.title && <div className="error-message">{errors.title}</div>}
          </div>

          <div className="input-group">
            <label htmlFor="amount" className="input-label">
              Amount
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={errors.amount ? "error" : ""}
            />
            {errors.amount && <div className="error-message">{errors.amount}</div>}
          </div>

          <div className="input-group">
            <label htmlFor="category" className="input-label">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={errors.category ? "error" : ""}
            >
              <option value="">Select a category</option>
              {categories && categories.length > 0 ? (
                categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="Food">Food</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Health">Health</option>
                  <option value="Travel">Travel</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </>
              )}
            </select>
            {errors.category && <div className="error-message">{errors.category}</div>}
          </div>

          <div className="input-group">
            <label htmlFor="date" className="input-label">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={errors.date ? "error" : ""}
            />
            {errors.date && <div className="error-message">{errors.date}</div>}
          </div>

          <div className="input-group full-width">
            <label htmlFor="description" className="input-label">
              Description (Optional)
            </label>
            <textarea
              id="description"
              placeholder="Add more details about this expense"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
            ></textarea>
          </div>

          <div className="file-input-group full-width">
            <label className="input-label">Receipt (Optional)</label>
            <div className="file-input-wrapper">
              <div className="file-input-button">
                <Upload size={20} />
                <span>Upload receipt image</span>
              </div>
              <input type="file" name="receipt" className="file-input" onChange={handleFileChange} accept="image/*" />
            </div>
            <div className="file-name">{fileName}</div>
            {isEditing && expense.receipt && (
              <div className="existing-receipt-note">
                {receipt
                  ? "New receipt will replace the existing one"
                  : "Keep existing receipt if no new file is selected"}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn btn-primary">
            {isEditing ? "Update Expense" : "Add Expense"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ExpenseForm
