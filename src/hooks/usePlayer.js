import { useApp } from '../context/AppContext';
import { useYouTubePlayer } from './useYouTubePlayer';
import { trackEvent } from '../utils/mixpanel';

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
        
        // Track track play event
        trackEvent('Track Played', {
            track_name: track.track,
            artist_name: track.artist,
            genre: currentGenre?.name || 'Unknown',
            track_index: index,
            playlist_length: currentPlaylist.length
        });
        
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
            // Track pause event
            const track = playingPlaylist[playingTrackIndex];
            trackEvent('Playback Paused', {
                track_name: track?.track || 'Unknown',
                artist_name: track?.artist || 'Unknown',
                current_time: currentTime,
                genre: currentGenre?.name || 'Unknown'
            });
            
            // Pause the YouTube player
            pauseVideo();
            // Dispatch event - iPod paused (background music can resume)
            window.dispatchEvent(new CustomEvent('ipodPlaybackPaused'));
        } else {
            // Track play event
            const track = playingPlaylist[playingTrackIndex];
            trackEvent('Playback Resumed', {
                track_name: track?.track || 'Unknown',
                artist_name: track?.artist || 'Unknown',
                current_time: currentTime,
                genre: currentGenre?.name || 'Unknown'
            });
            
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
        
        // Track next track event
        const currentTrack = playingPlaylist[playingTrackIndex];
        const nextTrack = playingPlaylist[nextIndex];
        trackEvent('Next Track', {
            from_track: currentTrack?.track || 'Unknown',
            to_track: nextTrack?.track || 'Unknown',
            from_artist: currentTrack?.artist || 'Unknown',
            to_artist: nextTrack?.artist || 'Unknown',
            current_time: currentTime,
            genre: currentGenre?.name || 'Unknown'
        });
        
        playTrackFromPlayingList(nextIndex);
    };

    const prevTrack = () => {
        // Use playing playlist for next/prev navigation
        if (playingPlaylist.length === 0) return;
        
        const currentTrack = playingPlaylist[playingTrackIndex];
        
        if (currentTime > 3) {
            // Track restart track event
            trackEvent('Track Restarted', {
                track_name: currentTrack?.track || 'Unknown',
                artist_name: currentTrack?.artist || 'Unknown',
                current_time: currentTime,
                genre: currentGenre?.name || 'Unknown'
            });
            playTrackFromPlayingList(playingTrackIndex);
        } else {
            const prevIndex = playingTrackIndex <= 0 
                ? playingPlaylist.length - 1 
                : playingTrackIndex - 1;
            const prevTrack = playingPlaylist[prevIndex];
            
            // Track previous track event
            trackEvent('Previous Track', {
                from_track: currentTrack?.track || 'Unknown',
                to_track: prevTrack?.track || 'Unknown',
                from_artist: currentTrack?.artist || 'Unknown',
                to_artist: prevTrack?.artist || 'Unknown',
                current_time: currentTime,
                genre: currentGenre?.name || 'Unknown'
            });
            
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
        trackEvent('Volume Changed', {
            action: 'volume_up',
            old_volume: volume,
            new_volume: newVolume
        });
    };

    const volumeDown = () => {
        const newVolume = Math.max(0, volume - 10);
        setVolume(newVolume);
        trackEvent('Volume Changed', {
            action: 'volume_down',
            old_volume: volume,
            new_volume: newVolume
        });
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
