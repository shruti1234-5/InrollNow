# Deployment Checklist

## Before Deploying

### ✅ Environment Variables
- [ ] `VITE_API_BASE_URL` - Set to your backend URL
- [ ] `VITE_GOOGLE_CLIENT_ID` - Set to your Google OAuth client ID
- [ ] `VITE_BASE_PATH` - Set to `/` (default)

### ✅ Backend Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000`
- [ ] `MONGODB_URI` - MongoDB Atlas connection string
- [ ] `SESSION_SECRET` - Random secret string
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- [ ] `CLIENT_URL` - Your frontend domain
- [ ] `BACKEND_URL` - Your backend domain
- [ ] `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- [ ] `CLOUDINARY_API_KEY` - Cloudinary API key
- [ ] `CLOUDINARY_API_SECRET` - Cloudinary API secret
- [ ] `RAZORPAY_KEY_ID` - Razorpay key ID
- [ ] `RAZORPAY_KEY_SECRET` - Razorpay key secret

### ✅ Google OAuth Configuration
- [ ] Update authorized redirect URIs in Google Console
- [ ] Add your production domains to authorized origins
- [ ] Test OAuth flow in production

### ✅ Build and Test
- [ ] Run `npm run build` in frontend directory
- [ ] Check that `dist/index.html` has correct script paths
- [ ] Test locally with `npm run preview`

## Common Issues and Solutions

### MIME Type Error
**Error:** "Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of 'text/html'"

**Solutions:**
1. Check that all environment variables are set
2. Ensure Vercel/Render is serving static files correctly
3. Verify the build output in `dist/` folder
4. Check browser console for specific file loading errors

### CORS Errors
**Error:** "Access to fetch at '...' from origin '...' has been blocked by CORS policy"

**Solutions:**
1. Update `CLIENT_URL` in backend environment variables
2. Update `VITE_API_BASE_URL` in frontend environment variables
3. Ensure backend CORS configuration includes your frontend domain

### Module Loading Errors
**Error:** "Cannot read properties of undefined (reading 'some')"

**Solutions:**
1. Check that all dependencies are properly installed
2. Verify that the build process completed successfully
3. Check for missing environment variables
4. Clear browser cache and try again

## Deployment Steps

### Vercel Deployment
1. Push code to GitHub
2. Connect repository to Vercel
3. Set root directory to `frontend` for frontend
4. Set root directory to `backend` for backend
5. Add all environment variables
6. Deploy

### Render Deployment
1. Connect repository to Render
2. Use the provided `render.yaml` files
3. Add environment variables in dashboard
4. Deploy both services

## Testing After Deployment
- [ ] Test homepage loads without errors
- [ ] Test Google OAuth login
- [ ] Test API calls to backend
- [ ] Test file uploads
- [ ] Test payment flow
- [ ] Check all routes work correctly 