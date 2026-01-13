// pages/api/auth/status.js
import { parse } from 'cookie';

export default function handler(req, res) {
    const cookies = parse(req.headers.cookie || '');
    
    const accessToken = cookies.spotify_access_token;
    const userCookie = cookies.spotify_user;
    
    if (accessToken && userCookie) {
        try {
            const user = JSON.parse(userCookie);
            return res.json({ 
                authenticated: true,
                user: user
            });
        } catch (error) {
            console.error('Failed to parse user cookie:', error);
        }
    }
    
    res.json({ authenticated: false });
}

