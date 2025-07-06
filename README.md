# InRollNow - Student Registration System

A full-stack student registration system with Google OAuth, payment integration, and document management.

## 🚀 Deployment Guide

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- Google OAuth credentials
- Cloudinary account
- Razorpay account
- Mailjet account

### Environment Variables

#### Backend (.env)
```env
# Required
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=https://your-frontend-domain.vercel.app
BACKEND_URL=https://your-backend-domain.vercel.app

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Mailjet (optional)
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_API_SECRET=your_mailjet_api_secret
```

#### Frontend (.env)
```env
# Required
VITE_API_BASE_URL=https://your-backend-domain.vercel.app
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_BASE_PATH=/
```

### Deployment Steps

#### 1. Backend Deployment (Vercel)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set the root directory to `backend`
4. Add all environment variables in Vercel dashboard
5. Deploy

#### 2. Frontend Deployment (Vercel)
1. Create a new Vercel project
2. Set the root directory to `frontend`
3. Add environment variables
4. Deploy

#### 3. Render Deployment (Alternative)
1. Connect your GitHub repository to Render
2. Use the provided `render.yaml` files
3. Add environment variables in Render dashboard
4. Deploy both services

### Local Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Features
- Google OAuth authentication
- Student registration with multi-step form
- Document upload and management
- Payment integration with Razorpay
- Email notifications
- PDF generation
- Responsive design

### Tech Stack
- **Frontend**: React, Vite, Material-UI, Bootstrap
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Authentication**: Passport.js, Google OAuth
- **Payments**: Razorpay
- **File Storage**: Cloudinary
- **Email**: Mailjet
- **Deployment**: Vercel/Render 