const express = require('express');
const router = express.Router();
const registerStudentModel = require('../models/registerStudentModel');

// Registration route
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, course, password, confirmPassword } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !course) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate password if provided
    if (password && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Check if user already exists
    const existingUser = await registerStudentModel.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone number already exists'
      });
    }

    // Create new user
    const newUser = new registerStudentModel({
      name,
      email,
      phone,
      course,
      password: password || undefined, // Only set password if provided
      isGoogleUser: !password // Set isGoogleUser based on whether password is provided
    });

    await newUser.save();

    // Set session for auto-login after registration
    req.session.user = {
      _id: newUser._id,
      email: newUser.email,
      phone: newUser.phone,
      isAuthenticated: true
    };
    req.session.save(() => {
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: {
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          course: newUser.course,
        }
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

module.exports = router; 