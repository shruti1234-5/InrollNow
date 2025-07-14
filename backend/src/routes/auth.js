const express = require('express');
const passport = require('passport');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const registerStudentModel = require('../models/registerStudentModel');
require('dotenv').config();

if (!process.env.GOOGLE_CLIENT_ID) {
  console.error('GOOGLE_CLIENT_ID is not set in environment variables');
  process.exit(1);
}

// Google OAuth configuration
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.BACKEND_URL + '/auth/google/callback'
);

// Debug logging for URLs
console.log('Auth Routes Configuration:');
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('BACKEND_URL:', process.env.BACKEND_URL);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account',
  accessType: 'offline'
}));

// Google OAuth callback route
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(process.env.CLIENT_URL + '/register?error=no_code');
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const userInfoResponse = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo'
    });

    const { email, name, sub: googleId } = userInfoResponse.data;

    let user = await registerStudentModel.findOne({ 
      $or: [{ email }, { googleId }] 
    });

    if (user) {
      // User exists. Check if they have completed the initial registration steps.
      // If phone and course are present, they have completed basic registration.
      if (user.phone && user.course) {
        // User is fully registered, log them in
        req.session.user = {
          _id: user._id, // Store user ID in session
          email: user.email,
          phone: user.phone,
          isAuthenticated: true
        };
        req.session.save(() => {
        return res.redirect(process.env.CLIENT_URL + '/dashboard');
        });
      } else {
        // User exists but hasn't completed phone/course step
        const redirectUrl = new URL(process.env.CLIENT_URL + '/register');
        redirectUrl.searchParams.append('name', name);
        redirectUrl.searchParams.append('email', email);
        redirectUrl.searchParams.append('googleId', googleId);
        // Pass existing phone/course if available (from partial attempts)
        if(user.phone) redirectUrl.searchParams.append('phone', user.phone);
        if(user.course) redirectUrl.searchParams.append('course', user.course);
        return res.redirect(redirectUrl.toString());
      }
    } else {
      // New user, redirect to complete registration
      const redirectUrl = new URL(process.env.CLIENT_URL + '/register');
      redirectUrl.searchParams.append('name', name);
      redirectUrl.searchParams.append('email', email);
      redirectUrl.searchParams.append('googleId', googleId);
      return res.redirect(redirectUrl.toString());
    }
  } catch (error) {
    console.error('Google callback error:', error);
    // Redirect to login with an error parameter
    return res.redirect(process.env.CLIENT_URL + '/register?error=google_auth_failed');
    }
});

// Google login route (handled by passport in callback, or direct post if needed)
// The callback handles the primary login flow.
// This route might be redundant if callback handles authentication fully.

// Google registration route (This is the initial check on the frontend Register page)
router.post('/google/register', async (req, res) => {
  try {
    const { credential, fromLogin } = req.body;
    // Use CLIENT_URL for token verification audience
    const audience = process.env.GOOGLE_CLIENT_ID;
    
    const ticket = await oauth2Client.verifyIdToken({
      idToken: credential,
      audience: audience
    });

    const payload = ticket.getPayload();
    const { email, name, picture, given_name, family_name, sub: googleId } = payload;

    // Check if user already exists based on email or googleId
    const existingUser = await registerStudentModel.findOne({ 
      $or: [{ email }, { googleId }] 
    });

    if (existingUser) {
      // User already registered
      // Include user info in the response
      return res.json({
                 success: true,
        isRegistered: true,
        message: 'User already registered',
        user: {
          _id: existingUser._id,
          email: existingUser.email,
          phone: existingUser.phone, // Include phone if available
          course: existingUser.course // Include course if available
          // Include other necessary user fields
        }
      });
    }

    // User not found, indicate they need to complete registration
    // No redirect here, frontend handles navigation based on isRegistered: false
    res.json({
      success: true,
      isRegistered: false,
      message: 'User not found, proceed to complete registration'
      // Frontend will redirect to /register with params
    });

  } catch (error) {
    console.error('Google registration check error:', error);
    res.status(500).json({ success: false, error: 'Failed to check registration status with Google' });
  }
});

// Complete Google signup route
router.post('/google/complete-signup', async (req, res) => {
  try {
    const { name, email, phone, course, googleId } = req.body;

    // Validate phone number format
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit phone number'
      });
    }

    // Check if user exists with this email or googleId
    const existingUser = await registerStudentModel.findOne({
      $or: [{ email }, { googleId }]
    });

    if (existingUser) {
      // If user exists but phone is different, check if phone is already registered
      if (existingUser.phone !== phone) {
        const existingUserByPhone = await registerStudentModel.findOne({ phone });
        if (!existingUserByPhone) {
          // Update existing user with new phone
          existingUser.phone = phone;
          existingUser.course = course;
          await existingUser.save();

          req.session.save(() => {
            res.json({
              success: true,
              message: 'Profile completed successfully',
              user: {
                _id: existingUser._id,
                email: existingUser.email,
                phone: existingUser.phone,
                isAuthenticated: true
              }
            });
          });
        } else {
          // Different user exists with the same phone
          console.log('Another user with this phone number already exists.');
          return res.status(400).json({
            success: false,
            error: 'User with this phone number already exists.'
          });
        }
      }
    } else {
      // No user found by email/googleId in initial check, and no user found by phone
      console.log('No existing user found by phone. Creating new user.');
      
      // Create new user
      const newUser = new registerStudentModel({
        name,
        email,
        phone,
        course,
        isGoogleUser: true,
        googleId
      });

      await newUser.save();
      console.log('New user created successfully:', newUser);

      // Set session
      req.session.user = {
        _id: newUser._id,
        email: newUser.email,
        phone: newUser.phone,
        isAuthenticated: true
      };

      res.json({
        success: true,
        message: 'Profile completed successfully',
        user: {
          _id: newUser._id,
          email: newUser.email,
          phone: newUser.phone,
          isAuthenticated: true
        }
      });
    }
  } catch (error) {
    console.error('Google signup completion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete signup'
    });
  }
});

// Check auth status route
router.get('/check-auth', (req, res) => {
         res.json({
    isAuthenticated: req.session.user?.isAuthenticated || false,
    user: req.session.user || null
         });
       });

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
  }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

module.exports = router; 