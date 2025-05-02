"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import "../styles/Navbar.css"
import { Menu, X, User, LogOut, Home, BarChart2 } from "lucide-react"
import { toast } from "react-toastify"

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState(null)
  const [imageError, setImageError] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const profileImageRef = useRef(null)

  // Function to get profile image URL with auth token
  const getProfileImageUrl = () => {
    const token = localStorage.getItem("token")
    if (!token) return null

    // Add token and timestamp to prevent caching
    return `http://localhost:5000/api/users/profile/image?token=${token}&t=${Date.now()}`
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    setIsLoggedIn(!!token)

    if (token) {
      // Set profile image URL with cache-busting parameter
      setProfileImageUrl(getProfileImageUrl())
      setImageError(false)
    } else {
      setProfileImageUrl(null)
    }
  }, [location])

  const handleLogout = () => {
    localStorage.removeItem("token")
    setIsLoggedIn(false)
    setProfileImageUrl(null)
    toast.info("You have been logged out.")
    navigate("/login")
    setMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const handleImageError = () => {
    console.log("Profile image failed to load in navbar")
    setImageError(true)
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          <BarChart2 className="logo-icon" />
          <span>ExpenseTracker</span>
        </Link>

        <div className="menu-icon" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </div>

        <ul className={mobileMenuOpen ? "nav-menu active" : "nav-menu"}>
          <li className="nav-item">
            <Link to="/" className="nav-link" onClick={closeMobileMenu}>
              <Home size={18} />
              <span>Home</span>
            </Link>
          </li>

          {isLoggedIn ? (
            <>
              <li className="nav-item">
                <Link to="/dashboard" className="nav-link" onClick={closeMobileMenu}>
                  <BarChart2 size={18} />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/profile" className="nav-link profile-link" onClick={closeMobileMenu}>
                  {profileImageUrl && !imageError ? (
                    <img
                      ref={profileImageRef}
                      src={profileImageUrl || "/placeholder.svg"}
                      alt="Profile"
                      className="nav-profile-image"
                      onError={handleImageError}
                    />
                  ) : (
                    <User size={18} />
                  )}
                  <span>Profile</span>
                </Link>
              </li>
              <li className="nav-item">
                <button className="nav-link logout-btn" onClick={handleLogout}>
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-link" onClick={closeMobileMenu}>
                  <span>Login</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link register-link" onClick={closeMobileMenu}>
                  <span>Register</span>
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
