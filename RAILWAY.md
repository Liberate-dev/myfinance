# Railway Deployment Guide

## Quick Deploy

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/username/finance-advisor.git
   git push -u origin main
   ```

2. **Connect to Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up / Login with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repo

3. **Configure Service**
   - Railway auto-detects Node.js
   - Build Command: `npm install --legacy-peer-deps && npm run build`
   - Start Command: `npx tsx server/index.ts`

4. **Set Environment Variables** (in Railway dashboard)
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_PATH=./data/app.db
   CORS_ORIGIN=https://your-frontend.vercel.app
   JWT_SECRET=<generate-secure-random-string>
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

5. **Add Persistent Disk** (for SQLite data)
   - In Railway: Project → Service → Storage → Add Persistent Disk
   - Mount at: `/data` (or custom path)
   - Update `DATABASE_PATH` to match mount point

## Frontend Deployment (Vercel)

1. Connect frontend repo to Vercel
2. Set environment variable:
   ```
   VITE_API_URL=https://your-railway-app.up.railway.app
   ```
3. Update API base URL in frontend code

## Troubleshooting

**SQLite not working?**
- Ensure persistent disk is mounted
- Check `DATABASE_PATH` matches mount point

**CORS errors?**
- Verify `CORS_ORIGIN` matches exact frontend URL (no trailing slash)

**Build fails?**
- Check Railway logs for missing dependencies
- Ensure `npm install --legacy-peer-deps` succeeds locally first
- If peer deps conflict, use `--legacy-peer-deps` flag
