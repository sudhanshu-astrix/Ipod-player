# 🔍 Debugging Spotify Auth Error

## Error Location
**File:** `pages/api/auth/callback.js`  
**Line:** `const userData = await userResponse.json();`

## Issue
The error occurs when trying to parse the Spotify user profile response. This typically happens when:
1. The access token is invalid
2. The Spotify API returns an error response
3. The redirect URI doesn't match what's registered in Spotify Dashboard

## What I Fixed

### 1. Added Response Status Check
```javascript
// Before (would crash on non-200 responses)
const userData = await userResponse.json();

// After (checks if response is OK first)
if (!userResponse.ok) {
    const errorData = await userResponse.text();
    console.error('Failed to fetch user profile:', userResponse.status, errorData);
    return res.redirect(`${FRONTEND_URL}?error=auth_failed`);
}
const userData = await userResponse.json();
```

### 2. Enhanced Logging
Added detailed console logs to track the auth flow:
- `baseUrl` - What URL we're using
- `SPOTIFY_REDIRECT_URI` - The redirect URI sent to Spotify
- `code` - The authorization code from Spotify
- Token exchange success/failure details
- User profile fetch success

## How to Debug

### Step 1: Check Terminal Logs
When you try to authenticate, look for these logs in your terminal:

```
baseUrl https://8404fc130451.ngrok-free.app
SPOTIFY_REDIRECT_URI https://8404fc130451.ngrok-free.app/api/auth/callback
code <some_code_here>
```

### Step 2: Check for Token Exchange Errors
If you see:
```
Token exchange failed: { status: 400, error: {...} }
```

This means the redirect URI doesn't match. Check:
1. Your `.env.local` file has the correct ngrok URL
2. Spotify Dashboard has the exact same redirect URI

### Step 3: Check for User Profile Errors
If you see:
```
Failed to fetch user profile: 401 ...
```

This means the access token is invalid or expired.

## Common Issues & Solutions

### Issue 1: Redirect URI Mismatch
**Error:** `Token exchange failed: redirect_uri_mismatch`

**Solution:**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Click "Edit Settings"
4. Make sure Redirect URIs includes:
   ```
   https://8404fc130451.ngrok-free.app/api/auth/callback
   ```
5. Click "Save"
6. Try authenticating again

### Issue 2: Ngrok URL Changed
**Error:** Redirect to localhost instead of ngrok

**Solution:**
Ngrok URLs change unless you have a paid plan. Update:

1. **Get new ngrok URL:**
   ```bash
   ngrok http 3000
   ```

2. **Update `.env.local`:**
   ```env
   NEXT_PUBLIC_BASE_URL=https://NEW_NGROK_URL.ngrok-free.app
   SPOTIFY_REDIRECT_URI=https://NEW_NGROK_URL.ngrok-free.app/api/auth/callback
   ```

3. **Update Spotify Dashboard:**
   - Add new redirect URI
   - Remove old one (optional)

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

### Issue 3: Invalid Client Credentials
**Error:** `Token exchange failed: invalid_client`

**Solution:**
Check your `.env.local` has correct values:
```env
SPOTIFY_CLIENT_ID=236d72f1c482476aa41ea0dbaf95262a
SPOTIFY_CLIENT_SECRET=fd936fc08a5b452885853c6cb6e35da9
```

Verify these match your Spotify Dashboard credentials.

### Issue 4: CORS or ngrok Issues
**Error:** Connection errors or CORS errors

**Solution:**
1. Make sure ngrok is running:
   ```bash
   ngrok http 3000
   ```

2. Make sure Next.js dev server is running:
   ```bash
   npm run dev
   ```

3. Access your app via the ngrok URL, not localhost

## Testing Checklist

- [ ] Ngrok is running and URL is active
- [ ] `.env.local` has correct ngrok URL
- [ ] Spotify Dashboard has matching redirect URI
- [ ] Both servers are running (ngrok + Next.js)
- [ ] Accessing app via ngrok URL (not localhost)
- [ ] Browser console shows no CORS errors
- [ ] Terminal shows the correct baseUrl in logs

## Check Spotify Dashboard

1. Go to: https://developer.spotify.com/dashboard
2. Click your app
3. Check "Redirect URIs" section
4. Must include EXACTLY:
   ```
   https://8404fc130451.ngrok-free.app/api/auth/callback
   ```
   (or your current ngrok URL)

## Expected Terminal Output

When auth works correctly, you should see:
```
baseUrl https://8404fc130451.ngrok-free.app
SPOTIFY_REDIRECT_URI https://8404fc130451.ngrok-free.app/api/auth/callback
code AbCdEf123456...
Token exchange successful, access_token received
User profile fetched successfully: {
  id: 'your_spotify_id',
  name: 'Your Name',
  email: 'your@email.com'
}
```

## Quick Test

Run this in your browser console when on the ngrok URL:
```javascript
fetch('/api/health')
  .then(r => r.json())
  .then(console.log)
// Should return: { status: 'ok' }
```

If this fails, your Next.js server isn't accessible via ngrok.

---

💡 **Tip:** The error is now handled gracefully. Check your terminal logs after trying to authenticate to see the exact error from Spotify.

