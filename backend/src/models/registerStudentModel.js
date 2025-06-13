const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: function () {
        return !this.isGoogleUser; // Password required only for non-Google users
      },
    },
    phone: {
      type: String,
      required: function () {
        return !this.isGoogleUser; // Phone required only for non-Google users
      },
      match: /^[0-9]{10,12}$/, // Allow 10-12 digits (with or without country code)
      unique: true,
      sparse: true, // Allow null/undefined values for unique index
    },
    course: {
      type: String,
      enum: [
        "BBA (Girls Only)",
        "BCA (Girls Only)",
        "B.Com (Girls Only)",
        "B.Com (H) (Girls Only)",
        "M.Com (Girls Only)",
        "BBA (Co-Ed)",
        "BCA (Co-Ed)",
        "MCA (Co-Ed)",
        "MBA (Co-Ed)"
      ],
      required: function () {
        return !this.isGoogleUser; // Course required only for non-Google users
      },
    },
    googleId: {
      type: String,
      sparse: true
    },
    isGoogleUser: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
  }
);

// Password Validation Function
const validatePassword = (password) => {
  if (!password) return true; // Skip validation for empty passwords (Google users)
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  return passwordRegex.test(password);
};

// Hash Password Before Saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  if (!validatePassword(this.password)) {
    throw new Error(
      "Password must be at least 6 characters long, contain one uppercase letter, one lowercase letter, one number, and one special character."
    );
  }

  if (this.password) { // Only hash if password exists
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

const registerStudentModel = mongoose.model("register-student", userSchema);
module.exports = registerStudentModel;
