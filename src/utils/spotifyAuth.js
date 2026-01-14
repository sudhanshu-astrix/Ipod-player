// Next.js API routes are served from the same origin, no need for separate API URL
const API_BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

export const spotifyAuthService = {
    // Check if user is authenticated
    async checkAuthStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Auth status check failed:', error);
            return { authenticated: false };
        }
    },

    // Get Spotify login URL and redirect
    async login() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.authUrl) {
                window.location.href = data.authUrl;
            }
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    },

    // Logout
    async logout() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    },

    // Add track to Lollapalooza playlist
    async addTrackToPlaylist(trackName, artistName, spotifyLink, genreName = null) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/playlist/add-track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    trackName,
                    artistName,
                    spotifyLink,
                    genreName
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to add track');
            }

            return data;
        } catch (error) {
            console.error('Add track failed:', error);
            throw error;
        }
    }
};

