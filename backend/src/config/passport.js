const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const registerStudentModel = require('../models/registerStudentModel');
require('dotenv').config();

// Verify required environment variables
const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'BACKEND_URL'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
      scope: ['profile', 'email'],
      proxy: true // Enable proxy support for production
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await registerStudentModel.findOne({ email: profile.emails[0].value });

        if (user) {
          return done(null, user);
        }

        // If user doesn't exist, create new user with minimal info
        user = await registerStudentModel.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          isGoogleUser: true
        });

        return done(null, user);
      } catch (error) {
        console.error('Google Strategy Error:', error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await registerStudentModel.findById(id);
    done(null, user);
  } catch (error) {
    console.error('Deserialize User Error:', error);
    done(error, null);
  }
});

module.exports = passport; 