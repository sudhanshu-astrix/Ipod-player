# 🔄 Migration from Express Server to Next.js API Routes

## What You Need to Do

### 1. Update Your `.env` File

**Old location:** `/Users/sudhanshu/Downloads/iPod - Card Decks/react-app/.env`

**Action Required:**

1. Rename `.env` to `.env.local`:
   ```bash
   cd /Users/sudhanshu/Downloads/iPod\ -\ Card\ Decks/react-app
   mv .env .env.local
   ```

2. Update the contents to remove `NEXT_PUBLIC_` prefix from secrets:

**OLD (.env):**
```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=fd936fc08a5b452885853c6cb6e35da9
NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET=your_secret_here
```

**NEW (.env.local):**
```env
# Server-only secrets (NOT exposed to browser)
SPOTIFY_CLIENT_ID=fd936fc08a5b452885853c6cb6e35da9
SPOTIFY_CLIENT_SECRET=your_secret_here

# Public variables
NEXT_PUBLIC_BASE_URL=http://localhost:3000
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

**Why?** Variables with `NEXT_PUBLIC_` are exposed to the browser. Secrets should NOT have this prefix.

### 2. Update Spotify Dashboard

**Old Redirect URI:**
```
http://localhost:5000/api/auth/callback
```

**New Redirect URI:**
```
http://localhost:3000/api/auth/callback
```

**Steps:**
1. Go to https://developer.spotify.com/dashboard
2. Click on your app
3. Click "Edit Settings"
4. Update Redirect URIs to: `http://localhost:3000/api/auth/callback`
5. Save

### 3. Install New Dependencies

```bash
cd /Users/sudhanshu/Downloads/iPod\ -\ Card\ Decks/react-app
npm install
```

This installs Next.js and required packages.

### 4. Stop the Old Backend Server

If you have the Express server running on port 5000, you can stop it:
- Press `Ctrl+C` in that terminal
- You don't need it anymore!

### 5. Run Next.js

```bash
npm run dev
```

Open http://localhost:3000

## What Changed?

### Before (Express + React)

**2 Separate Processes:**
```bash
# Terminal 1 - Backend
npm run server  # Runs on port 5000

# Terminal 2 - Frontend  
npm start       # Runs on port 3000
```

**Architecture:**
```
React App (port 3000) → Express Server (port 5000) → Spotify API
                 ↓
            CORS issues
            Need proxy
            2 servers to manage
```

### After (Next.js)

**1 Single Process:**
```bash
npm run dev     # Everything on port 3000
```

**Architecture:**
```
Next.js App (port 3000)
├── Frontend (React components)
└── API Routes (serverless functions) → Spotify API
                 ↓
            No CORS
            No proxy needed
            1 server
```

## Key Differences

| Feature | Before (Express) | After (Next.js) |
|---------|------------------|-----------------|
| **Commands to run** | 2 (backend + frontend) | 1 (dev) |
| **Ports** | 5000 + 3000 | 3000 only |
| **Session management** | express-session (memory) | HTTP-only cookies |
| **CORS** | Required configuration | Not needed (same origin) |
| **Deployment** | Need 2 services | 1 deployment |
| **Serverless** | No | Yes |
| **Auto-scaling** | Manual | Automatic |

## Code Changes

### API Endpoints - No Change Needed!

Your frontend code doesn't need major changes. The API routes work the same:

```javascript
// Still works the same!
spotifyAuthService.login()
spotifyAuthService.addTrackToPlaylist(...)
```

The only change is the base URL (now same as frontend).

### API Route Files (New)

API routes are now in `pages/api/`:

```
pages/api/
├── auth/
│   ├── login.js      # Replaces Express route: GET /api/auth/login
│   ├── callback.js   # Replaces Express route: GET /api/auth/callback
│   ├── status.js     # Replaces Express route: GET /api/auth/status
│   └── logout.js     # Replaces Express route: POST /api/auth/logout
└── playlist/
    └── add-track.js  # Replaces Express route: POST /api/playlist/add-track
```

## Testing the Migration

1. **Check health endpoint:**
   ```bash
   curl http://localhost:3000/api/health
   # Should return: {"status":"ok"}
   ```

2. **Test authentication:**
   - Go to http://localhost:3000
   - Play a track
   - Click "Login & Add to Spotify"
   - Should redirect to Spotify

3. **Add a track:**
   - After login, click "Add to Lollapalooza"
   - Should add track to playlist

## Rollback (If Needed)

If you need to go back to the old setup:

```bash
# Use the old create-react-app version
npm run start:cra

# In another terminal, run the Express server
cd ..
npm run server
```

## Benefits of Next.js API Routes

✅ **Simpler setup** - One command, one server  
✅ **Better security** - HTTP-only cookies, no exposed secrets  
✅ **Easier deployment** - Deploy to Vercel with one click  
✅ **Serverless** - Automatic scaling, pay per use  
✅ **No CORS issues** - Same origin for frontend and backend  
✅ **Better DX** - Hot reload for both frontend and API routes  

## Production Deployment

### Vercel (Easiest)

```bash
npm install -g vercel
vercel
```

Environment variables to set in Vercel:
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `NEXT_PUBLIC_BASE_URL` → your-app.vercel.app
- `SPOTIFY_REDIRECT_URI` → https://your-app.vercel.app/api/auth/callback

Then update Spotify Dashboard with your production URL!

## Questions?

- **Q: Do I need to keep the Express server?**
  - A: No! You can delete `server.js` from the root if you want.

- **Q: Will my data/playlists be affected?**
  - A: No, this only changes how the backend works. Your Spotify data is unchanged.

- **Q: Can I deploy to other platforms?**
  - A: Yes! Next.js works on Netlify, AWS, Azure, Google Cloud, etc.

- **Q: What about the old backend dependencies?**
  - A: They're only needed for the old Express server. Safe to keep or remove.

---

🎉 **You're now running on Next.js with serverless API routes!**

