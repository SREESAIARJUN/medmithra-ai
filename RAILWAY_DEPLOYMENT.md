# Railway Deployment Guide - Clinical Insight Assistant

## Overview
This guide will help you deploy your Clinical Insight Assistant application to Railway. The app consists of:
- **Frontend**: React application with modern UI/UX
- **Backend**: FastAPI server with Gemini AI integration
- **Database**: MongoDB (will use MongoDB Atlas)

## Prerequisites
1. Railway account (sign up at railway.app)
2. GitHub account (to connect your repository)
3. MongoDB Atlas account (for the database)
4. Gemini API key (you already have this)

## Deployment Steps

### Step 1: Set up MongoDB Atlas
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster
3. Create a database user
4. Whitelist Railway IP addresses (or use 0.0.0.0/0 for all IPs)
5. Get your connection string (it will look like: `mongodb+srv://username:password@cluster.mongodb.net/database`)

### Step 2: Deploy to Railway

#### Option A: Deploy as Separate Services (Recommended)

1. **Deploy Backend First:**
   ```bash
   cd backend
   railway login
   railway init
   railway up
   ```

2. **Set Backend Environment Variables:**
   ```bash
   railway variables set MONGO_URL="your_mongodb_atlas_connection_string"
   railway variables set DB_NAME="clinical_assistant"
   railway variables set GEMINI_API_KEY="your_gemini_api_key"
   railway variables set PORT="8000"
   ```

3. **Deploy Frontend:**
   ```bash
   cd ../frontend
   railway init
   railway up
   ```

4. **Set Frontend Environment Variables:**
   ```bash
   railway variables set REACT_APP_BACKEND_URL="https://your-backend-service.railway.app"
   railway variables set NODE_ENV="production"
   ```

#### Option B: Deploy from Root Directory

1. **Initialize Railway:**
   ```bash
   railway login
   railway init
   ```

2. **Set Environment Variables:**
   ```bash
   # Backend variables
   railway variables set MONGO_URL="your_mongodb_atlas_connection_string"
   railway variables set DB_NAME="clinical_assistant"
   railway variables set GEMINI_API_KEY="your_gemini_api_key"
   
   # Frontend variables
   railway variables set REACT_APP_BACKEND_URL="https://your-backend-service.railway.app"
   railway variables set NODE_ENV="production"
   ```

3. **Deploy:**
   ```bash
   railway up
   ```

### Step 3: Configure Custom Domains (Optional)
1. In Railway dashboard, go to your service
2. Click on "Settings" → "Domains"
3. Add your custom domain

### Step 4: Environment Variables Checklist

**Backend Service:**
- `MONGO_URL`: Your MongoDB Atlas connection string
- `DB_NAME`: Your database name (e.g., "clinical_assistant")
- `GEMINI_API_KEY`: Your Gemini API key
- `PORT`: 8000 (Railway will set this automatically)

**Frontend Service:**
- `REACT_APP_BACKEND_URL`: Your backend Railway URL
- `NODE_ENV`: production

### Step 5: Test Your Deployment
1. Visit your frontend Railway URL
2. Try logging in/registering
3. Create a test case
4. Upload files and test analysis
5. Verify all features work correctly

## Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Make sure CORS is configured correctly in the backend
   - Verify the frontend URL is allowed in CORS settings

2. **Database Connection Issues:**
   - Check MongoDB Atlas connection string
   - Verify IP whitelist includes Railway IPs
   - Ensure database user has proper permissions

3. **Build Failures:**
   - Check that all dependencies are in requirements.txt
   - Verify Node.js version compatibility

4. **File Upload Issues:**
   - Railway has ephemeral filesystem
   - Consider using cloud storage (AWS S3, Cloudinary) for persistent file storage

### Railway CLI Commands:
```bash
# View logs
railway logs

# Check service status
railway status

# Connect to database
railway connect

# Restart service
railway up --detach
```

## Production Considerations

1. **File Storage**: Consider migrating to cloud storage (S3, Cloudinary) as Railway has ephemeral storage
2. **Environment Security**: Use Railway's secret management for sensitive variables
3. **Monitoring**: Set up Railway's monitoring and alerts
4. **Scaling**: Configure auto-scaling based on your needs
5. **Custom Domain**: Set up a custom domain for professional use

## Configuration Files Created:
- `railway.toml`: Main Railway configuration
- `backend/railway.toml`: Backend-specific configuration
- `frontend/railway.toml`: Frontend-specific configuration
- `Procfile`: Process definition for Railway
- `runtime.txt`: Python runtime specification

Your application is now ready for Railway deployment! 🚀