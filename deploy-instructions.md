# Autostock Backend Deployment Instructions

## Quick Deploy to Render (Recommended)

### Step 1: Deploy to Render
1. Go to [render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click "New +" → "Blueprint"
4. Connect repository: `Nishantsura/autostock-backend`
5. Render will automatically:
   - Create PostgreSQL database
   - Deploy your Node.js app
   - Set up environment variables

### Step 2: Get Database URL
After deployment, Render will provide a DATABASE_URL in your service environment variables.

### Step 3: Your Backend Will Be Live At:
`https://autostock-backend-xxxx.onrender.com`

## Environment Variables (Render Dashboard)
- NODE_ENV: production
- JWT_SECRET: (generate a 32+ character secret)
- CORS_ORIGINS: https://autostock-frontend-aiqqdaxlt-suras-projects-1078d583.vercel.app

## Alternative: Free Supabase Database + Vercel
If you prefer using Vercel for both frontend and backend:

1. Go to [supabase.com](https://supabase.com)
2. Create free project
3. Get connection string from Settings → Database
4. Deploy backend to Vercel with DATABASE_URL environment variable
