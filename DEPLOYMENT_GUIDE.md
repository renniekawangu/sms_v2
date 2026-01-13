# Deployment Guide

## 🚀 Quick Deploy

### Backend (Railway)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy Backend**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `sms_v2` repository
   - Railway will auto-detect Node.js
   - Set root directory to `/backend`

3. **Configure Environment Variables**
   Add these in Railway dashboard → Variables:
   ```
   NODE_ENV=production
   MONGODB_URI=<your-mongodb-atlas-uri>
   JWT_SECRET=<generate-random-secret>
   JWT_EXPIRE=7d
   SESSION_SECRET=<generate-random-secret>
   FRONTEND_URL=https://your-app.vercel.app
   PORT=5000
   ```

4. **Setup MongoDB Atlas** (if not already done)
   - Go to https://mongodb.com/cloud/atlas
   - Create free cluster
   - Get connection string
   - Add Railway IPs to whitelist (or use 0.0.0.0/0 for all IPs)

5. **Get Backend URL**
   - After deployment, copy the Railway URL (e.g., `https://your-app.up.railway.app`)

---

### Frontend (Vercel)

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Deploy Frontend**
   - Click "Add New" → "Project"
   - Import your `sms_v2` repository
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Configure Environment Variables**
   Add in Vercel dashboard → Settings → Environment Variables:
   ```
   VITE_API_URL=https://your-backend.up.railway.app/api
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-app.vercel.app`

---

## 🔄 Update Backend CORS

After deploying frontend, update Railway environment variable:
```
FRONTEND_URL=https://your-app.vercel.app
```

---

## 🔧 Local Development Setup

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your values
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
# Edit .env with your values
npm install
npm run dev
```

---

## 📝 Generate Secrets

Use these commands to generate secure secrets:

```bash
# For JWT_SECRET and SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔗 Important URLs

- **Backend Health Check**: `https://your-backend.up.railway.app/health`
- **Frontend**: `https://your-app.vercel.app`
- **MongoDB Atlas**: https://cloud.mongodb.com

---

## ⚠️ Troubleshooting

### Backend Issues
- Check Railway logs: Dashboard → Deployments → View Logs
- Verify MongoDB connection string
- Ensure all environment variables are set

### Frontend Issues
- Check Vercel logs: Dashboard → Deployments → View Function Logs
- Verify VITE_API_URL points to Railway backend
- Check browser console for CORS errors

### CORS Errors
- Ensure FRONTEND_URL in Railway matches your Vercel URL exactly
- Redeploy backend after updating FRONTEND_URL

---

## 💡 Pro Tips

1. **Free Tiers**:
   - Railway: $5 free credit/month
   - Vercel: Unlimited personal projects
   - MongoDB Atlas: 512MB free cluster

2. **Custom Domains**:
   - Add custom domain in Vercel → Settings → Domains
   - Update FRONTEND_URL in Railway after adding domain

3. **Automatic Deployments**:
   - Both platforms auto-deploy on git push to main branch
   - Disable if needed in platform settings

4. **Environment Variables**:
   - Railway: Can add via CLI or dashboard
   - Vercel: Can add via CLI or dashboard
   - Never commit .env files to git

---

## 🎉 Success Checklist

- [ ] Backend deployed on Railway
- [ ] MongoDB Atlas cluster created and connected
- [ ] Frontend deployed on Vercel
- [ ] Environment variables configured on both platforms
- [ ] CORS configured correctly
- [ ] Health check endpoint working
- [ ] Can login to application
- [ ] All features working as expected
