import React, { useState, useEffect, useRef } from 'react';
import { spotifyAuthService } from '../utils/spotifyAuth';

const Header = () => {
    const [isSpotifyAuthenticated, setIsSpotifyAuthenticated] = useState(false);
    const [spotifyUser, setSpotifyUser] = useState(null);
    const [showSpotifyMenu, setShowSpotifyMenu] = useState(false);
    const [isMusicPlaying, setIsMusicPlaying] = useState(true); // Default: ON
    const [showMusicTooltip, setShowMusicTooltip] = useState(false); // FTUE tooltip
    const spotifyMenuRef = useRef(null);
    const audioRef = useRef(null);
    const userTurnedOffRef = useRef(false); // Track if user manually turned off


    useEffect(() => {
        console.log('isMusicPlaying', isMusicPlaying);
    }, [isMusicPlaying]);
    // Show FTUE tooltip for first-time users (per session)
    useEffect(() => {
        const hasSeenMusicTooltip = sessionStorage.getItem('hasSeenMusicTooltip');
        if (!hasSeenMusicTooltip) {
            // Show tooltip after a short delay
            const timer = setTimeout(() => {
                setShowMusicTooltip(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    // Hide tooltip when user clicks the music button
    const handleMusicTooltipDismiss = () => {
        setShowMusicTooltip(false);
        sessionStorage.setItem('hasSeenMusicTooltip', 'true');
    };

    // Initialize and play background music on mount - plays by default
    useEffect(() => {
        // Create audio element for background music
        audioRef.current = new Audio('/Music/linkin-park.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3;
        audioRef.current.preload = 'auto';
        
        let hasStartedPlaying = false;
        
        // Function to start music
        const startMusic = async () => {
            if (hasStartedPlaying || !audioRef.current || userTurnedOffRef.current) return;
            
            try {
                audioRef.current.volume = 0.3;
                await audioRef.current.play();
                hasStartedPlaying = true;
                setIsMusicPlaying(true);
                removeListeners();
                console.log('Background music started');
            } catch (e) {
                // Keep trying
            }
        };
        
        // Remove all event listeners
        const removeListeners = () => {
            document.removeEventListener('click', startMusic, true);
            document.removeEventListener('touchstart', startMusic, true);
            document.removeEventListener('touchend', startMusic, true);
            document.removeEventListener('keydown', startMusic, true);
            document.removeEventListener('mousemove', startMusic, true);
            document.removeEventListener('mouseenter', startMusic, true);
            document.removeEventListener('scroll', startMusic, true);
            document.removeEventListener('wheel', startMusic, true);
            document.removeEventListener('pointerdown', startMusic, true);
            document.removeEventListener('pointermove', startMusic, true);
            document.removeEventListener('focus', startMusic, true);
            window.removeEventListener('focus', startMusic, true);
        };
        
        // Add ALL possible interaction listeners
        const addListeners = () => {
            document.addEventListener('click', startMusic, true);
            document.addEventListener('touchstart', startMusic, true);
            document.addEventListener('touchend', startMusic, true);
            document.addEventListener('keydown', startMusic, true);
            document.addEventListener('mousemove', startMusic, true);
            document.addEventListener('mouseenter', startMusic, true);
            document.addEventListener('scroll', startMusic, true);
            document.addEventListener('wheel', startMusic, true);
            document.addEventListener('pointerdown', startMusic, true);
            document.addEventListener('pointermove', startMusic, true);
            document.addEventListener('focus', startMusic, true);
            window.addEventListener('focus', startMusic, true);
        };
        
        // Aggressive autoplay attempts
        const attemptAutoplay = async () => {
            // Attempt 1: Direct play
            try {
                await audioRef.current.play();
                hasStartedPlaying = true;
                setIsMusicPlaying(true);
                console.log('Autoplay successful!');
                return;
            } catch (e) {
                console.log('e', e);
                console.log('Direct autoplay blocked');
            }
            
            // Attempt 2: Play after small delay
            setTimeout(async () => {
                if (hasStartedPlaying) return;
                try {
                    await audioRef.current.play();
                    hasStartedPlaying = true;
                    setIsMusicPlaying(true);
                    console.log('Delayed autoplay successful!');
                    return;
                } catch (e) {
                    console.log('Delayed autoplay also blocked - waiting for interaction');
                    addListeners();
                }
            }, 500);
        };
        
        attemptAutoplay();
        
        return () => {
            removeListeners();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Toggle background music
    const toggleBackgroundMusic = async () => {
        if (audioRef.current) {
            if (isMusicPlaying) {
                // User is turning OFF the music
                audioRef.current.pause();
                setIsMusicPlaying(false);
                userTurnedOffRef.current = true; // Mark as manually turned off
            } else {
                // User is turning ON the music
                try {
                    audioRef.current.volume = 0.3;
                    await audioRef.current.play();
                    setIsMusicPlaying(true);
                    userTurnedOffRef.current = false; // Allow auto-play again
                } catch (e) {
                    console.log('Cannot play music:', e);
                }
            }
        }
    };

    // Listen for iPod playback events to pause/resume background music
    useEffect(() => {
        const handleIpodStarted = () => {
            // Pause background music when iPod starts playing
            if (audioRef.current && isMusicPlaying) {
                audioRef.current.pause();
                setIsMusicPlaying(false);
            }
        };
        
        const handleIpodPaused = () => {
            // Resume background music when iPod is paused (only if user hasn't turned it off)
            if (audioRef.current && !userTurnedOffRef.current) {
                audioRef.current.play().then(() => {
                    setIsMusicPlaying(true);
                }).catch(e => {
                    console.log('Cannot resume background music:', e);
                });
            }
        };
        
        window.addEventListener('ipodPlaybackStarted', handleIpodStarted);
        window.addEventListener('ipodPlaybackPaused', handleIpodPaused);
        
        return () => {
            window.removeEventListener('ipodPlaybackStarted', handleIpodStarted);
            window.removeEventListener('ipodPlaybackPaused', handleIpodPaused);
        };
    }, [isMusicPlaying]);

    // Check Spotify authentication status
    useEffect(() => {
        checkSpotifyAuth();
        
        const params = new URLSearchParams(window.location.search);
        if (params.get('auth') === 'success') {
            setTimeout(() => {
                checkSpotifyAuth();
            }, 300);
        }
        
        const handleDisconnect = () => {
            setIsSpotifyAuthenticated(false);
            setSpotifyUser(null);
        };
        
        window.addEventListener('spotifyDisconnected', handleDisconnect);
        
        return () => {
            window.removeEventListener('spotifyDisconnected', handleDisconnect);
        };
    }, []);

    const checkSpotifyAuth = async () => {
        try {
            const status = await spotifyAuthService.checkAuthStatus();
            setIsSpotifyAuthenticated(status.authenticated);
            setSpotifyUser(status.user);
        } catch (error) {
            console.error('Failed to check Spotify auth:', error);
        }
    };

    const handleSpotifyDisconnect = async () => {
        try {
            await spotifyAuthService.logout();
            setIsSpotifyAuthenticated(false);
            setSpotifyUser(null);
            setShowSpotifyMenu(false);
            
            const event = new CustomEvent('spotifyDisconnected', {
                detail: { message: 'Disconnected from Spotify' }
            });
            window.dispatchEvent(event);
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (spotifyMenuRef.current && !spotifyMenuRef.current.contains(e.target)) {
                const spotifyBtn = document.getElementById('spotifyButton');
                if (spotifyBtn && !spotifyBtn.contains(e.target)) {
                    setShowSpotifyMenu(false);
                }
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <header className="site-header">
            <div className="site-header-content">
                <div className="site-header-left">
                    {/* Logo - Plinth Logo Image */}
                    <a href="/" className="site-logo" aria-label="Home">
                        <img src="/plinth-logo.svg" alt="Plinth" className="logo-image" />
                    </a>
                </div>

                {/* Center - Reach Out Button */}
                <a 
                    style={{ textDecoration: 'none' }}
                    href="https://www.astrix.live/#contact" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="reach-out-btn"
                >
                    Reach Out
                </a>

                <nav className="site-nav">
                    {/* Spotify Connection Status */}
                    {isSpotifyAuthenticated && (
                        <div className="spotify-menu-container">
                    <button 
                                id="spotifyButton"
                                className="spotify-status-btn"
                                onClick={() => setShowSpotifyMenu(!showSpotifyMenu)}
                                aria-label="Spotify menu"
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18">
                                    <path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                                <span className="spotify-user-name">{spotifyUser?.name || 'Spotify'}</span>
                                <svg className="dropdown-arrow" viewBox="0 0 24 24" width="16" height="16">
                                    <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                        </svg>
                    </button>
                            
                            {showSpotifyMenu && (
                                <div className="spotify-dropdown" ref={spotifyMenuRef}>
                                    <div className="spotify-dropdown-header">
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                                        </svg>
                                        <div className="spotify-dropdown-info">
                                            <div className="spotify-dropdown-name">{spotifyUser?.name || 'Connected'}</div>
                                            <div className="spotify-dropdown-email">{spotifyUser?.email || ''}</div>
                                        </div>
                                    </div>
                                    <div className="spotify-dropdown-divider"></div>
                    <button 
                                        className="spotify-disconnect-btn"
                                        onClick={handleSpotifyDisconnect}
                                    >
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                        </svg>
                                        Disconnect Spotify
                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Music Waves Toggle - Background Music Control */}
                    <div className="music-toggle-wrapper">
                        {showMusicTooltip && isMusicPlaying && (
                            <div className="music-ftue-tooltip">
                                <span>Click to turn off background music</span>
                                <div className="ftue-tooltip-arrow"></div>
                            </div>
                        )}
                        <button 
                            className="music-toggle-btn"
                            onClick={() => {
                                handleMusicTooltipDismiss();
                                toggleBackgroundMusic();
                            }}
                            aria-label={isMusicPlaying ? "Mute background music" : "Play background music"}
                        >
                            {isMusicPlaying ? (
                                <img src="/music-waves.svg" alt="Music On" className="music-waves-off" />
                            ) : (
                                <img src="/music-waves-off.svg" alt="Music Off" className="music-waves-off" />
                            )}
                        </button>
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default Header;
