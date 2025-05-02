"use client"

import { useState, useEffect } from "react"
import "../styles/ExpenseStats.css"
import { BarChart, PieChart, LineChart, Calendar, DollarSign } from "lucide-react"

const ExpenseStats = ({ stats, period, onPeriodChange }) => {
  const [chartData, setChartData] = useState([])
  const [totalAmount, setTotalAmount] = useState(0)

  useEffect(() => {
    if (stats) {
      console.log("Stats data received:", stats)
      setChartData(stats.stats || [])
      setTotalAmount(stats.totalAmount || 0)
    }
  }, [stats])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatPeriodLabel = () => {
    const now = new Date()

    if (period === "day") {
      return now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } else if (period === "month") {
      return now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    } else if (period === "year") {
      return now.getFullYear().toString()
    }

    return "Current Period"
  }

  const getLabel = (item) => {
    if (!item || !item._id) return "Unknown"

    if (period === "day") {
      if (item._id.year && item._id.month && item._id.day) {
        return `${item._id.month}/${item._id.day}/${item._id.year}`
      }
    } else if (period === "month") {
      if (item._id.year && item._id.month) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const monthIndex = Number.parseInt(item._id.month) - 1
        const monthName = monthNames[monthIndex] || item._id.month
        return `${monthName} ${item._id.year}`
      }
    } else if (period === "year") {
      if (item._id.year) {
        return item._id.year.toString()
      }
    } else if (typeof item._id === "string") {
      // Category view
      return item._id
    }

    return JSON.stringify(item._id).replace(/[{}"]/g, "")
  }

  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <div className="no-data">
          <p>No expense data available for this period</p>
        </div>
      )
    }

    // For simplicity, we're just showing a bar representation
    return (
      <div className="chart-container">
        {chartData.map((item, index) => {
          const percentage = totalAmount > 0 ? (item.total / totalAmount) * 100 : 0
          const label = getLabel(item)

          return (
            <div key={index} className="chart-item">
              <div className="chart-label" title={label}>
                {label}
              </div>
              <div className="chart-bar-container">
                <div
                  className="chart-bar"
                  style={{ width: `${Math.max(percentage, 2)}%` }}
                  title={`${formatCurrency(item.total)} (${percentage.toFixed(1)}%)`}
                ></div>
              </div>
              <div className="chart-value">{formatCurrency(item.total)}</div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="expense-stats">
      <div className="stats-header">
        <h3>Expense Statistics</h3>
        <div className="period-selector">
          <button
            className={`period-btn ${period === "day" ? "active" : ""}`}
            onClick={() => onPeriodChange("day")}
            title="Daily view"
          >
            <Calendar size={16} />
            <span>Day</span>
          </button>
          <button
            className={`period-btn ${period === "month" ? "active" : ""}`}
            onClick={() => onPeriodChange("month")}
            title="Monthly view"
          >
            <BarChart size={16} />
            <span>Month</span>
          </button>
          <button
            className={`period-btn ${period === "year" ? "active" : ""}`}
            onClick={() => onPeriodChange("year")}
            title="Yearly view"
          >
            <LineChart size={16} />
            <span>Year</span>
          </button>
          <button
            className={`period-btn ${period === "category" ? "active" : ""}`}
            onClick={() => onPeriodChange("category")}
            title="Category view"
          >
            <PieChart size={16} />
            <span>Category</span>
          </button>
        </div>
      </div>

      <div className="stats-summary">
        <div className="total-amount">
          <div className="amount-icon">
            <DollarSign size={24} />
          </div>
          <div className="amount-details">
            <h4>Total Expenses</h4>
            <div className="amount-value">{formatCurrency(totalAmount)}</div>
            <div className="period-label">{formatPeriodLabel()}</div>
          </div>
        </div>
      </div>

      <div className="stats-chart">
        <h4>Expense Breakdown</h4>
        {renderChart()}
      </div>
    </div>
  )
}

export default ExpenseStats
