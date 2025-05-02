// backend/controllers/userController.js
const User = require("../models/User")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")

// Generate a JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" })
}

// Register a new user
const registerUser = async (req, res) => {
  const { name, email, password, nic, age, gender } = req.body

  if (!name || !email || !password || !nic || !age || !gender) {
    return res.status(400).json({ message: "Missing required fields" })
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" })
  }

  // Check if NIC already exists
  const existingNIC = await User.findOne({ nic })
  if (existingNIC) {
    return res.status(400).json({ message: "NIC already registered" })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    // Handle profile picture if uploaded
    let profilePic = null
    if (req.file) {
      profilePic = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      }
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      nic,
      age,
      gender,
      profilePic,
    })

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    })
  } catch (error) {
    console.error("Error registering user:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    })
  } catch (error) {
    console.error("Error logging in:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Don't send the actual image data in the profile response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      nic: user.nic,
      age: user.age,
      gender: user.gender,
      profilePic: user.profilePic ? true : false,
    }

    res.json(userResponse)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if NIC is being updated and if it's already in use by another user
    if (req.body.nic && req.body.nic !== user.nic) {
      const existingNIC = await User.findOne({ nic: req.body.nic })
      if (existingNIC && existingNIC._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: "NIC already registered by another user" })
      }
    }

    // Update basic fields
    user.name = req.body.name || user.name
    user.email = req.body.email || user.email
    user.nic = req.body.nic || user.nic
    user.age = req.body.age || user.age
    user.gender = req.body.gender || user.gender

    // Update password if provided
    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10)
    }

    // Handle profile picture if uploaded
    if (req.file) {
      user.profilePic = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      }
    }

    const updatedUser = await user.save()

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      nic: updatedUser.nic,
      age: updatedUser.age,
      gender: updatedUser.gender,
      profilePic: updatedUser.profilePic ? true : false,
    })
  } catch (error) {
    console.error("Error updating user profile:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get profile image
const getProfileImage = async (req, res) => {
  try {
    // Get user ID from either req.user (from middleware) or from token in query
    let userId = req.user ? req.user.id : null

    // If token is provided in query, verify it and get user ID
    if (!userId && req.query.token) {
      try {
        const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET)
        userId = decoded.id
      } catch (tokenError) {
        console.error("Invalid token:", tokenError)
        return res.status(401).send("Unauthorized")
      }
    }

    if (!userId) {
      return res.status(401).send("Unauthorized")
    }

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).send("User not found")
    }

    if (!user.profilePic || !user.profilePic.data) {
      // Send a default image or placeholder instead of 404
      return res.status(404).send("No profile image found")
    }

    // Set proper cache control headers to prevent caching issues
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private")
    res.set("Pragma", "no-cache")
    res.set("Expires", "0")
    res.set("Content-Type", user.profilePic.contentType)
    res.send(user.profilePic.data)
  } catch (error) {
    console.error("Error fetching profile image:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getProfileImage,
}
