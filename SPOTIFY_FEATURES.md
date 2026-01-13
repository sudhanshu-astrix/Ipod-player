# 🎵 Spotify Integration Features

## ✅ Implemented Features

### 1. Smart Button Text Based on Login Status

**When User is NOT Logged In:**
- Button shows: **"Login & Add to Spotify"**
- Clicking redirects to Spotify OAuth login

**When User IS Logged In:**
- Button shows: **"Add to Spotify Playlist"**
- Clicking adds track directly to your "lollapalooza" playlist

**When Adding Track:**
- Button shows: **"Adding to Playlist..."** with spinner animation

### 2. Automatic Playlist Management

The app automatically manages your "lollapalooza" playlist:

#### First Time Using the App:
1. You log in to Spotify
2. Click "Add to Spotify Playlist" on any track
3. App **automatically creates** a playlist named "lollapalooza" in your Spotify account
4. Track is added to the new playlist
5. You see: ✅ **"[Track Name] added to your lollapalooza playlist!"**

#### Subsequent Uses:
1. App finds your existing "lollapalooza" playlist
2. Checks if the track already exists
3. If new → Adds it and shows success message
4. If already exists → Shows: ℹ️ **"[Track Name] is already in your lollapalooza playlist!"**

### 3. Toast Notifications

Different notifications for different scenarios:

| Scenario | Notification Type | Message |
|----------|------------------|---------|
| ✅ Track added successfully | Success (green) | "[Track Name] added to your lollapalooza playlist!" |
| ℹ️ Track already in playlist | Info (blue) | "[Track Name] is already in your lollapalooza playlist!" |
| ❌ Track not found on Spotify | Error (red) | "Could not find [Track Name] by [Artist] on Spotify" |
| ❌ Authentication expired | Error (red) | "Session expired. Please log in again." |
| ✅ Login successful | Success (green) | "Successfully connected to Spotify!" |
| ❌ Login failed | Error (red) | "Failed to connect to Spotify. Please try again." |

### 4. Playlist Details

**Playlist Name:** `lollapalooza`

**Playlist Properties:**
- **Description:** "Lollapalooza India 2026 - My Favorite Tracks"
- **Visibility:** Public (visible to others)
- **Owner:** Your Spotify account

**Where to Find It:**
- In your Spotify app under "Your Library" → "Playlists"
- Or search for "lollapalooza" in Spotify

### 5. Security Features

✅ **Session Management:**
- Secure HTTP-only cookies
- Sessions last 1 hour
- Automatic re-authentication when needed

✅ **Credentials:**
- Client Secret stored server-side only
- Never exposed to browser
- Secure OAuth2 flow

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ User Flow                                                   │
└─────────────────────────────────────────────────────────────┘

1. Play a track on iPod
   ↓
2. Click "Login & Add to Spotify" (first time)
   ↓
3. Redirect to Spotify → Authorize app
   ↓
4. Redirect back → Session created
   ↓
5. Button now shows "Add to Spotify Playlist"
   ↓
6. Click button → Add track
   ↓
7. Backend:
   - Search for "lollapalooza" playlist
   - Create if doesn't exist
   - Check if track already in playlist
   - Add track or show "already exists"
   ↓
8. Show success/info notification
```

## API Routes

### Authentication
- `GET /api/auth/login` - Start Spotify OAuth
- `GET /api/auth/callback` - OAuth callback handler
- `GET /api/auth/status` - Check if user is logged in
- `POST /api/auth/logout` - Logout user

### Playlist Management
- `POST /api/playlist/add-track` - Add track to "lollapalooza" playlist
  - **Request body:**
    ```json
    {
      "trackName": "Track Title",
      "artistName": "Artist Name",
      "spotifyLink": "https://open.spotify.com/track/..."
    }
    ```
  - **Response (success):**
    ```json
    {
      "success": true,
      "message": "Track added to your lollapalooza playlist!",
      "playlistUrl": "https://open.spotify.com/playlist/...",
      "playlistName": "lollapalooza"
    }
    ```
  - **Response (already exists):**
    ```json
    {
      "success": false,
      "alreadyExists": true,
      "message": "Track is already in your lollapalooza playlist!",
      "playlistUrl": "https://open.spotify.com/playlist/..."
    }
    ```

## Testing

### Manual Testing Steps

1. **Test Login Flow:**
   ```
   1. Go to http://localhost:3000
   2. Play any track
   3. Click "Login & Add to Spotify"
   4. Authorize on Spotify
   5. Should redirect back with success message
   6. Button text should change to "Add to Spotify Playlist"
   ```

2. **Test Adding Track:**
   ```
   1. While logged in, play a track
   2. Click "Add to Spotify Playlist"
   3. Should see "Adding to Playlist..." briefly
   4. Should see success message
   5. Check Spotify app - "lollapalooza" playlist exists
   6. Track should be in the playlist
   ```

3. **Test Duplicate Detection:**
   ```
   1. Add the same track again
   2. Should see "already in playlist" message
   3. No duplicate in Spotify playlist
   ```

4. **Test Logout:**
   ```
   1. Logout (if logout button exists)
   2. Button should change back to "Login & Add to Spotify"
   ```

### API Testing (via curl)

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test login endpoint (should return authUrl)
curl http://localhost:3000/api/auth/login

# Test auth status
curl http://localhost:3000/api/auth/status
```

## Troubleshooting

### Button doesn't change after login
- Refresh the page
- Check browser console for errors
- Verify cookies are enabled

### "Track not found on Spotify"
- Some tracks may not be available on Spotify
- The app searches by track name + artist name
- Try adding a different track

### "Authentication expired"
- Click the button again to re-authenticate
- Sessions expire after 1 hour

### Playlist not appearing in Spotify
- Refresh your Spotify app
- Check "Your Library" → "Playlists"
- Search for "lollapalooza"
- May take a few seconds to sync

## Future Enhancements (Ideas)

- [ ] Show playlist link in success notification
- [ ] Add "View Playlist" button
- [ ] Display track count in playlist
- [ ] Option to make playlist private
- [ ] Custom playlist name
- [ ] Add multiple tracks at once
- [ ] Undo "add to playlist" feature
- [ ] Show which tracks are already in playlist
- [ ] Sync playlist with iPod favorites

---

🎉 **Everything is working!** You can now add tracks to your "lollapalooza" Spotify playlist directly from the iPod interface!

