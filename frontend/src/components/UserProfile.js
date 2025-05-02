"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import Navbar from "./Navbar"
import "../styles/UserProfile.css"
import { toast } from "react-toastify"
import { User, Upload, Save, Eye, EyeOff } from "lucide-react"

const UserProfile = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    nic: "",
    age: "",
    gender: "",
    profilePic: "",
  })

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nic: "",
    age: "",
    gender: "",
    password: "",
    confirmPassword: "",
  })

  const [profilePic, setProfilePic] = useState(null)
  const [fileName, setFileName] = useState("No file chosen")
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [profileImageUrl, setProfileImageUrl] = useState(null)
  const [imageError, setImageError] = useState(false)
  const profileImageRef = useRef(null)

  const navigate = useNavigate()

  // Function to get profile image URL with auth token
  const getProfileImageUrl = () => {
    const token = localStorage.getItem("token")
    if (!token) return null

    // Add token and timestamp to prevent caching
    return `http://localhost:5000/api/users/profile/image?token=${token}&t=${Date.now()}`
  }

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        navigate("/login")
        return
      }

      try {
        const { data } = await axios.get("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })

        setUser(data)
        setFormData({
          name: data.name || "",
          email: data.email || "",
          nic: data.nic || "",
          age: data.age || "",
          gender: data.gender || "",
          password: "",
          confirmPassword: "",
        })

        // Set profile image URL if user has a profile picture
        if (data.profilePic) {
          setProfileImageUrl(getProfileImageUrl())
          setImageError(false)
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("token")
          navigate("/login")
        } else {
          toast.error("Failed to load profile data")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file")
        return
      }

      console.log("Selected file:", file)
      setProfilePic(file)
      setFileName(file.name)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.nic.trim()) newErrors.nic = "NIC is required"

    if (!formData.age) newErrors.age = "Age is required"
    else if (isNaN(Number.parseInt(formData.age)) || Number.parseInt(formData.age) <= 0) {
      newErrors.age = "Age must be a positive number"
    }

    if (!formData.gender) newErrors.gender = "Gender is required"

    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      const updateData = new FormData()
      updateData.append("name", formData.name)
      updateData.append("email", formData.email)
      updateData.append("nic", formData.nic)
      updateData.append("age", formData.age)
      updateData.append("gender", formData.gender)

      if (formData.password) {
        updateData.append("password", formData.password)
      }

      if (profilePic) {
        updateData.append("profilePic", profilePic)
      }

      const { data } = await axios.put("http://localhost:5000/api/users/profile", updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      setUser(data)

      // Update profile image URL with cache-busting parameter
      if (data.profilePic) {
        setProfileImageUrl(getProfileImageUrl())
        setImageError(false)
      }

      setEditing(false)
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error(error.response?.data?.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleImageError = () => {
    console.error("Error loading profile image in profile page")
    setImageError(true)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <Navbar />

      <div className="profile-content">
        <div className="profile-header">
          <h1>User Profile</h1>
          <button className={`edit-profile-btn ${editing ? "cancel" : ""}`} onClick={() => setEditing(!editing)}>
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {!editing ? (
          <div className="profile-card">
            <div className="profile-image-container">
              {profileImageUrl && !imageError ? (
                <img
                  ref={profileImageRef}
                  src={profileImageUrl || "/placeholder.svg"}
                  alt="Profile"
                  className="profile-image"
                  onError={handleImageError}
                />
              ) : (
                <div className="profile-image-placeholder">
                  <User size={64} />
                </div>
              )}
            </div>

            <div className="profile-details">
              <div className="detail-item">
                <h3>Name</h3>
                <p>{user.name}</p>
              </div>

              <div className="detail-item">
                <h3>Email</h3>
                <p>{user.email}</p>
              </div>

              <div className="detail-item">
                <h3>NIC</h3>
                <p>{user.nic}</p>
              </div>

              <div className="detail-item">
                <h3>Age</h3>
                <p>{user.age}</p>
              </div>

              <div className="detail-item">
                <h3>Gender</h3>
                <p>{user.gender}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="profile-edit-card">
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="profile-image-upload">
                <div className="current-image">
                  {profileImageUrl && !imageError ? (
                    <img
                      ref={profileImageRef}
                      src={profileImageUrl || "/placeholder.svg"}
                      alt="Profile"
                      className="profile-image"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="profile-image-placeholder">
                      <User size={64} />
                    </div>
                  )}
                </div>

                <div className="file-input-group">
                  <div className="file-input-wrapper">
                    <div className="file-input-button">
                      <Upload size={20} />
                      Change Profile Picture
                    </div>
                    <input type="file" className="file-input" onChange={handleFileChange} accept="image/*" />
                  </div>
                  <div className="file-name">{fileName}</div>
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label htmlFor="name" className="input-label">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? "error" : ""}
                  />
                  {errors.name && <div className="error-message">{errors.name}</div>}
                </div>

                <div className="input-group">
                  <label htmlFor="email" className="input-label">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? "error" : ""}
                  />
                  {errors.email && <div className="error-message">{errors.email}</div>}
                </div>

                <div className="input-group">
                  <label htmlFor="nic" className="input-label">
                    NIC
                  </label>
                  <input
                    id="nic"
                    name="nic"
                    type="text"
                    value={formData.nic}
                    onChange={handleChange}
                    className={errors.nic ? "error" : ""}
                  />
                  {errors.nic && <div className="error-message">{errors.nic}</div>}
                </div>

                <div className="input-group">
                  <label htmlFor="age" className="input-label">
                    Age
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                    className={errors.age ? "error" : ""}
                  />
                  {errors.age && <div className="error-message">{errors.age}</div>}
                </div>

                <div className="input-group">
                  <label htmlFor="gender" className="input-label">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={errors.gender ? "error" : ""}
                  >
                    <option value="">Select your gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  {errors.gender && <div className="error-message">{errors.gender}</div>}
                </div>

                <div className="input-group">
                  <label htmlFor="password" className="input-label">
                    New Password (Optional)
                  </label>
                  <div className="password-input-container">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current"
                      className={errors.password ? "error" : ""}
                    />
                    <button type="button" className="toggle-password-btn" onClick={togglePasswordVisibility}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <div className="error-message">{errors.password}</div>}
                </div>

                <div className="input-group">
                  <label htmlFor="confirmPassword" className="input-label">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    className={errors.confirmPassword ? "error" : ""}
                  />
                  {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
                </div>
              </div>

              <button type="submit" className="save-profile-btn">
                <Save size={18} />
                Save Changes
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile
