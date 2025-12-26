import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

// Singleton pattern: shared YouTube player instance across all hook calls
let globalPlayer = null;
let globalPlayerReady = false;

export const useYouTubePlayer = () => {
    const [playerReady, setPlayerReady] = useState(globalPlayerReady);
    const [player, setPlayer] = useState(globalPlayer);
    const playerRef = useRef(null);
    const { setIsPlaying, setCurrentTime, volume } = useApp();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // If global player already exists, sync this hook instance
        if (globalPlayer) {
            setPlayer(globalPlayer);
            setPlayerReady(globalPlayerReady);
        }

        const loadYouTubeAPI = () => {
            if (window.YT && window.YT.Player) {
                createPlayer();
                return;
            }

            // Check if script is already loading
            if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
                const checkInterval = setInterval(() => {
                    if (window.YT && window.YT.Player) {
                        clearInterval(checkInterval);
                        createPlayer();
                    }
                }, 100);
                return;
            }

            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            
            const originalCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (originalCallback) originalCallback();
                createPlayer();
            };
            
            document.head.appendChild(tag);
        };

        const createPlayer = () => {
            // If player already exists globally, use it
            if (globalPlayer) {
                setPlayer(globalPlayer);
                setPlayerReady(globalPlayerReady);
                return;
            }

            // Check if player element already exists in iPod component, otherwise create hidden element
            let playerElement = document.getElementById('youtube-player');
            if (!playerElement) {
                // Fallback: create hidden element if not found in iPod component
                playerElement = document.createElement('div');
                playerElement.id = 'youtube-player';
                playerElement.className = 'youtube-player-background';
                playerElement.style.cssText = 'position: absolute; top: -1000px; left: -1000px; width: 200px; height: 113px; opacity: 0; pointer-events: none; overflow: hidden;';
                document.body.appendChild(playerElement);
            } else {
                // Element exists in iPod component - ensure it has the right class
                playerElement.className = 'youtube-player-background';
            }
            playerRef.current = playerElement;

            try {
                const ytPlayer = new window.YT.Player('youtube-player', {
                    height: '150',
                    width: '150',
                    playerVars: {
                        'autoplay': 0,
                        'controls': 0,
                        'disablekb': 1,
                        'enablejsapi': 1,
                        'fs': 0,
                        'iv_load_policy': 3,
                        'modestbranding': 1,
                        'playsinline': 1,
                        'rel': 0,
                        'showinfo': 0,
                        'loop': 0
                    },
                    events: {
                        'onReady': () => {
                            // Set global singleton
                            globalPlayer = ytPlayer;
                            globalPlayerReady = true;
                            
                            // Update this hook instance
                            setPlayerReady(true);
                            setPlayer(ytPlayer);
                            
                            ytPlayer.setVolume(volume);
                        },
                        'onStateChange': (event) => {
                            if (event.data === window.YT.PlayerState.ENDED) {
                                // Handle track end - will be handled by parent
                            } else if (event.data === window.YT.PlayerState.PLAYING) {
                                setIsPlaying(true);
                                // Sync current time from YouTube player when playing starts
                                try {
                                    const ytTime = globalPlayer.getCurrentTime();
                                    if (ytTime !== null && !isNaN(ytTime)) {
                                        setCurrentTime(Math.floor(ytTime));
                                    }
                                } catch (e) {
                                    // Ignore errors
                                }
                            } else if (event.data === window.YT.PlayerState.PAUSED) {
                                setIsPlaying(false);
                                // Sync current time from YouTube player when paused
                                try {
                                    const ytTime = globalPlayer.getCurrentTime();
                                    if (ytTime !== null && !isNaN(ytTime)) {
                                        setCurrentTime(Math.floor(ytTime));
                                    }
                                } catch (e) {
                                    // Ignore errors
                                }
                            }
                        },
                        'onError': (event) => {
                            console.error('YouTube player error:', event.data);
                        }
                    }
                });
            } catch (error) {
                console.error('Error creating YouTube player:', error);
            }
        };

        loadYouTubeAPI();

        return () => {
            // Don't destroy player on unmount to avoid re-initialization issues
        };
    }, []);

    useEffect(() => {
        const activePlayer = globalPlayer || player;
        if (activePlayer && globalPlayerReady) {
            activePlayer.setVolume(volume);
        }
    }, [volume, player, playerReady]);

    const playVideo = (videoId, duration, startTime = 0) => {
        // Use global player instance
        const activePlayer = globalPlayer || player;
        if (activePlayer && globalPlayerReady) {
            try {
                // Check if the same video is already loaded
                let currentVideoId = null;
                try {
                    const videoData = activePlayer.getVideoData();
                    currentVideoId = videoData ? videoData.video_id : null;
                } catch (e) {
                    // Ignore errors
                }
                
                // If same video is already loaded and paused, just resume it
                if (currentVideoId === videoId) {
                    const playerState = activePlayer.getPlayerState();
                    if (playerState === window.YT.PlayerState.PAUSED || 
                        playerState === window.YT.PlayerState.CUED) {
                        // Sync current time before playing
                        try {
                            const ytTime = activePlayer.getCurrentTime();
                            if (ytTime !== null && !isNaN(ytTime) && ytTime >= 0) {
                                setCurrentTime(Math.floor(ytTime));
                            }
                        } catch (e) {
                            // Ignore errors
                        }
                        activePlayer.playVideo();
                        setIsPlaying(true);
                        return;
                    }
                }
                
                // Load video with start time
                activePlayer.loadVideoById({
                    videoId: videoId,
                    startSeconds: startTime
                });
                setIsPlaying(true);
            } catch (error) {
                console.error('Error playing video:', error);
                setIsPlaying(true); // Fallback to simulated playback state
                setCurrentTime(startTime);
            }
        } else {
            // Player not ready, simulate playback
            setIsPlaying(true);
            setCurrentTime(startTime);
        }
    };

    const resumeVideo = (expectedVideoId = null) => {
        // Use global player instance
        const activePlayer = globalPlayer || player;
        if (!activePlayer || !globalPlayerReady) {
            return false;
        }
        
        try {
            // Get player state first
            let playerState = null;
            try {
                playerState = activePlayer.getPlayerState();
            } catch (e) {
                // If we can't get state, can't resume
                return false;
            }
            
            // If player is already playing, we're good
            if (playerState === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                return true;
            }
            
            // If player is paused, we can resume
            if (playerState === window.YT.PlayerState.PAUSED) {
                // Verify video ID if provided
                if (expectedVideoId) {
                    try {
                        const videoData = activePlayer.getVideoData();
                        const currentVideoId = videoData ? videoData.video_id : null;
                        if (currentVideoId && currentVideoId !== expectedVideoId) {
                            // Different video is loaded, need to load the new one
                            return false;
                        }
                    } catch (e) {
                        // If we can't verify video ID but player is paused, try to resume anyway
                        // This handles cases where getVideoData() might fail
                    }
                }
                
                // Sync current time before resuming
                try {
                    const ytTime = activePlayer.getCurrentTime();
                    if (ytTime !== null && !isNaN(ytTime) && ytTime >= 0) {
                        setCurrentTime(Math.floor(ytTime));
                    }
                } catch (e) {
                    // Ignore errors
                }
                
                // Call playVideo() which resumes from paused position (does NOT restart)
                activePlayer.playVideo();
                setIsPlaying(true);
                return true;
            }
            
            // If player is cued or buffering, try to play
            if (playerState === window.YT.PlayerState.CUED || 
                playerState === window.YT.PlayerState.BUFFERING) {
                activePlayer.playVideo();
                setIsPlaying(true);
                return true;
            }
            
            // No video loaded or in wrong state (unstarted, ended)
            return false;
        } catch (error) {
            console.error('Error resuming video:', error);
            return false;
        }
    };

    const pauseVideo = () => {
        // Use global player instance
        const activePlayer = globalPlayer || player;
        if (activePlayer && globalPlayerReady) {
            try {
                activePlayer.pauseVideo();
            setIsPlaying(false);
            } catch (error) {
                console.error('Error pausing video:', error);
            }
        }
    };

    const stopVideo = () => {
        // Use global player instance
        const activePlayer = globalPlayer || player;
        if (activePlayer && globalPlayerReady) {
            try {
                activePlayer.stopVideo();
            setIsPlaying(false);
            setCurrentTime(0);
            } catch (error) {
                console.error('Error stopping video:', error);
            }
        }
    };

    return {
        playerReady: globalPlayerReady || playerReady,
        playVideo,
        resumeVideo,
        pauseVideo,
        stopVideo
    };
};
