// pages/api/auth/login.js
import querystring from 'querystring';

export default function handler(req, res) {
    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    
    // Get base URL from environment or request headers
    const protocol = req.headers['x-forwarded-proto'] || (req.connection.encrypted ? 'https' : 'http');
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://8404fc130451.ngrok-free.app";
    console.log('baseUrl', baseUrl);
    
    const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || `${baseUrl}/api/auth/callback`;
    
    if (!SPOTIFY_CLIENT_ID) {
        return res.status(500).json({ error: 'Spotify credentials not configured' });
    }

    const scope = 'playlist-modify-public playlist-modify-private playlist-read-private';
    const authUrl = 'https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: SPOTIFY_CLIENT_ID,
            scope: scope,
            redirect_uri: SPOTIFY_REDIRECT_URI,
            state: Math.random().toString(36).substring(7)
        });
    res.json({ authUrl });
}

