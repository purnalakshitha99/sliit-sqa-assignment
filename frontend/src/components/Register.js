import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import "../styles/Register.css"

const Register = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nic, setNic] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [profilePic, setProfilePic] = useState(null)
  const [fileName, setFileName] = useState("No file chosen")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfilePic(file)
      setFileName(file.name)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("name", name)
    formData.append("email", email)
    formData.append("password", password)
    formData.append("nic", nic)
    formData.append("age", age)
    formData.append("gender", gender)
    if (profilePic) formData.append("profilePic", profilePic)

    try {
      await axios.post("http://localhost:5000/api/users/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      toast.success("Registration successful! Please log in.")
      navigate("/login")
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed. Try again with valid data.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">Join Us Today</h1>
          <p className="register-subtitle">Create your account in just a few steps</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="input-group">
              <label htmlFor="name" className="input-label">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="email" className="input-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="nic" className="input-label">
                National ID
              </label>
              <input
                id="nic"
                type="text"
                placeholder="Enter your NIC number"
                value={nic}
                onChange={(e) => setNic(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="age" className="input-label">
                Age
              </label>
              <input
                id="age"
                type="number"
                placeholder="Your age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="gender" className="input-label">
                Gender
              </label>
              <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} required>
                <option value="">Select your gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="file-input-group full-width">
              <label className="file-input-label">Profile Picture</label>
              <div className="file-input-wrapper">
                <div className="file-input-button">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload your profile picture
                </div>
                <input type="file" className="file-input" onChange={handleFileChange} accept="image/*" />
              </div>
              <div className="file-name">{fileName}</div>
            </div>
          </div>

          <button type="submit" className={isSubmitting ? "submitting" : ""} disabled={isSubmitting}>
            {isSubmitting ? "Creating Your Account..." : "Create Account"}
          </button>
        </form>

        <div className="login-link">
          Already have an account? <a href="/login">Sign in here</a>
        </div>
      </div>
    </div>
  )
}

export default Register
