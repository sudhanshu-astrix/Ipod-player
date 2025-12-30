import { useApp } from '../context/AppContext';
import { useYouTubePlayer } from './useYouTubePlayer';

export const usePlayer = () => {
    const {
        currentPlaylist,
        currentTrackIndex,
        setCurrentTrackIndex,
        isPlaying,
        setIsPlaying,
        currentTime,
        setCurrentTime,
        volume,
        setVolume,
        setCurrentPlaylist
    } = useApp();

    const { playVideo, resumeVideo, pauseVideo, playerReady } = useYouTubePlayer();

    const playTrack = async (index) => {
        if (index < 0 || index >= currentPlaylist.length) return;
        
        setCurrentTrackIndex(index);
        const track = currentPlaylist[index];
        
        // Check if we need to fetch YouTube ID
        if (track.youtubeId === 'sample') {
            const { YouTubeAPI } = await import('../utils/youtubeAPI');
            const videoId = await YouTubeAPI.searchVideo(track.track, track.artist);
            if (videoId) {
                const updatedPlaylist = [...currentPlaylist];
                updatedPlaylist[index] = { ...track, youtubeId: videoId };
                setCurrentPlaylist(updatedPlaylist);
                
                if (playerReady) {
                    playVideo(videoId, track.duration);
                } else {
                    setIsPlaying(true);
                    setCurrentTime(0);
                }
                return;
            }
        }
        
        if (track.youtubeId && track.youtubeId !== 'sample' && playerReady) {
            playVideo(track.youtubeId, track.duration);
        } else {
            // Simulated playback
            setIsPlaying(true);
            setCurrentTime(0);
        }
    };

    const togglePlayback = () => {
        if (currentPlaylist.length === 0) return;
        
        if (currentTrackIndex === -1) {
            playTrack(0);
            return;
        }
        
        if (isPlaying) {
            // Pause the YouTube player
            pauseVideo();
        } else {
            // Resume playback
            if (playerReady) {
                const track = currentPlaylist[currentTrackIndex];
                if (track.youtubeId && track.youtubeId !== 'sample') {
                    // Try to resume the video if it's already loaded (pass video ID to check)
                    const resumed = resumeVideo(track.youtubeId);
                    if (!resumed) {
                        // If resume failed (no video loaded or different video), load the video from current time
                        playVideo(track.youtubeId, track.duration, currentTime);
                    }
                } else {
                    // Simulated playback - no YouTube video
                    setIsPlaying(true);
                }
            } else {
                // Player not ready yet - simulate playback
                setIsPlaying(true);
            }
        }
    };

    const nextTrack = () => {
        if (currentPlaylist.length === 0) return;
        const nextIndex = (currentTrackIndex + 1) % currentPlaylist.length;
        playTrack(nextIndex);
    };

    const prevTrack = () => {
        if (currentPlaylist.length === 0) return;
        
        if (currentTime > 3) {
            playTrack(currentTrackIndex);
        } else {
            const prevIndex = currentTrackIndex <= 0 
                ? currentPlaylist.length - 1 
                : currentTrackIndex - 1;
            playTrack(prevIndex);
        }
    };

    const volumeUp = () => {
        const newVolume = Math.min(100, volume + 10);
        setVolume(newVolume);
    };

    const volumeDown = () => {
        const newVolume = Math.max(0, volume - 10);
        setVolume(newVolume);
    };

    return {
        playTrack,
        togglePlayback,
        nextTrack,
        prevTrack,
        volumeUp,
        volumeDown
    };
};
