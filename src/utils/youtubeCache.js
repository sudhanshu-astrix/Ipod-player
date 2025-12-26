import { YOUTUBE_CONFIG } from '../constants/config';

export const YouTubeCache = {
    getCacheKey(track, artist) {
        return `yt_cache_${track}_${artist}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    },
    
    get(track, artist) {
        try {
            const key = this.getCacheKey(track, artist);
            const cached = localStorage.getItem(key);
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            const expiryTime = YOUTUBE_CONFIG.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
            const isExpired = (Date.now() - data.cachedAt) > expiryTime;
            
            if (isExpired) {
                localStorage.removeItem(key);
                return null;
            }
            
            return data.videoId;
        } catch (error) {
            console.error('Error reading cache:', error);
            return null;
        }
    },
    
    set(track, artist, videoId) {
        try {
            const key = this.getCacheKey(track, artist);
            const data = {
                videoId: videoId,
                cachedAt: Date.now(),
                track: track,
                artist: artist
            };
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error writing cache:', error);
            return false;
        }
    },
    
    markNonEmbeddable(videoId) {
        try {
            const key = `yt_non_embeddable_${videoId}`;
            localStorage.setItem(key, JSON.stringify({
                videoId: videoId,
                markedAt: Date.now()
            }));
            return true;
        } catch (error) {
            console.error('Error marking video as non-embeddable:', error);
            return false;
        }
    },
    
    isNonEmbeddable(videoId) {
        try {
            const key = `yt_non_embeddable_${videoId}`;
            return localStorage.getItem(key) !== null;
        } catch (error) {
            return false;
        }
    }
};
