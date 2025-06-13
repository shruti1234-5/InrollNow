const express = require('express');
const router = express.Router();
const registerStudentModel = require('../models/registerStudentModel');
const Razorpay = require('razorpay'); // Import Razorpay library
const studentDetailsModel = require('../models/studentDetailsModel');
const PDFDocument = require('pdfkit'); // Import pdfkit
const fs = require('fs'); // Import fs
const path = require('path'); // Import path

// Initialize Razorpay client (use your actual key_id and key_secret)
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Make sure to add this to your .env file
  key_secret: process.env.RAZORPAY_KEY_SECRET, // Make sure to add this to your .env file
});

// Get payment status route
router.get('/status', async (req, res) => {
  try {
    const { email } = req.query;
    const user = await registerStudentModel.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      payment: {
        status: user.paymentStatus,
        amount: user.paymentAmount,
        transactionId: user.transactionId
      }
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

// POST route to create a new Razorpay order
router.post('/create', async (req, res) => {
  try {
    const { amount, phone, course } = req.body;

    console.log(`Received amount: ${amount}, phone: ${phone}, course: ${course}`); // Debug log

    // Basic validation
    if (!amount || !phone || !course) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Create order
    const order = await razorpayInstance.orders.create({
      amount: amount * 100, // amount in smallest currency unit
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        phone: phone,
        course: course
      }
    });

    res.json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

// POST route to verify Razorpay payment signature
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, phone, type } = req.body; // Include phone and type

    // Create a HMAC-SHA256 hash with Razorpay secret and compare with received signature
    const generated_signature = require('crypto')
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    const isSignatureValid = generated_signature === razorpay_signature;

    if (isSignatureValid) {
      // Signature is valid, payment is successful.
      // You might want to fetch the payment details from Razorpay API here to confirm amount, status etc.
      // For now, we assume it's successful based on signature.

      // Optionally, update payment status in your database here
      // This part is handled in the frontend for now by calling /payment/update after verification

      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      // Signature is invalid
      res.status(400).json({ success: false, message: 'Payment verification failed: Invalid signature' });
    }

  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
  }
});

// Route to get registration payment receipt data
router.get('/receipt/:phone', async (req, res) => {
  try {
    const { phone } = req.params;

    // Fetch data from both models
    const [application, studentDetails] = await Promise.all([
      registerStudentModel.findOne({ phone }),
      studentDetailsModel.findOne({ phone })
    ]);

    if (!application || !studentDetails) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Check if payment exists and is completed
    if (!studentDetails.payment || studentDetails.payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'No completed registration payment record found'
      });
    }

    // Get payment details from Razorpay
    let paymentDetailsFromRazorpay = null;
    try {
       paymentDetailsFromRazorpay = await razorpayInstance.payments.fetch(studentDetails.payment.payment_id);
    } catch (razorpayError) {
       console.error('Error fetching Razorpay payment:', razorpayError);
       // Continue even if fetching from Razorpay fails, use data from DB
    }

    // Combine data from both models and Razorpay (if available)
    const receiptData = {
      ...application.toObject(), // Data from registerStudentModel (includes name, email, phone, course, applicationId)
      ...studentDetails.toObject(), // Data from studentDetailsModel (includes personalDetails, qualificationDetails, documents, payment, seatPayment, status)
      payment: { // Prioritize Razorpay data if available, otherwise use DB
          ...(studentDetails.payment.toObject()),
          amount: paymentDetailsFromRazorpay ? paymentDetailsFromRazorpay.amount / 100 : studentDetails.payment.amount, // Use Razorpay amount if available (convert to rupees)
          date: paymentDetailsFromRazorpay ? new Date(paymentDetailsFromRazorpay.created_at * 1000).getTime() : (studentDetails.payment.completedAt ? new Date(studentDetails.payment.completedAt).getTime() : null), // Use Razorpay date if available (convert to milliseconds)
          status: paymentDetailsFromRazorpay ? (paymentDetailsFromRazorpay.status === 'captured' ? 'Completed' : (paymentDetailsFromRazorpay.status.charAt(0).toUpperCase() + paymentDetailsFromRazorpay.status.slice(1))) : (studentDetails.payment.status ? studentDetails.payment.status.charAt(0).toUpperCase() + studentDetails.payment.status.slice(1) : 'N/A') // Use Razorpay status if available
      }
      // personalDetails is already included from studentDetails.toObject()
    };

    res.json({
      success: true,
      ...receiptData
    });

  } catch (error) {
    console.error('Error fetching registration receipt:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Route to download registration payment receipt as PDF
router.get('/receipt/:phone/download', async (req, res) => {
  try {
    const { phone } = req.params;
    const [application, studentDetails] = await Promise.all([
      registerStudentModel.findOne({ phone }),
      studentDetailsModel.findOne({ phone })
    ]);
    if (!application || !studentDetails) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    if (!studentDetails.payment || studentDetails.payment.status !== 'completed') {
      return res.status(400).json({ success: false, error: 'No completed registration payment found' });
    }

    let paymentDetailsFromRazorpay = null;
    try {
       paymentDetailsFromRazorpay = await razorpayInstance.payments.fetch(studentDetails.payment.payment_id);
    } catch (razorpayError) {
       console.error('Error fetching Razorpay payment for download:', razorpayError);
       // Continue even if fetching from Razorpay fails, use data from DB
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payment-receipt-${studentDetails.payment.payment_id}.pdf`);
    doc.pipe(res);

    // Logo path and centering - Adjusted path to go up one directory from routes and then into assets
    const logoPath = path.join(__dirname, '..' ,'assets', 'download.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, (doc.page.width - 80) / 2, 30, { width: 80 });
    }

    // Institute name and title
    doc.moveDown(3)
      .fontSize(16).font('Helvetica-Bold')
      .fontSize(14)
      .moveDown(1)
      .fontSize(14)
      .text('PAYMENT RECEIPT', { align: 'center', underline: true })
      .moveDown(2);

    // Define column positions and widths
    const leftMargin = 50;
    const rightMargin = doc.page.width - 50;
    const contentWidth = rightMargin - leftMargin;
    const colWidth = contentWidth / 2;

    // Function to draw a section header
    const drawSectionHeader = (text, y) => {
      doc.save()
         .rect(leftMargin, y, contentWidth, 25)
         .fill('#003366');
      doc.fillColor('white')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(text, leftMargin + 10, y + 7);
      doc.restore();
      return y + 35;
    };

    // Function to draw a row with label and value
    const drawRow = (label, value, x, y, width) => {
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .text(label, x, y, { continued: true, width: width * 0.4 });
      doc.font('Helvetica')
         .text(value, { width: width * 0.6 });
      return doc.y;
    };

    // Payment Details Section
    let y = drawSectionHeader('Payment Details', doc.y);

    // Determine payment details to display (from Razorpay or DB)
    const paymentToDisplay = paymentDetailsFromRazorpay || studentDetails.payment;
    const amountToDisplay = paymentDetailsFromRazorpay ? (paymentDetailsFromRazorpay.amount / 100).toFixed(2) : (studentDetails.payment.amount || 'N/A');
    const dateToDisplay = paymentDetailsFromRazorpay ? new Date(paymentDetailsFromRazorpay.created_at * 1000).toLocaleDateString() : (studentDetails.payment.completedAt ? new Date(studentDetails.payment.completedAt).toLocaleDateString() : 'N/A');
    const receiptNumber = paymentDetailsFromRazorpay ? paymentDetailsFromRazorpay.id : (studentDetails.payment.payment_id || 'N/A');

    // Draw payment details rows
    y = drawRow('Receipt Number:', receiptNumber, leftMargin, y, colWidth);
    y = drawRow('Amount:', `Rs. ${amountToDisplay}`, leftMargin, y, colWidth);
    y = drawRow('Date:', dateToDisplay, leftMargin, y, colWidth);
    y = drawRow('Status:', paymentToDisplay.status.charAt(0).toUpperCase() + paymentToDisplay.status.slice(1), leftMargin, y, colWidth);

    // Add some space before next section
    doc.moveDown(2);

    // Applicant Details Section
    y = drawSectionHeader('Applicant Details', doc.y);

    const pd = studentDetails.personalDetails?.candidateDetails || {};

    // Left column
    let currentY = y;
    currentY = drawRow('Name:', application.name || 'N/A', leftMargin, currentY, colWidth);
    currentY = drawRow('Email:', application.email || 'N/A', leftMargin, currentY + 10, colWidth);

    // Right column
    currentY = y;
    currentY = drawRow('Course:', application.course || 'N/A', leftMargin + colWidth, currentY, colWidth);
    currentY = drawRow('Phone:', application.phone || 'N/A', leftMargin + colWidth, currentY + 10, colWidth);

    doc.end();
  } catch (error) {
    console.error('Error generating registration receipt:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Route to get seat payment receipt data
router.get('/seat-receipt/:phone', async (req, res) => {
  try {
    const { phone } = req.params;

    // Fetch data from both register and admission models
    const [application, studentDetails] = await Promise.all([
      registerStudentModel.findOne({ phone }), // Get application ID and email from here
      studentDetailsModel.findOne({ phone }) // Get payment and personal details from here
    ]);

    if (!application || !studentDetails) {
      return res.status(404).json({ success: false, error: 'Application or Student Details not found' });
    }

    // Check if seat payment exists and is completed
    if (!studentDetails.seatPayment || studentDetails.seatPayment.status !== 'completed') {
      return res.status(400).json({ success: false, error: 'Seat lock payment not completed' });
    }

     let paymentDetailsFromRazorpay = null;
    try {
       paymentDetailsFromRazorpay = await razorpayInstance.payments.fetch(studentDetails.seatPayment.payment_id);
    } catch (razorpayError) {
       console.error('Error fetching Razorpay seat payment:', razorpayError);
       // Continue even if fetching from Razorpay fails, use data from DB
    }

    // Combine data from both models and Razorpay (if available)
    const receiptData = {
      ...application.toObject(), // Include data from registerStudentModel (name, email, phone, course, applicationId)
      ...studentDetails.toObject(), // Include data from studentDetailsModel (personalDetails, qualificationDetails, documents, payment, seatPayment, status)
      payment: { // Use seatPayment details, prioritize Razorpay data if available
          ...(studentDetails.seatPayment.toObject()),
          amount: paymentDetailsFromRazorpay ? paymentDetailsFromRazorpay.amount / 100 : studentDetails.seatPayment.amount, // Use Razorpay amount if available
          date: paymentDetailsFromRazorpay ? new Date(paymentDetailsFromRazorpay.created_at * 1000).getTime() : (studentDetails.seatPayment.completedAt ? new Date(studentDetails.seatPayment.completedAt).getTime() : null), // Use Razorpay date if available
          status: paymentDetailsFromRazorpay ? (paymentDetailsFromRazorpay.status === 'captured' ? 'Completed' : (paymentDetailsFromRazorpay.status.charAt(0).toUpperCase() + paymentDetailsFromRazorpay.status.slice(1))) : (studentDetails.seatPayment.status ? studentDetails.seatPayment.status.charAt(0).toUpperCase() + studentDetails.seatPayment.status.slice(1) : 'N/A')
      }
      // personalDetails is already included from studentDetails.toObject()
    };

      res.json({ success: true, ...receiptData });

    } catch (error) {
    console.error('Error fetching seat receipt:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Route to download seat payment receipt as PDF
router.get('/seat-receipt/:phone/download', async (req, res) => {
  try {
    const { phone } = req.params;
    const [application, studentDetails] = await Promise.all([
      registerStudentModel.findOne({ phone }), // Get application ID and email from here
      studentDetailsModel.findOne({ phone }) // Get payment and personal details from here
    ]);

    if (!application || !studentDetails) {
      return res.status(404).json({ success: false, error: 'Application or Student Details not found' });
    }

    if (!studentDetails.seatPayment || studentDetails.seatPayment.status !== 'completed') {
      return res.status(400).json({ success: false, error: 'No completed seat lock payment found' });
    }

    let paymentDetailsFromRazorpay = null;
    try {
       paymentDetailsFromRazorpay = await razorpayInstance.payments.fetch(studentDetails.seatPayment.payment_id);
    } catch (razorpayError) {
       console.error('Error fetching Razorpay seat payment for download:', razorpayError);
       // Continue even if fetching from Razorpay fails, use data from DB
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=seat-receipt-${studentDetails.seatPayment.payment_id}.pdf`);
    doc.pipe(res);

    // Logo path and centering - Adjusted path
    const logoPath = path.join(__dirname, '..' ,'assets', 'download.png');
     if (fs.existsSync(logoPath)) {
      doc.image(logoPath, (doc.page.width - 80) / 2, 30, { width: 80 });
    }

    // Institute name and title
    doc.moveDown(3)
      .fontSize(16).font('Helvetica-Bold')
       .fontSize(14)
       .moveDown(1)
      .fontSize(14)
      .text('SEAT LOCK PAYMENT RECEIPT', { align: 'center', underline: true })
      .moveDown(2);

    // Define column positions and widths (reusing receipt logic)
    const leftMargin = 50;
    const rightMargin = doc.page.width - 50;
    const contentWidth = rightMargin - leftMargin;
    const colWidth = contentWidth / 2;

    // Function to draw a section header (reusing receipt logic)
    const drawSectionHeader = (text, y) => {
      doc.save()
         .rect(leftMargin, y, contentWidth, 25) // Adjusted height
         .fill('#003366');
      doc.fillColor('white')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(text, leftMargin + 10, y + 7); // Adjusted vertical alignment
      doc.restore();
      return y + 35; // Adjusted spacing
    };

    // Function to draw a row with label and value (reusing receipt logic)
    const drawRow = (label, value, x, y, width) => {
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .text(label, x, y, { continued: true, width: width * 0.4 });
      doc.font('Helvetica')
         .text(value, { width: width * 0.6 });
      return doc.y; // Return current Y position
    };

    // Payment Details Section - using seat payment data
    let y = drawSectionHeader('Payment Details', doc.y);

     // Determine payment details to display (from Razorpay or DB)
    const paymentToDisplay = paymentDetailsFromRazorpay || studentDetails.seatPayment;
    const rawAmount = paymentDetailsFromRazorpay ? paymentDetailsFromRazorpay.amount : studentDetails.seatPayment.amount;
    const amountToDisplay = typeof rawAmount === 'number' ? (rawAmount / 100).toFixed(2) : 'N/A';
    const dateToDisplay = paymentDetailsFromRazorpay ? new Date(paymentDetailsFromRazorpay.created_at * 1000).toLocaleDateString() : (studentDetails.seatPayment.completedAt ? new Date(studentDetails.seatPayment.completedAt).toLocaleDateString() : 'N/A');
    const statusToDisplay = paymentDetailsFromRazorpay ? (paymentDetailsFromRazorpay.status === 'captured' ? 'Completed' : (paymentDetailsFromRazorpay.status.charAt(0).toUpperCase() + paymentDetailsFromRazorpay.status.slice(1))) : (studentDetails.seatPayment.status ? studentDetails.seatPayment.status.charAt(0).toUpperCase() + studentDetails.seatPayment.status.slice(1) : 'N/A');
    const methodToDisplay = paymentDetailsFromRazorpay?.method || 'Online';
    const receiptNumber = paymentDetailsFromRazorpay ? paymentDetailsFromRazorpay.id : (studentDetails.seatPayment.payment_id || 'N/A');

    // Left column
    let currentY = y;
    currentY = drawRow('Receipt No:', receiptNumber, leftMargin, currentY, colWidth);
    currentY = drawRow('Order ID:', paymentToDisplay.order_id || 'N/A', leftMargin, currentY + 10, colWidth);
    currentY = drawRow('Amount:', `Rs ${amountToDisplay}`, leftMargin, currentY + 10, colWidth);

    // Right column
    currentY = y;
    currentY = drawRow('Date:', dateToDisplay, leftMargin + colWidth, currentY, colWidth);
    currentY = drawRow('Status:', statusToDisplay, leftMargin + colWidth, currentY + 10, colWidth);
    currentY = drawRow('Payment Mode:', methodToDisplay, leftMargin + colWidth, currentY + 10, colWidth);

    // Add some space before next section
    doc.moveDown(2);

    // Applicant Details Section - using registration and admission model data
    y = drawSectionHeader('Applicant Details', doc.y);

    const pd = studentDetails.personalDetails?.candidateDetails || {};

    // Left column
    currentY = y;
    currentY = drawRow('Name:', application.name || 'N/A', leftMargin, currentY, colWidth);
    currentY = drawRow('Email:', application.email || 'N/A', leftMargin, currentY + 10, colWidth);

    // Right column
    currentY = y;
    currentY = drawRow('Course:', application.course || 'N/A', leftMargin + colWidth, currentY, colWidth);
    currentY = drawRow('Phone:', application.phone || 'N/A', leftMargin + colWidth, currentY + 10, colWidth);

    doc.end();

  } catch (error) {
    console.error('Error generating seat receipt:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update payment status route
router.post('/update', async (req, res) => {
  try {
    const { phone, payment_id, order_id, status, type, amount } = req.body;

    console.log(`Received amount for payment update (${type}): ${amount}`);

    // Find and update student details
    const studentDetails = await studentDetailsModel.findOne({ phone });
    if (!studentDetails) {
      return res.status(404).json({
        success: false,
        message: 'Student details not found'
      });
    }

    // Update payment status based on type
    if (type === 'seat') {
      studentDetails.seatPayment = {
        status,
        payment_id,
        order_id,
        amount,
        completedAt: status === 'completed' ? new Date() : undefined
      };
    } else {
      studentDetails.payment = {
        status,
        payment_id,
        order_id,
        amount,
        completedAt: status === 'completed' ? new Date() : undefined
      };
    }

    await studentDetails.save();

    res.json({
      success: true,
      message: type === 'seat' ? 'Seat payment status updated successfully' : 'Registration payment status updated successfully',
      payment: studentDetails.payment,
      seatPayment: studentDetails.seatPayment
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message
    });
  }
});

module.exports = router; 