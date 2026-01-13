# 🚀 Next.js with Serverless API Routes - Setup Guide

Your app has been converted to **Next.js with built-in serverless API routes**! No more running a separate backend server. Everything runs in one place. 🎉

## What Changed?

✅ **Backend integrated into Next.js API routes** (serverless functions)  
✅ **No separate Express server needed**  
✅ **Authentication via HTTP-only cookies** (more secure)  
✅ **Single command to run everything**: `npm run dev`  
✅ **Deploy anywhere**: Vercel, Netlify, AWS, etc.

## Quick Start

### Step 1: Install Dependencies

```bash
cd /Users/sudhanshu/Downloads/iPod\ -\ Card\ Decks/react-app
npm install
```

This will install Next.js and required dependencies.

### Step 2: Configure Environment Variables

You already have a `.env` file with `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` and `NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET`.

**⚠️ IMPORTANT:** Rename it to `.env.local` and update the variable names:

```bash
# Rename your .env to .env.local
mv .env .env.local
```

**Edit `.env.local`** to use the correct format:

```env
# Remove NEXT_PUBLIC_ prefix for server-side secrets
SPOTIFY_CLIENT_ID=fd936fc08a5b452885853c6cb6e35da9
SPOTIFY_CLIENT_SECRET=your_client_secret_here

# Public variables (accessible on client)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Redirect URI for Spotify (automatically set to NEXT_PUBLIC_BASE_URL + /api/auth/callback)
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

**⚠️ Security Note:** 
- `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` (without `NEXT_PUBLIC_`) are **server-only** and never exposed to the browser
- `NEXT_PUBLIC_BASE_URL` is public and accessible on the client

### Step 3: Update Spotify Dashboard

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Click **"Edit Settings"**
4. Update **Redirect URIs** to:
   ```
   http://localhost:3000/api/auth/callback
   ```
5. Click **"Save"**

### Step 4: Run the App

```bash
npm run dev
```

That's it! One command runs everything. 🎉

Open: **http://localhost:3000**

## API Routes (Serverless Functions)

Your backend is now served as serverless API routes:

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/login` | GET | Start Spotify OAuth flow |
| `/api/auth/callback` | GET | Spotify OAuth callback |
| `/api/auth/status` | GET | Check if user is authenticated |
| `/api/auth/logout` | POST | Logout user |
| `/api/playlist/add-track` | POST | Add track to "lollapalooza" playlist |
| `/api/health` | GET | Health check |

## How It Works

1. **User clicks "Login & Add to Spotify"**
   - → Calls `/api/auth/login`
   - → Redirects to Spotify
   
2. **After authorization**
   - → Spotify redirects to `/api/auth/callback`
   - → Sets secure HTTP-only cookies
   - → Redirects back to app with success message

3. **User clicks "Add to Lollapalooza"**
   - → Calls `/api/playlist/add-track` with track info
   - → Uses cookie for authentication
   - → Creates playlist if doesn't exist
   - → Adds track or shows "already added" message

## Deployment

### Vercel (Recommended - Zero Config)

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `NEXT_PUBLIC_BASE_URL` (your deployed URL)
- `SPOTIFY_REDIRECT_URI` (your-domain.com/api/auth/callback)

### Netlify

```bash
npm run build
netlify deploy --prod --dir=.next
```

Add environment variables in Netlify dashboard.

### Other Platforms

Next.js works on AWS Lambda, Google Cloud Functions, Azure Functions, etc.

## Development vs Production

### Development
```bash
npm run dev
# Runs on http://localhost:3000
```

### Production
```bash
npm run build
npm start
# Optimized production build
```

## Troubleshooting

### "Module not found: Can't resolve 'cookie'"
```bash
npm install cookie querystring
```

### "Invalid redirect URI"
- Make sure Spotify Dashboard Redirect URI matches **exactly**
- For local: `http://localhost:3000/api/auth/callback`
- For production: `https://your-domain.com/api/auth/callback`

### "Not authenticated" errors
- Cookies might be blocked (especially in Safari/Firefox)
- Make sure you're on the same domain as the API routes
- Check browser console for cookie errors

### Want to use the old Create React App version?
```bash
npm run start:cra  # Run old version
npm run build:cra  # Build old version
```

## File Structure

```
react-app/
├── pages/
│   ├── _app.js              # Next.js app wrapper
│   ├── index.js             # Home page (renders src/App.js)
│   └── api/                 # Serverless API routes
│       ├── auth/
│       │   ├── login.js     # Start OAuth
│       │   ├── callback.js  # OAuth callback
│       │   ├── status.js    # Check auth status
│       │   └── logout.js    # Logout
│       ├── playlist/
│       │   └── add-track.js # Add track to playlist
│       └── health.js        # Health check
├── src/
│   ├── App.js               # Main React app
│   ├── components/          # React components
│   ├── utils/
│   │   └── spotifyAuth.js   # Updated for Next.js API routes
│   └── ...
├── next.config.js           # Next.js configuration
├── .env.local               # Environment variables (gitignored)
└── package.json             # Updated for Next.js
```

## Benefits of This Approach

✅ **No separate backend server** - Everything in one app  
✅ **Serverless** - Scales automatically  
✅ **Secure** - Secrets never exposed to client  
✅ **Easy deployment** - One-click deploys to Vercel/Netlify  
✅ **Cost effective** - Pay only for what you use  
✅ **Better DX** - Single dev command, no CORS issues  

## Need Help?

- Next.js Docs: https://nextjs.org/docs
- Vercel Deployment: https://vercel.com/docs
- Spotify Web API: https://developer.spotify.com/documentation/web-api

---

**Previous Setup (Express server):** Still available in the root directory if needed, but no longer necessary with Next.js API routes! 🎉

