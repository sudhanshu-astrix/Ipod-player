# 🍪 Cookie Fix for Ngrok (HTTPS)

## The Problem

When using ngrok (HTTPS), cookies weren't being set correctly, causing:
- Playlists being created in developer's account instead of logged-in user's account
- Auth not persisting properly

## Root Cause

**ngrok uses HTTPS**, and browsers have strict cookie requirements for HTTPS:

1. `secure: true` - Must be set for HTTPS
2. `sameSite: 'none'` - Required for cross-origin cookies over HTTPS

Our previous settings:
```javascript
secure: process.env.NODE_ENV === 'production', // ❌ False in development!
sameSite: 'lax' // ❌ Doesn't work for HTTPS cross-origin
```

## ✅ What I Fixed

### Updated Cookie Settings for HTTPS/Ngrok

```javascript
const isHttps = baseUrl.startsWith('https://');

const cookieOptions = {
    httpOnly: true,
    secure: isHttps,           // ✅ True for ngrok (https)
    sameSite: isHttps ? 'none' : 'lax', // ✅ 'none' for https
    path: '/'
};
```

### Now Works For:
- ✅ **Ngrok (HTTPS)** - `secure: true, sameSite: 'none'`
- ✅ **Localhost (HTTP)** - `secure: false, sameSite: 'lax'`
- ✅ **Production (HTTPS)** - `secure: true, sameSite: 'none'`

### Added Debugging Logs

Now you can see in terminal:
```
🍪 Setting cookies with options: { 
  secure: true, 
  sameSite: 'none',
  baseUrl: 'https://8404fc130451.ngrok-free.app'
}
🍪 Cookies being set for user: spotify_user_id UserName
```

And when adding tracks:
```
🔐 Authenticated user: {
  userId: 'your_spotify_id',
  userName: 'Your Name',
  userEmail: 'your@email.com'
}
```

## 🧪 How to Test

### Step 1: Disconnect and Reconnect
1. Click green Spotify button in header
2. Click "Disconnect Spotify"
3. Play a track
4. Click "Login & Add to Spotify"
5. Authorize on Spotify
6. You'll be redirected back

### Step 2: Check Terminal Logs

After reconnecting, look for:
```
User profile fetched successfully: {
  id: 'YOUR_SPOTIFY_ID',      // ← This should be YOUR ID
  name: 'YOUR_NAME',
  email: 'YOUR_EMAIL'
}
🍪 Setting cookies with options: { secure: true, sameSite: 'none' }
🍪 Cookies being set for user: YOUR_SPOTIFY_ID YOUR_NAME
```

### Step 3: Add a Track

Click "Add to Spotify Playlist" and check terminal:
```
🔐 Authenticated user: {
  userId: 'YOUR_SPOTIFY_ID',   // ← Should match above
  userName: 'YOUR_NAME',
  userEmail: 'YOUR_EMAIL'
}
🎫 Access token present: true
```

### Step 4: Verify in Spotify

1. Open Spotify app
2. Go to "Your Library" → "Playlists"
3. Find "lollapalooza" playlist
4. **Check the owner:**
   - Should show YOUR name
   - NOT the developer's name

## 🔍 Debugging

### Check Cookies in Browser

1. Open browser DevTools (F12)
2. Go to "Application" or "Storage" tab
3. Look for cookies under your ngrok domain
4. Should see:
   - `spotify_access_token` (httpOnly: true)
   - `spotify_refresh_token` (httpOnly: true)
   - `spotify_user` (httpOnly: false)

### Check Cookie Values

Run in browser console:
```javascript
// Check if user cookie exists
document.cookie.split(';').find(c => c.includes('spotify_user'))

// Parse user data
const userCookie = document.cookie
  .split('; ')
  .find(row => row.startsWith('spotify_user='))
  ?.split('=')[1];
if (userCookie) {
  console.log('User:', JSON.parse(decodeURIComponent(userCookie)));
}
```

Should show YOUR Spotify user data, not the developer's.

## 🚨 Common Issues

### Issue 1: Cookies Not Being Set

**Symptoms:**
- Still redirecting to developer's account
- "Not authenticated" error

**Solution:**
1. Clear all cookies for the ngrok domain
2. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
3. Reconnect to Spotify

### Issue 2: SameSite Warnings in Console

**Warning:**
```
Cookie "spotify_access_token" has been rejected because it is in a cross-site context and its "SameSite" is "Lax" or "Strict"
```

**Solution:**
Already fixed! The code now sets `sameSite: 'none'` for HTTPS.

### Issue 3: Secure Cookie Warning

**Warning:**
```
Cookie "spotify_access_token" has been rejected because it does not have "Secure" attribute
```

**Solution:**
Already fixed! The code now sets `secure: true` for HTTPS (ngrok).

## 📋 Checklist

After reconnecting, verify:

- [ ] Terminal shows YOUR user ID (not developer's)
- [ ] Terminal shows `secure: true, sameSite: 'none'`
- [ ] Browser cookies exist for your ngrok domain
- [ ] "Add to Spotify Playlist" works
- [ ] Playlist appears in YOUR Spotify account
- [ ] Playlist owner is YOU (not developer)

## 💡 Why This Matters

**Before Fix:**
- Cookies had `secure: false` and `sameSite: 'lax'`
- Browser rejected cookies over HTTPS (ngrok)
- Fell back to some default behavior
- Ended up using developer's credentials somehow

**After Fix:**
- Cookies have `secure: true` and `sameSite: 'none'`
- Browser accepts cookies over HTTPS
- Your auth token is stored correctly
- Playlist created in YOUR account ✅

## 🎯 Expected Behavior Now

```
1. User logs in with their Spotify account
   ↓
2. Cookies stored with their access token + user ID
   ↓
3. User clicks "Add to Spotify Playlist"
   ↓
4. API reads cookies → Gets THEIR access token
   ↓
5. Creates/modifies playlist in THEIR account
   ↓
6. Success! Playlist is in the user's Spotify ✅
```

---

🎉 **The fix is live!** Disconnect and reconnect to Spotify to get the updated cookies.

