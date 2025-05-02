"use client"

import { useState, useEffect } from "react"
import "../styles/ExpenseFilters.css"
import { Filter, X, Search } from "lucide-react"

const ExpenseFilters = ({ filters, categories, onFilterChange, onApplyFilters }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState({
    startDate: "",
    endDate: "",
    category: "",
    sortBy: "date",
    sortOrder: "desc",
  })

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleChange = (e) => {
    const { name, value } = e.target
    console.log(`Filter changed: ${name} = ${value}`)

    // Update local state
    const updatedFilters = { ...localFilters, [name]: value }
    setLocalFilters(updatedFilters)

    // For sort options, apply immediately without requiring the Apply button
    if (name === "sortBy" || name === "sortOrder") {
      onFilterChange(updatedFilters)
      onApplyFilters()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Applying filters:", localFilters)
    onFilterChange(localFilters)
    onApplyFilters()
    setIsOpen(false)
  }

  const handleReset = () => {
    const resetFilters = {
      startDate: "",
      endDate: "",
      category: "",
      sortBy: "date",
      sortOrder: "desc",
    }
    console.log("Resetting filters")
    setLocalFilters(resetFilters)
    onFilterChange(resetFilters)
    onApplyFilters()
  }

  const toggleFilters = () => {
    setIsOpen(!isOpen)
  }

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "" // Invalid date
    return date.toISOString().split("T")[0]
  }

  return (
    <div className="expense-filters">
      <div className="filters-header">
        <button className={`toggle-filters-btn ${isOpen ? "active" : ""}`} onClick={toggleFilters}>
          <Filter size={16} />
          <span>Filters & Sorting</span>
        </button>

        {(localFilters.startDate || localFilters.endDate || localFilters.category) && (
          <button className="reset-filters-btn" onClick={handleReset}>
            <X size={16} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="filters-form">
          <div className="filter-group">
            <h4>Date Range</h4>
            <div className="date-inputs">
              <div className="input-group">
                <label htmlFor="startDate">From</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formatDateForInput(localFilters.startDate)}
                  onChange={handleChange}
                />
              </div>
              <div className="input-group">
                <label htmlFor="endDate">To</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formatDateForInput(localFilters.endDate)}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="filter-group">
            <h4>Category</h4>
            <select name="category" value={localFilters.category} onChange={handleChange}>
              <option value="">All Categories</option>
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
          </div>

          <div className="filter-group">
            <h4>Sort By</h4>
            <div className="sort-inputs">
              <select name="sortBy" value={localFilters.sortBy} onChange={handleChange}>
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="title">Title</option>
                <option value="category">Category</option>
              </select>
              <select name="sortOrder" value={localFilters.sortOrder} onChange={handleChange}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          <button type="submit" className="apply-filters-btn">
            <Search size={16} />
            <span>Apply Filters</span>
          </button>
        </form>
      )}
    </div>
  )
}

export default ExpenseFilters
