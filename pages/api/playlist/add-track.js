// pages/api/playlist/add-track.js
import { parse } from 'cookie';
import querystring from 'querystring';

const PLAYLIST_NAME = 'lollapalooza';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get access token from cookie
    const cookies = parse(req.headers.cookie || '');
    const accessToken = cookies.spotify_access_token;
    const userCookie = cookies.spotify_user;

    if (!accessToken || !userCookie) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    let user;
    try {
        user = JSON.parse(userCookie);
    } catch (error) {
        return res.status(401).json({ error: 'Invalid user data' });
    }

    const { trackName, artistName, spotifyLink } = req.body;

    if (!trackName || !artistName) {
        return res.status(400).json({ error: 'Track name and artist name are required' });
    }

    try {
        const userId = user.id;
        console.log('🔐 Authenticated user:', {
            userId: userId,
            userName: user.name,
            userEmail: user.email
        });
        console.log('🎫 Access token present:', !!accessToken);

        // Extract track ID from Spotify link or search for the track
        let trackId;
        let trackUri;
        
        // First, try to extract track ID from Spotify link (most reliable)
        if (spotifyLink && spotifyLink.includes('track/')) {
            const match = spotifyLink.match(/track\/([a-zA-Z0-9]+)/);
            if (match) {
                trackId = match[1];
                trackUri = `spotify:track:${trackId}`;
                console.log('Using track ID from Spotify link:', trackId);
            }
        }

        // If no track ID from link, search for the track
        if (!trackId) {
            console.log('No Spotify link provided, searching for track:', trackName, 'by', artistName);
            
            const searchResponse = await fetch(
                `https://api.spotify.com/v1/search?${querystring.stringify({
                    q: `track:${trackName} artist:${artistName}`,
                    type: 'track',
                    limit: 1
                })}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (!searchResponse.ok) {
                const errorData = await searchResponse.text();
                console.error('Search failed:', searchResponse.status, errorData);
                return res.status(404).json({ 
                    error: 'Track not found on Spotify',
                    message: `Could not find "${trackName}" by ${artistName} on Spotify`
                });
            }

            const searchData = await searchResponse.json();

            if (!searchData.tracks || searchData.tracks.items.length === 0) {
                console.log('No tracks found in search results');
                return res.status(404).json({ 
                    error: 'Track not found on Spotify',
                    message: `Could not find "${trackName}" by ${artistName} on Spotify`
                });
            }

            trackId = searchData.tracks.items[0].id;
            trackUri = `spotify:track:${trackId}`;
            console.log('Found track via search:', trackId);
        }

        // Get user's playlists
        const playlistsResponse = await fetch(
            'https://api.spotify.com/v1/me/playlists?limit=50',
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        console.log('playlistsResponse', playlistsResponse);

        if (!playlistsResponse.ok) {
            const errorData = await playlistsResponse.text();
            console.error('Failed to fetch playlists:', {
                status: playlistsResponse.status,
                statusText: playlistsResponse.statusText,
                error: errorData
            });
            
            if (playlistsResponse.status === 401) {
                return res.status(401).json({ 
                    error: 'Authentication expired',
                    message: 'Please log in again'
                });
            } else if (playlistsResponse.status === 403) {
                return res.status(403).json({ 
                    error: 'Permission denied',
                    message: 'Your Spotify account needs to be added to the app. Contact the developer.'
                });
            }
            
            throw new Error(`Failed to fetch playlists: ${playlistsResponse.status}`);
        }

        const playlistsData = await playlistsResponse.json();
        console.log('playlistsData', playlistsData);
        console.log(`Found ${playlistsData.items?.length || 0} playlists`);

        // Find Lollapalooza playlist
        let playlist = playlistsData.items.find(
            p => p.name.toLowerCase() === PLAYLIST_NAME.toLowerCase()
        );

        // Create playlist if it doesn't exist
        if (!playlist) {
            console.log(`📝 Creating new playlist "${PLAYLIST_NAME}" for user:`, userId);
            
            const createResponse = await fetch(
                `https://api.spotify.com/v1/users/${userId}/playlists`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: PLAYLIST_NAME,
                        description: 'Lollapalooza India 2026 - My Favorite Tracks',
                        public: true
                    })
                }
            );

            if (!createResponse.ok) {
                const errorData = await createResponse.text();
                console.error('Failed to create playlist:', {
                    status: createResponse.status,
                    error: errorData
                });
                throw new Error('Failed to create playlist');
            }

            playlist = await createResponse.json();
            console.log('✅ Playlist created successfully:', playlist.id);
        } else {
            console.log(`✅ Found existing playlist "${PLAYLIST_NAME}":`, playlist.id, 'owned by:', playlist.owner.id);
        }

        // Check if track already exists in playlist
        const playlistTracksResponse = await fetch(
            `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!playlistTracksResponse.ok) {
            throw new Error('Failed to fetch playlist tracks');
        }

        const playlistTracksData = await playlistTracksResponse.json();

        const trackExists = playlistTracksData.items.some(
            item => item.track && item.track.id === trackId
        );

        if (trackExists) {
            return res.json({ 
                success: false,
                alreadyExists: true,
                message: `"${trackName}" is already in your ${PLAYLIST_NAME} playlist!`,
                playlistUrl: playlist.external_urls.spotify
            });
        }

        // Add track to playlist
        const addTrackResponse = await fetch(
            `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uris: [trackUri]
                })
            }
        );

        if (!addTrackResponse.ok) {
            throw new Error('Failed to add track to playlist');
        }

        res.json({ 
            success: true,
            message: `"${trackName}" added to your ${PLAYLIST_NAME} playlist!`,
            playlistUrl: playlist.external_urls.spotify,
            playlistName: PLAYLIST_NAME
        });

    } catch (error) {
        console.error('Add track error:', error);
        
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            return res.status(401).json({ 
                error: 'Authentication expired',
                message: 'Please log in again'
            });
        }

        res.status(500).json({ 
            error: 'Failed to add track',
            message: error.message || 'An error occurred'
        });
    }
}

