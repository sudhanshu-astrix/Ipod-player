// pages/api/auth/callback.js
import querystring from 'querystring';
import { serialize } from 'cookie';

const getSpotifyToken = () => {
    return Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
};

export default async function handler(req, res) {
    const { code } = req.query;
    
    // Get base URL from environment or request headers
    const protocol = req.headers['x-forwarded-proto'] || (req.connection.encrypted ? 'https' : 'http');
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://8404fc130451.ngrok-free.app`;
    
    const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || `${baseUrl}/api/auth/callback`;
    const FRONTEND_URL = baseUrl;
    console.log('baseUrl', baseUrl);
    console.log('SPOTIFY_REDIRECT_URI', SPOTIFY_REDIRECT_URI);
    console.log('FRONTEND_URL', FRONTEND_URL);
    console.log('code', code);
    
    if (!code) {
        return res.redirect(`${FRONTEND_URL}?error=auth_failed`);
    }

    try {
        // Exchange code for access token
        const tokenResponse = await fetch(
            'https://accounts.spotify.com/api/token',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${getSpotifyToken()}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: querystring.stringify({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: SPOTIFY_REDIRECT_URI
                })
            }
        );

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('Token exchange failed:', {
                status: tokenResponse.status,
                statusText: tokenResponse.statusText,
                error: tokenData
            });
            return res.redirect(`${FRONTEND_URL}?error=auth_failed`);
        }

        console.log('Token exchange successful, access_token received');

        // Get user profile
        const userResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
            }
        });

        if (!userResponse.ok) {
            const errorData = await userResponse.text();
            console.error('Failed to fetch user profile:', userResponse.status, errorData);
            return res.redirect(`${FRONTEND_URL}?error=auth_failed`);
        }

        const userData = await userResponse.json();
        console.log('User profile fetched successfully:', {
            id: userData.id,
            name: userData.display_name,
            email: userData.email
        });

        // Set secure HTTP-only cookies
        // For ngrok/https, we need secure: true and sameSite: 'none' or 'lax'
        const isHttps = baseUrl.startsWith('https://');
        const cookieOptions = {
            httpOnly: true,
            secure: isHttps, // Must be true for https (ngrok)
            sameSite: isHttps ? 'none' : 'lax', // 'none' required for cross-site with https
            path: '/'
        };
        
        console.log('🍪 Setting cookies with options:', { 
            secure: cookieOptions.secure, 
            sameSite: cookieOptions.sameSite,
            baseUrl: baseUrl
        });
        
        const cookies = [
            serialize('spotify_access_token', tokenData.access_token, {
                ...cookieOptions,
                maxAge: 3600, // 1 hour
            }),
            serialize('spotify_refresh_token', tokenData.refresh_token || '', {
                ...cookieOptions,
                maxAge: 60 * 60 * 24 * 30, // 30 days
            }),
            serialize('spotify_user', JSON.stringify({
                id: userData.id,
                name: userData.display_name,
                email: userData.email
            }), {
                httpOnly: false, // Allow client to read this
                secure: isHttps,
                sameSite: isHttps ? 'none' : 'lax',
                maxAge: 3600,
                path: '/'
            })
        ];

        console.log('🍪 Cookies being set for user:', userData.id, userData.display_name);
        res.setHeader('Set-Cookie', cookies);
        res.redirect(`${FRONTEND_URL}?auth=success`);
    } catch (error) {
        console.error('Auth error:', error);
        res.redirect(`${FRONTEND_URL}?error=auth_failed`);
    }
}

