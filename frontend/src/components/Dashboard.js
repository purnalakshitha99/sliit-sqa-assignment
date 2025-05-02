"use client"

import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import Navbar from "./Navbar"
import ExpenseList from "./ExpenseList"
import ExpenseForm from "./ExpenseForm"
import ExpenseStats from "./ExpenseStats"
import ExpenseFilters from "./ExpenseFilters"
import "../styles/Dashboard.css"
import { toast } from "react-toastify"

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "",
    sortBy: "date",
    sortOrder: "desc",
  })
  const [stats, setStats] = useState(null)
  const [period, setPeriod] = useState("month")

  const navigate = useNavigate()

  // Use useCallback to memoize these functions
  const fetchExpenses = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")

      // Build query string from filters
      const queryParams = new URLSearchParams()

      if (filters.startDate) {
        // Ensure date is in ISO format
        const startDate = new Date(filters.startDate)
        if (!isNaN(startDate.getTime())) {
          queryParams.append("startDate", startDate.toISOString())
        }
      }

      if (filters.endDate) {
        // Ensure date is in ISO format
        const endDate = new Date(filters.endDate)
        if (!isNaN(endDate.getTime())) {
          queryParams.append("endDate", endDate.toISOString())
        }
      }

      if (filters.category && filters.category.trim() !== "") {
        queryParams.append("category", filters.category)
      }

      if (filters.sortBy) {
        queryParams.append("sortBy", filters.sortBy)
      }

      if (filters.sortOrder) {
        queryParams.append("sortOrder", filters.sortOrder)
      }

      console.log("Fetching expenses with params:", queryParams.toString())

      const response = await axios.get(`http://localhost:5000/api/expenses?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log(`Received ${response.data.length} expenses`)
      setExpenses(response.data)
    } catch (error) {
      console.error("Error fetching expenses:", error)
      toast.error("Failed to load expenses")
    }
  }, [filters])

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")

      // Get current date range based on period
      const now = new Date()
      let startDate, endDate

      if (period === "day") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      } else if (period === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      } else if (period === "year") {
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
      } else {
        // For category view, use the current month as default
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      }

      const queryParams = new URLSearchParams({
        period: period === "category" ? "" : period, // Don't send period for category view
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      console.log(`Fetching stats with params: ${queryParams.toString()}`)

      const response = await axios.get(`http://localhost:5000/api/expenses/stats?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log("Stats API response:", response.data)

      // If the API doesn't return the expected format, transform it
      let formattedStats = response.data

      // If the API doesn't return a stats property, create it
      if (!formattedStats.stats && Array.isArray(formattedStats)) {
        formattedStats = {
          stats: formattedStats,
          totalAmount: formattedStats.reduce((sum, item) => sum + (item.total || 0), 0),
          period,
          startDate,
          endDate,
        }
      }

      setStats(formattedStats)
    } catch (error) {
      console.error("Error fetching stats:", error)
      // Provide fallback data for testing
      setStats({
        stats: [],
        totalAmount: 0,
        period,
        startDate: new Date(),
        endDate: new Date(),
      })
      toast.error("Failed to load expense statistics")
    }
  }, [period])

  // Re-fetch expenses when filters change
  useEffect(() => {
    if (!loading) {
      fetchExpenses()
    }
  }, [fetchExpenses, loading])

  // Re-fetch stats when period changes
  useEffect(() => {
    if (!loading) {
      fetchStats()
    }
  }, [fetchStats, loading])

  useEffect(() => {
    const fetchUserAndData = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }

      try {
        // Fetch user profile
        const userResponse = await axios.get("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setUser(userResponse.data)

        // Fetch categories
        try {
          const categoriesResponse = await axios.get("http://localhost:5000/api/categories", {
            headers: { Authorization: `Bearer ${token}` },
          })
          setCategories(categoriesResponse.data)
        } catch (catError) {
          console.error("Error fetching categories:", catError)
          // Continue even if categories fail to load
        }

        // Initial data fetch
        await fetchExpenses()
        await fetchStats()
      } catch (error) {
        console.error("Error fetching data:", error)
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token")
          navigate("/login")
        } else {
          toast.error("Failed to load dashboard data")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndData()
  }, [navigate, fetchExpenses, fetchStats])

  const handleAddExpense = async (expenseData) => {
    try {
      const token = localStorage.getItem("token")

      const formData = new FormData()
      Object.keys(expenseData).forEach((key) => {
        if (expenseData[key] !== null && expenseData[key] !== undefined) {
          // Log what we're adding to the form data
          console.log(`Adding to form data: ${key}`, expenseData[key])

          // Special handling for the receipt file
          if (key === "receipt" && expenseData[key] instanceof File) {
            console.log("Adding receipt file:", expenseData[key].name)
          }

          formData.append(key, expenseData[key])
        }
      })

      // Log the form data entries for debugging
      for (const pair of formData.entries()) {
        console.log(`Form data: ${pair[0]}:`, pair[1])
      }

      const response = await axios.post("http://localhost:5000/api/expenses", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      console.log("Expense added response:", response.data)
      toast.success("Expense added successfully")
      setShowAddExpense(false)
      fetchExpenses()
      fetchStats()
    } catch (error) {
      console.error("Error adding expense:", error)
      toast.error(error.response?.data?.message || "Failed to add expense")
    }
  }

  const handleUpdateExpense = async (id, expenseData) => {
    try {
      const token = localStorage.getItem("token")

      const formData = new FormData()
      Object.keys(expenseData).forEach((key) => {
        if (expenseData[key] !== null && expenseData[key] !== undefined) {
          // Log what we're adding to the form data
          console.log(`Updating form data: ${key}`, expenseData[key])

          // Special handling for the receipt file
          if (key === "receipt" && expenseData[key] instanceof File) {
            console.log("Updating receipt file:", expenseData[key].name)
          }

          formData.append(key, expenseData[key])
        }
      })

      // Log the form data entries for debugging
      for (const pair of formData.entries()) {
        console.log(`Update form data: ${pair[0]}:`, pair[1])
      }

      const response = await axios.put(`http://localhost:5000/api/expenses/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      console.log("Expense updated response:", response.data)
      toast.success("Expense updated successfully")
      fetchExpenses()
      fetchStats()
    } catch (error) {
      console.error("Error updating expense:", error)
      toast.error(error.response?.data?.message || "Failed to update expense")
    }
  }

  const handleDeleteExpense = async (id) => {
    try {
      const token = localStorage.getItem("token")

      await axios.delete(`http://localhost:5000/api/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      toast.success("Expense deleted successfully")
      fetchExpenses()
      fetchStats()
    } catch (error) {
      console.error("Error deleting expense:", error)
      toast.error(error.response?.data?.message || "Failed to delete expense")
    }
  }

  const handleFilterChange = (newFilters) => {
    console.log("Filter change:", newFilters)
    setFilters({ ...filters, ...newFilters })
    // No need to call applyFilters here as the useEffect will handle it
  }

  const applyFilters = () => {
    console.log("Applying filters:", filters)
    fetchExpenses()
  }

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod)
    // No need to call fetchStats here as the useEffect will handle it
  }

  const downloadPDF = async () => {
    try {
      const token = localStorage.getItem("token")

      // Build query string from filters
      const queryParams = new URLSearchParams()
      if (filters.startDate) {
        const startDate = new Date(filters.startDate)
        if (!isNaN(startDate.getTime())) {
          queryParams.append("startDate", startDate.toISOString())
        }
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate)
        if (!isNaN(endDate.getTime())) {
          queryParams.append("endDate", endDate.toISOString())
        }
      }

      if (filters.category && filters.category.trim() !== "") {
        queryParams.append("category", filters.category)
      }

      // Make a request to get the PDF
      const response = await axios.get(`http://localhost:5000/api/expenses/pdf?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      })

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `expense-report-${new Date().toISOString().split("T")[0]}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.success("PDF report downloaded successfully")
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast.error("Failed to download PDF report")
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <Navbar />

      <div className="dashboard-header">
        <div className="user-welcome">
          <h1>Welcome, {user?.name}</h1>
          <p>Manage your expenses and track your spending</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-primary" onClick={() => setShowAddExpense(!showAddExpense)}>
            {showAddExpense ? "Cancel" : "Add Expense"}
          </button>
          <button className="btn btn-secondary" onClick={downloadPDF}>
            Download Report
          </button>
        </div>
      </div>

      {showAddExpense && (
        <div className="add-expense-container">
          <ExpenseForm onSubmit={handleAddExpense} categories={categories} onCancel={() => setShowAddExpense(false)} />
        </div>
      )}

      <div className="dashboard-content">
        <div className="dashboard-sidebar">
          <ExpenseStats stats={stats} period={period} onPeriodChange={handlePeriodChange} />

          <ExpenseFilters
            filters={filters}
            categories={categories}
            onFilterChange={handleFilterChange}
            onApplyFilters={applyFilters}
          />
        </div>

        <div className="dashboard-main">
          <ExpenseList
            expenses={expenses}
            onDelete={handleDeleteExpense}
            onUpdate={handleUpdateExpense}
            categories={categories}
          />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
