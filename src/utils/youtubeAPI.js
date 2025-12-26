import { YOUTUBE_CONFIG } from '../constants/config';
import { YouTubeCache } from './youtubeCache';

export const YouTubeAPI = {
    async searchVideo(track, artist) {
        const cachedId = YouTubeCache.get(track, artist);
        if (cachedId) {
            console.log(`Using cached video ID for "${track}" by ${artist}:`, cachedId);
            return cachedId;
        }
        
        if (!YOUTUBE_CONFIG.API_KEY || YOUTUBE_CONFIG.API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
            console.warn('YouTube API key not configured. Using simulated playback.');
            return null;
        }
        
        try {
            const query = `${track} ${artist} official audio`;
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=1&key=${YOUTUBE_CONFIG.API_KEY}`;
            
            console.log(`Searching YouTube for: "${query}"`);
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.error) {
                console.error('YouTube API error:', data.error.message);
                return null;
            }
            
            if (data.items && data.items.length > 0) {
                const videoId = data.items[0].id.videoId;
                console.log(`Found video ID for "${track}" by ${artist}:`, videoId);
                YouTubeCache.set(track, artist, videoId);
                return videoId;
            } else {
                console.warn(`No video found for "${track}" by ${artist}`);
                return null;
            }
        } catch (error) {
            console.error('Error searching YouTube:', error);
            return null;
        }
    },
    
    async searchVideoAlternative(track, artist, excludeVideoId = null) {
        if (!YOUTUBE_CONFIG.API_KEY || YOUTUBE_CONFIG.API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
            console.warn('YouTube API key not configured. Cannot search for alternative video.');
            return null;
        }
        
        try {
            const searchQueries = [
                `${track} ${artist} official audio`,
                `${track} ${artist} official`,
                `${artist} ${track} audio`,
                `${track} ${artist}`
            ];
            
            for (const query of searchQueries) {
                const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=5&key=${YOUTUBE_CONFIG.API_KEY}`;
                
                console.log(`Searching for alternative video: "${query}"`);
                
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.error) {
                    console.error('YouTube API error:', data.error.message);
                    continue;
                }
                
                if (data.items && data.items.length > 0) {
                    for (const item of data.items) {
                        const videoId = item.id.videoId;
                        if (videoId && 
                            videoId !== excludeVideoId && 
                            !YouTubeCache.isNonEmbeddable(videoId)) {
                            console.log(`Found alternative video ID: ${videoId}`);
                            YouTubeCache.set(track, artist, videoId);
                            return videoId;
                        }
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, YOUTUBE_CONFIG.SEARCH_DELAY));
            }
            
            console.warn(`No alternative video found for "${track}" by ${artist}`);
            return null;
        } catch (error) {
            console.error('Error searching for alternative video:', error);
            return null;
        }
    }
};
