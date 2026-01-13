import { useApp } from '../context/AppContext';
import { useYouTubePlayer } from './useYouTubePlayer';

export const usePlayer = () => {
    const {
        currentPlaylist,
        currentTrackIndex,
        setCurrentTrackIndex,
        currentGenre,
        isPlaying,
        setIsPlaying,
        currentTime,
        setCurrentTime,
        volume,
        setVolume,
        setCurrentPlaylist,
        // Playing state
        setPlayingTrack,
        setPlayingGenre,
        setPlayingPlaylist,
        setPlayingTrackIndex,
        playingPlaylist,
        playingTrackIndex
    } = useApp();

    const { playVideo, resumeVideo, pauseVideo, playerReady } = useYouTubePlayer();

    const playTrack = async (index) => {
        if (index < 0 || index >= currentPlaylist.length) return;
        
        // Dispatch event to pause background music when iPod starts playing
        window.dispatchEvent(new CustomEvent('ipodPlaybackStarted'));
        
        // Reset progress bar immediately when changing tracks
        setCurrentTime(0);
        setCurrentTrackIndex(index);
        const track = currentPlaylist[index];
        
        // Update playing state - this persists across genre changes
        setPlayingTrack(track);
        setPlayingGenre(currentGenre);
        setPlayingPlaylist([...currentPlaylist]);
        setPlayingTrackIndex(index);
        
        // Check if we need to fetch YouTube ID
        if (track.youtubeId === 'sample') {
            const { YouTubeAPI } = await import('../utils/youtubeAPI');
            const videoId = await YouTubeAPI.searchVideo(track.track, track.artist);
            if (videoId) {
                const updatedPlaylist = [...currentPlaylist];
                updatedPlaylist[index] = { ...track, youtubeId: videoId };
                setCurrentPlaylist(updatedPlaylist);
                
                // Also update playing playlist with the new video ID
                const updatedTrack = { ...track, youtubeId: videoId };
                setPlayingTrack(updatedTrack);
                setPlayingPlaylist(updatedPlaylist);
                
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
        // If no track is playing yet and we have a current playlist, play first track
        if (playingPlaylist.length === 0 && currentPlaylist.length > 0) {
            playTrack(0);
            return;
        }
        
        if (playingPlaylist.length === 0) return;
        
        if (isPlaying) {
            // Pause the YouTube player
            pauseVideo();
            // Dispatch event - iPod paused (background music can resume)
            window.dispatchEvent(new CustomEvent('ipodPlaybackPaused'));
        } else {
            // Resume playback - pause background music
            window.dispatchEvent(new CustomEvent('ipodPlaybackStarted'));
            
            // Resume playback using the playing playlist
            if (playerReady) {
                const track = playingPlaylist[playingTrackIndex];
                if (track && track.youtubeId && track.youtubeId !== 'sample') {
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
        // Use playing playlist for next/prev navigation
        if (playingPlaylist.length === 0) return;
        const nextIndex = (playingTrackIndex + 1) % playingPlaylist.length;
        playTrackFromPlayingList(nextIndex);
    };

    const prevTrack = () => {
        // Use playing playlist for next/prev navigation
        if (playingPlaylist.length === 0) return;
        
        if (currentTime > 3) {
            playTrackFromPlayingList(playingTrackIndex);
        } else {
            const prevIndex = playingTrackIndex <= 0 
                ? playingPlaylist.length - 1 
                : playingTrackIndex - 1;
            playTrackFromPlayingList(prevIndex);
        }
    };
    
    // Play a track from the currently playing playlist (for next/prev)
    const playTrackFromPlayingList = async (index) => {
        if (index < 0 || index >= playingPlaylist.length) return;
        
        // Dispatch event to pause background music
        window.dispatchEvent(new CustomEvent('ipodPlaybackStarted'));
        
        setCurrentTime(0);
        const track = playingPlaylist[index];
        
        // Update playing state
        setPlayingTrack(track);
        setPlayingTrackIndex(index);
        
        // Check if we need to fetch YouTube ID
        if (track.youtubeId === 'sample') {
            const { YouTubeAPI } = await import('../utils/youtubeAPI');
            const videoId = await YouTubeAPI.searchVideo(track.track, track.artist);
            if (videoId) {
                const updatedPlaylist = [...playingPlaylist];
                updatedPlaylist[index] = { ...track, youtubeId: videoId };
                setPlayingPlaylist(updatedPlaylist);
                
                const updatedTrack = { ...track, youtubeId: videoId };
                setPlayingTrack(updatedTrack);
                
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
            setIsPlaying(true);
            setCurrentTime(0);
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
