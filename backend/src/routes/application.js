const express = require('express');
const router = express.Router();
const registerStudentModel = require('../models/registerStudentModel');
const studentDetailsModel = require('../models/studentDetailsModel');
const multer = require('multer'); // Import multer
const path = require('path'); // Import path module
const fs = require('fs'); // Import fs module
const PDFDocument = require('pdfkit'); // Import pdfkit module
const cloudinary = require('cloudinary').v2; // Import cloudinary
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // Import CloudinaryStorage
const axios = require('axios'); // Import axios

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'admportal', // Optional: specify a folder in your Cloudinary account
    allowed_formats: ['jpg', 'png', 'pdf'], // Optional: specify allowed formats
    resource_type: 'auto', // Automatically detect resource type
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' } // Limit image size
    ]
  },
});

// Create multer instance with Cloudinary storage
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Application router test successful!' });
});

// Get application status route
router.get('/status', async (req, res) => {
  try {
    // Assuming status check can be done by phone or email
    const { email, phone } = req.query;

    let queryPhone = phone; // Use phone from query initially

    if (email && !phone) {
      // If only email is provided, find the user in registerStudentModel to get phone
      const registeredUserByEmail = await registerStudentModel.findOne({ email });
      if (registeredUserByEmail) {
        queryPhone = registeredUserByEmail.phone; // Use phone from registered user
      } else {
         return res.status(404).json({ error: 'User not found in initial registration' });
      }
    } else if (!phone && !email) {
       return res.status(400).json({ error: 'Phone number or email is required' });
    }

    // Find the user in studentDetailsModel
    const userDetails = await studentDetailsModel.findOne({ phone: queryPhone });
    if (!userDetails) {
      return res.status(404).json({ error: 'Application details not found' });
    }

    // Find the user in registerStudentModel
    const registeredUser = await registerStudentModel.findOne({ phone: queryPhone });
    if (!registeredUser) {
      return res.status(404).json({ error: 'User not found in registration' });
    }

    // Combine data from both models
    const applicationData = {
      ...userDetails.toObject(), // Include all fields from studentDetails
      name: registeredUser?.name, // Add name from registerStudentModel
      email: registeredUser?.email, // Add email from registerStudentModel
      course: registeredUser?.course, // Add course from registerStudentModel
      applicationId: registeredUser?.applicationId // Add applicationId from registerStudentModel
    };

    // Return all relevant application data including nested details and added fields
    res.json({
      success: true,
      application: applicationData, // Sending the combined data
      payment: userDetails.payment, // Include payment status
      seatPayment: userDetails.seatPayment // Include seat payment status
    });
  } catch (error) {
    console.error('Get application status error:', error);
    res.status(500).json({ error: 'Failed to get application status' });
  }
});

