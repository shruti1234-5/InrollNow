const mongoose = require("mongoose");

const studentDetailsSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    ref: 'register-student',
    unique: true
  },

  personalDetails: {
    candidateDetails: {
      name: {
        type: String,
        required: function() {
          return this._isPersonalDetailsStep;
        }
      },
      middleName: String,
      lastName: String,
      gender: {
        type: String,
        required: function() {
          return this._isPersonalDetailsStep;
        }
      },
      dateOfBirth: {
        type: Date,
        required: function() {
          return this._isPersonalDetailsStep;
        }
      },
      adhaarNo: String
    },
    parentsDetails: {
      fatherName: String,
      fatherPhone: String,
      motherName: String,
      motherPhone: String
    },
    address: {
      fullAddress: {
        type: String,
        required: function() {
          return this._isPersonalDetailsStep;
        }
      },
      state: {
        type: String,
        required: function() {
          return this._isPersonalDetailsStep;
        }
      },
      city: {
        type: String,
        required: function() {
          return this._isPersonalDetailsStep;
        }
      },
      pincode: {
        type: String,
        required: function() {
          return this._isPersonalDetailsStep;
        }
      }
    },
  },

  qualificationDetails: {
    highSchool: {
      board: String,
      schoolName: String,
      rollNumber: String,
      passingYear: Number,
      percentage: Number
    },
    intermediate: {
      board: String,
      schoolName: String,
      rollNumber: String,
      passingYear: Number,
      percentage: Number
    },
    higherEducation: [{
      degree: String,
      university: String,
      passoutStatus: {
        type: String,
        enum: ['Appearing', 'Passed out']
      },
      percentage: {
        type: Number,
        min: 0,
        max: 100,
        required: function() {
          return this.passoutStatus === 'Passed out';
        }
      }
    }]
  },

  documents: {
    profileImage: {
      type: String,
      required: function() {
        return this._isDocumentsStep;
      }
    },
    marksheet10: String,
    marksheet12: String,
    graduationMarksheet: String,
    idProof: String,
    gapCertificate: String
  },

  payment: {
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed']
    },
    payment_id: String,
    order_id: String,
    completedAt: Date,
    reason: String
  },

  seatPayment: {
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed']
    },
    payment_id: String,
    order_id: String,
    completedAt: Date,
    reason: String
  },

  status: {
    personalDetails: {
      completed: Boolean,
      enabled: Boolean,
      lastUpdated: Date
    },
    qualificationDetails: {
      completed: Boolean,
      enabled: Boolean,
      lastUpdated: Date
    },
    documents: {
      completed: Boolean,
      enabled: Boolean,
      lastUpdated: Date
    }
  }
}, {
  timestamps: true,
});

// Add virtual properties for step validation
studentDetailsSchema.pre('validate', function(next) {
  // Determine which step is being submitted based on the data
  this._isPersonalDetailsStep = this.isModified('personalDetails');
  this._isDocumentsStep = this.isModified('documents');
  next();
});

const studentDetailsModel = mongoose.model("StudentDetails", studentDetailsSchema);
module.exports = studentDetailsModel;
