# ⚡ Quick Start - Next.js Version

## Your .env File Setup (IMPORTANT!)

You already have a `.env` file. Here's what you need to do:

### Step 1: Rename and Update .env

```bash
cd /Users/sudhanshu/Downloads/iPod\ -\ Card\ Decks/react-app

# Rename .env to .env.local
mv .env .env.local
```

### Step 2: Edit .env.local

Open `.env.local` and change it to:

```env
# Server-only secrets (remove NEXT_PUBLIC_ prefix!)
SPOTIFY_CLIENT_ID=fd936fc08a5b452885853c6cb6e35da9
SPOTIFY_CLIENT_SECRET=your_secret_value_here

# Public config
NEXT_PUBLIC_BASE_URL=http://localhost:3000
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

**⚠️ CRITICAL:** Remove `NEXT_PUBLIC_` from your client secret! Variables with `NEXT_PUBLIC_` are exposed to the browser (bad for secrets).

### Step 3: Update Spotify Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click your app
3. Edit Settings
4. Change Redirect URI from:
   - ❌ `http://localhost:5000/api/auth/callback`  
   - ✅ `http://localhost:3000/api/auth/callback`
5. Save

### Step 4: Run the App

```bash
npm run dev
```

Open: **http://localhost:3000**

## That's It! 🎉

- ✅ No separate backend server needed
- ✅ Everything runs on one port (3000)
- ✅ API routes are built-in (serverless)
- ✅ More secure (cookies, no exposed secrets)

## Commands

```bash
npm run dev      # Development mode
npm run build    # Build for production
npm start        # Run production build
```

## Troubleshooting

**"Cannot find module 'next'"**
```bash
npm install
```

**"Invalid redirect URI"**
- Check Spotify Dashboard has: `http://localhost:3000/api/auth/callback`

**Login not working?**
1. Make sure `.env.local` exists (not `.env`)
2. Check variable names don't have `NEXT_PUBLIC_` prefix for secrets
3. Restart the dev server: `Ctrl+C` then `npm run dev`

---

📖 For detailed docs: [NEXTJS_SETUP.md](./NEXTJS_SETUP.md)  
🔄 For migration guide: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