// Route to download application form as PDF
router.get('/form/:phone/download', async (req, res) => {
  try {
    const { phone } = req.params;
    const [application, studentDetails] = await Promise.all([
      registerStudentModel.findOne({ phone }),
      studentDetailsModel.findOne({ phone })
    ]);

    if (!application || !studentDetails) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Check if payment is completed
    if (!studentDetails.payment || studentDetails.payment.status !== 'completed') {
      return res.status(403).json({ 
        success: false, 
        error: 'Payment not completed. Please complete the payment to download the application form.' 
      });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=application-form.pdf`);
    doc.pipe(res);

    // Add profile image if available (placed on the right side)
    // let y = 40;
    // if (studentDetails.documents?.profileImage) {
    //   try {
    //     const imageUrl = studentDetails.documents.profileImage;
    //     const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    //     const imageBuffer = Buffer.from(response.data);
    //     doc.image(imageBuffer, doc.page.width - 140, y, { fit: [100, 120] }); // Positioned to the right
    //   } catch (error) {
    //     doc.font('Helvetica').fontSize(8).text('Error Loading Image', doc.page.width - 140, y + 60, { width: 100, align: 'center' });
    //   }
    // }

    // Title
    doc.fontSize(16).font('Helvetica-Bold').text('Student Application Form', { align: 'center' });
    y = doc.y + 20;

    // Application ID and Date
    doc.fontSize(10).font('Helvetica')
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 40, y + 10);
    y = doc.y + 30; // Spacing after ID and Date

    // Section 1: Personal Details Header
    doc.save()
       .rect(40, y, 520, 20) // Blue header background
       .fill('#003366');
    doc.fillColor('white')
       .fontSize(12).font('Helvetica-Bold')
       .text('1. Personal Details', 50, y + 5);
    doc.restore();
    y += 30; // Space after header

    const pd = studentDetails.personalDetails?.candidateDetails || {};
    const parents = studentDetails.personalDetails?.parentsDetails || {};
    const address = studentDetails.personalDetails?.address || {};

    // Personal Information (Left Column)
    doc.fontSize(10).font('Helvetica-Bold').text('Personal Information:', 40, y);
    doc.font('Helvetica').text(`Full Name: ${[pd.name, pd.middleName, pd.lastName].filter(Boolean).join(' ') || 'N/A'}`, 40, y + 15);
    doc.text(`Gender: ${pd.gender || 'N/A'}`, 40, y + 30);
    doc.text(`Date of Birth: ${pd.dateOfBirth ? new Date(pd.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'}`, 40, y + 45);
    doc.text(`Adhaar No: ${pd.adhaarNo || 'N/A'}`, 40, y + 60);

    // Parent Information (Right Column, align with Personal Information header)
    doc.fontSize(10).font('Helvetica-Bold').text('Parent Information:', 280, y);
    doc.font('Helvetica').text(`Father's Name: ${parents.fatherName || 'N/A'}`, 280, y + 15);
    doc.text(`Father's Mobile: ${parents.fatherPhone || 'N/A'}`, 280, y + 30);
    doc.text(`Mother's Name: ${parents.motherName || 'N/A'}`, 280, y + 45);
    doc.text(`Mother's Mobile: ${parents.motherPhone || 'N/A'}`, 280, y + 60);

    // Profile Image Not Available (positioned near Parent Information, on the right)
    // if (!studentDetails.documents?.profileImage) {
    //     doc.font('Helvetica').fontSize(8).text('Profile Image Not Available', 450, y + 15, { width: 100, align: 'center' });
    // }

    y += 90; // Spacing after personal/parent details

    // Address Information
    doc.fontSize(10).font('Helvetica-Bold').text('Address Information:', 40, y);
    doc.font('Helvetica').text(`Address: ${address.fullAddress || 'N/A'}`, 40, y + 15);
    doc.text(`State: ${address.state || 'N/A'}`, 40, y + 30);
    doc.text(`City: ${address.city || 'N/A'}`, 40, y + 45);
    doc.text(`Pincode: ${address.pincode || 'N/A'}`, 280, y + 45); // Pincode on right
    y += 75; // Spacing after address

    // Section 2: Academic Details Header
    doc.save()
       .rect(40, y, 520, 20) // Blue header background
       .fill('#003366');
    doc.fillColor('white')
       .fontSize(12).font('Helvetica-Bold')
       .text('2. Academic Details', 50, y + 5);
    doc.restore();
    y += 30;

    const qd = studentDetails.qualificationDetails || {};
    const hs = qd.highSchool || {};
    const inter = qd.intermediate || {};

    // 10th Standard
    doc.fontSize(10).font('Helvetica-Bold').text('10th Standard:', 40, y);
    doc.font('Helvetica').text(`Board: ${hs.board || 'N/A'}`, 40, y + 15);
    doc.text(`Year: ${hs.passingYear || 'N/A'}`, 40, y + 30);
    doc.text(`School: ${hs.schoolName || 'N/A'}`, 280, y + 15);
    doc.text(`Percentage: ${hs.percentage || 'N/A'}%`, 280, y + 30);
    y += 50; // Spacing

    // 12th Standard
    doc.fontSize(10).font('Helvetica-Bold').text('12th Standard:', 40, y);
    doc.font('Helvetica').text(`Board: ${inter.board || 'N/A'}`, 40, y + 15);
    doc.text(`Year: ${inter.passingYear || 'N/A'}`, 40, y + 30);
    doc.text(`School: ${inter.schoolName || 'N/A'}`, 280, y + 15);
    doc.text(`Percentage: ${inter.percentage || 'N/A'}%`, 280, y + 30);
    y += 50; // Spacing

    // Higher Education (if available)
    if (qd.higherEducation && qd.higherEducation.length > 0) {
        doc.fontSize(10).font('Helvetica-Bold').text('Higher Education:', 40, y);
        y += 15;
        qd.higherEducation.forEach((edu, index) => {
            doc.font('Helvetica').text(`Degree: ${edu.degree || 'N/A'}`, 40, y);
            doc.text(`University: ${edu.university || 'N/A'}`, 40, y + 15);
            doc.text(`Status: ${edu.passoutStatus || 'N/A'}`, 40, y + 30);
            if (edu.passoutStatus === 'Passed out') {
                doc.text(`Percentage: ${edu.percentage || 'N/A'}%`, 40, y + 45);
            }
            y += 60; // Spacing for each higher education entry
        });
    }


    doc.end();
  } catch (error) {
    console.error('Error generating application form:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate application form'
      });
    }
  }
});

// Submit or Update application route (handles data from all steps, including files)
router.post('/update', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'marksheet10', maxCount: 1 },
    { name: 'marksheet12', maxCount: 1 },
    { name: 'graduationMarksheet', maxCount: 1 },
    { name: 'idProof', maxCount: 1 },
    { name: 'gapCertificate', maxCount: 1 }
]), async (req, res) => {
  try {
    const { phone } = req.body;
    const uploadedFiles = req.files;

    console.log('Received uploadedFiles:', uploadedFiles);

    // Find registered user
    const registeredUser = await registerStudentModel.findOne({ phone });
    if (!registeredUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find or create student details
    let studentDetails = await studentDetailsModel.findOne({ phone });
    if (!studentDetails) {
      studentDetails = new studentDetailsModel({ phone });
    }

    // Update personal details
    if (req.body.personalDetails) {
      try {
        const personalDetails = typeof req.body.personalDetails === 'string' 
          ? JSON.parse(req.body.personalDetails)
          : req.body.personalDetails;
          
        studentDetails.personalDetails = personalDetails;
        studentDetails.status.personalDetails = {
            completed: true,
            enabled: true,
            lastUpdated: new Date()
        };
      } catch (parseError) {
        console.error('Error handling personalDetails:', parseError);
        return res.status(400).json({
          success: false,
          message: 'Invalid personal details format'
        });
      }
    }

    // Update qualification details
    if (req.body.qualificationDetails) {
      try {
        const qualificationDetails = typeof req.body.qualificationDetails === 'string'
          ? JSON.parse(req.body.qualificationDetails)
          : req.body.qualificationDetails;
          
        // Ensure all required fields are present
        if (!qualificationDetails.highSchool) {
          qualificationDetails.highSchool = {
            board: '',
            schoolName: '',
            rollNumber: '',
            passingYear: null,
            percentage: null
          };
        }
        if (!qualificationDetails.intermediate) {
          qualificationDetails.intermediate = {
            board: '',
            schoolName: '',
            rollNumber: '',
            passingYear: null,
            percentage: null
          };
        }
        if (!qualificationDetails.higherEducation) {
          qualificationDetails.higherEducation = [];
        }
          
        studentDetails.qualificationDetails = qualificationDetails;
        studentDetails.status.qualificationDetails = {
            completed: true,
            enabled: true,
            lastUpdated: new Date()
        };
      } catch (parseError) {
        console.error('Error handling qualificationDetails:', parseError);
        return res.status(400).json({
          success: false,
          message: 'Invalid qualification details format'
        });
      }
    }

    // Handle work experience
    const { workExperience } = req.body;
    if (workExperience) {
         try {
            studentDetails.workExperience = JSON.parse(workExperience);
         } catch (parseError) {
             console.error('Error parsing workExperience JSON:', parseError);
         }
    }

    // Handle uploaded files only if files are present in the request
    if (uploadedFiles && Object.keys(uploadedFiles).length > 0) {
      // Ensure studentDetails.documents object exists
      if (!studentDetails.documents) {
        studentDetails.documents = {};
      }
      
      // Helper function to safely update document URL
      const updateDocumentUrl = (fileKey, documentKey) => {
        if (uploadedFiles[fileKey] && uploadedFiles[fileKey].length > 0) {
          studentDetails.documents[documentKey] = uploadedFiles[fileKey][0].secure_url || uploadedFiles[fileKey][0].url;
          return true;
        }
        return false;
      };

      // Update each document if it exists in the upload
      const documentsUpdated = [
        updateDocumentUrl('profileImage', 'profileImage'),
        updateDocumentUrl('marksheet10', 'marksheet10'),
        updateDocumentUrl('marksheet12', 'marksheet12'),
        updateDocumentUrl('graduationMarksheet', 'graduationMarksheet'),
        updateDocumentUrl('idProof', 'idProof'),
        updateDocumentUrl('gapCertificate', 'gapCertificate')
      ].some(updated => updated);

      // Only update documents status if at least one document was updated
      if (documentsUpdated) {
        studentDetails.status.documents = {
          completed: true,
          enabled: true,
          lastUpdated: new Date()
        };
      }
    }

    await studentDetails.save();
    console.log('Application data updated successfully for user:', phone);

    res.json({
      success: true,
      message: 'Application data saved successfully',
      application: studentDetails
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: error.message
    });
  }
});

module.exports = router; 