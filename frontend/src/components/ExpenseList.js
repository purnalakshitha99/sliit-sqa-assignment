"use client"

import React, { useState, useRef } from "react"
import ExpenseForm from "./ExpenseForm"
import "../styles/ExpenseList.css"
import { Edit, Trash2, ChevronDown, ChevronUp, ImageIcon, AlertCircle } from "lucide-react"

const ExpenseList = ({ expenses, onDelete, onUpdate, categories }) => {
  const [editingId, setEditingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageError, setImageError] = useState(false)
  const previewImageRef = useRef(null)
  const thumbnailRefs = useRef({})

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const handleEdit = (id) => {
    setEditingId(id)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
  }

  const handleUpdate = (expenseData) => {
    onUpdate(editingId, expenseData)
    setEditingId(null)
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  // Function to get image URL with auth token
  const getImageUrl = (expenseId) => {
    const token = localStorage.getItem("token")
    if (!token) return null

    // Add cache-busting parameter
    return `http://localhost:5000/api/expenses/${expenseId}/receipt?token=${token}&t=${Date.now()}`
  }

  const showImagePreview = (expenseId) => {
    setImageError(false)
    const imageUrl = getImageUrl(expenseId)

    if (!imageUrl) {
      console.error("Cannot load image: No authentication token")
      setImageError(true)
      return
    }

    console.log("Loading receipt image from:", imageUrl)
    setImagePreview(imageUrl)
  }

  const closeImagePreview = () => {
    setImagePreview(null)
    setImageError(false)
  }

  const handleImageError = (e, id) => {
    console.error(`Error loading image for expense ${id}:`, e)
    e.target.src = "/placeholder.svg?height=150&width=150"
    e.target.alt = "Receipt image not available"
    e.target.className = "thumbnail-image error"
  }

  const handlePreviewImageError = (e) => {
    console.error("Error loading preview image:", e)
    setImageError(true)
  }

  if (expenses.length === 0) {
    return (
      <div className="no-expenses">
        <h3>No expenses found</h3>
        <p>Add your first expense to start tracking your spending.</p>
      </div>
    )
  }

  return (
    <div className="expense-list">
      <h2>Your Expenses</h2>
      <div className="expense-table-container">
        <table className="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <React.Fragment key={expense._id}>
                <tr className={expandedId === expense._id ? "expanded" : ""}>
                  <td>{formatDate(expense.date)}</td>
                  <td>{expense.title}</td>
                  <td>
                    <span className="category-badge">{expense.category}</span>
                  </td>
                  <td className="amount">{formatCurrency(expense.amount)}</td>
                  <td className="actions">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEdit(expense._id)}
                      title="Edit expense"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => onDelete(expense._id)}
                      title="Delete expense"
                    >
                      <Trash2 size={16} />
                    </button>
                    {expense.receipt && (
                      <button
                        className="action-btn receipt-btn"
                        onClick={() => showImagePreview(expense._id)}
                        title="View receipt"
                      >
                        <ImageIcon size={16} />
                      </button>
                    )}
                    <button
                      className="action-btn expand-btn"
                      onClick={() => toggleExpand(expense._id)}
                      title={expandedId === expense._id ? "Hide details" : "Show details"}
                    >
                      {expandedId === expense._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </td>
                </tr>
                {expandedId === expense._id && (
                  <tr className="expense-details">
                    <td colSpan="5">
                      <div className="expense-description">
                        <h4>Description:</h4>
                        <p>{expense.description || "No description provided"}</p>

                        {expense.receipt && (
                          <div className="receipt-thumbnail">
                            <h4>Receipt:</h4>
                            <div className="thumbnail-container">
                              {/* Use a placeholder initially and only load the actual image when needed */}
                              <div
                                className="thumbnail-image placeholder"
                                onClick={() => showImagePreview(expense._id)}
                              >
                                <ImageIcon size={24} />
                                <span>View Receipt</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {editingId === expense._id && (
                  <tr className="edit-form-row">
                    <td colSpan="5">
                      <ExpenseForm
                        expense={expense}
                        onSubmit={handleUpdate}
                        onCancel={handleCancelEdit}
                        categories={categories}
                        isEditing={true}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Image Preview Modal */}
      {imagePreview && (
        <div className="image-preview-modal" onClick={closeImagePreview}>
          <div className="image-preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-preview-btn" onClick={closeImagePreview}>
              ×
            </button>
            {imageError ? (
              <div className="image-error-container">
                <AlertCircle size={48} />
                <h3>Image Not Available</h3>
                <p>The receipt image could not be loaded.</p>
              </div>
            ) : (
              <img
                ref={previewImageRef}
                src={imagePreview || "/placeholder.svg"}
                alt="Receipt"
                className="preview-image"
                onError={handlePreviewImageError}
                crossOrigin="anonymous"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpenseList
