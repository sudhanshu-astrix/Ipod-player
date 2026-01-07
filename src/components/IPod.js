import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { usePlayer } from '../hooks/usePlayer';
import { formatTime } from '../utils/formatTime';
import { genres } from '../constants/genres';
import { playlistData, ArtistData } from '../constants/playlistData';

const IPod = () => {
    const {
        currentPlaylist,
        currentTrackIndex,
        isPlaying,
        currentTime,
        setCurrentTime,
        currentGenre,
        setCurrentGenre,
        setCurrentPlaylist,
        ipodView,
        setIpodView,
        nowPlayingExpanded,
        setNowPlayingExpanded,
        setShowMiniPlayer,
        // Playing state - persists across genre changes
        playingTrack,
        playingGenre,
        playingPlaylist,
        playingTrackIndex
    } = useApp();

    const { playTrack, togglePlayback, nextTrack, prevTrack, volumeUp, volumeDown } = usePlayer();
    const progressFillRef = useRef(null);
    const intervalRef = useRef(null);
    const playlistContainerRef = useRef(null);
    const [showVolumeToast, setShowVolumeToast] = useState(false);
    const toastTimeoutRef = useRef(null);

    // Use playingTrack for display in bottom bar and now playing view
    // This persists even when browsing different genres

    // Detect iOS device
    const isIOS = useCallback(() => {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }, []);

    // Handle volume button press with iOS detection
    const handleVolumeChange = useCallback((direction) => {
        if (isIOS()) {
            // Show toast message on iOS
            setShowVolumeToast(true);
            
            // Clear existing timeout
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
            }
            
            // Hide toast after 2.5 seconds
            toastTimeoutRef.current = setTimeout(() => {
                setShowVolumeToast(false);
            }, 2500);
        } else {
            // On non-iOS devices, volume control works
            if (direction === 'up') {
                volumeUp();
            } else {
                volumeDown();
            }
        }
    }, [isIOS, volumeUp, volumeDown]);

    // Cleanup toast timeout on unmount
    useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
            }
        };
    }, []);

    // Handle genre selection
    const handleGenreSelect = (genreId) => {
        const genreInfo = genres.find(g => g.id === genreId);
        setCurrentGenre(genreInfo);
        
        const tracks = playlistData[genreId] || [];
        setCurrentPlaylist(tracks);
        setIpodView('playlist');
        setShowMiniPlayer(true);
    };

    // Handle track selection
    const handleTrackSelect = (index) => {
        playTrack(index);
        setNowPlayingExpanded(true);
    };

    // Handle back navigation
    const handleBack = () => {
        if (nowPlayingExpanded) {
            setNowPlayingExpanded(false);
        } else if (ipodView === 'playlist') {
            setIpodView('genres');
            setCurrentGenre(null);
        }
    };

    // Progress bar update - use playingTrack
    useEffect(() => {
        if (isPlaying && playingTrack) {
            intervalRef.current = setInterval(() => {
                setCurrentTime(prev => {
                    const newTime = prev + 1;
                    if (newTime >= playingTrack.duration) {
                        nextTrack();
                        return 0;
                    }
                    return newTime;
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isPlaying, playingTrack, nextTrack, setCurrentTime]);

    // Update progress bar - use playingTrack
    useEffect(() => {
        if (playingTrack && progressFillRef.current) {
            const progress = (currentTime / playingTrack.duration) * 100;
            progressFillRef.current.style.width = `${progress}%`;
        }
    }, [currentTime, playingTrack]);

    // Scroll active track into view
    useEffect(() => {
        if (playlistContainerRef.current && currentTrackIndex >= 0) {
            const activeItem = playlistContainerRef.current.querySelector('.ipod-track-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [currentTrackIndex]);

    // Get artist info
    const getArtistInfo = (artistName) => {
        return ArtistData[artistName] || null;
    };

    // Render genre selection view
    const renderGenresView = () => (
        <div className="ipod-genres-view">
            <div className="ipod-view-header">
                <h2 className="ipod-view-title">Select Genre</h2>
            </div>
            <div className={`ipod-genres-list ${playingTrack ? 'has-bottom-bar' : ''}`}>
                {genres.map((genre) => (
                    <button
                        key={genre.id}
                        className="ipod-genre-card"
                        onClick={() => handleGenreSelect(genre.id)}
                    >
                        <span 
                            className="ipod-genre-accent" 
                            style={{ background: genre.color }}
                        ></span>
                        <span className="ipod-genre-name">{genre.name}</span>
                        <span className="ipod-genre-count">{playlistData[genre.id]?.length || 0}</span>
                        <svg className="ipod-genre-arrow" viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                        </svg>
                    </button>
                ))}
            </div>
            
            {/* Bottom Bar Player - shows playing track even in genre view */}
            {playingTrack && (
                <div 
                    className={`ipod-bottom-bar ${nowPlayingExpanded ? 'hidden' : ''}`}
                    onClick={() => setNowPlayingExpanded(true)}
                >
                    <div className="ipod-bottom-bar-thumb">
                        {playingTrack.albumArt ? (
                            <img src={playingTrack.albumArt} alt={playingTrack.track} />
                        ) : (
                            <div className="ipod-bottom-bar-thumb-placeholder">♪</div>
                        )}
                    </div>
                    <div className="ipod-bottom-bar-info">
                        <div className="ipod-bottom-bar-track">{playingTrack.track}</div>
                        <div className="ipod-bottom-bar-artist">{playingTrack.artist}</div>
                    </div>
                    <button 
                        className="ipod-bottom-bar-play"
                        onClick={(e) => {
                            e.stopPropagation();
                            togglePlayback();
                        }}
                    >
                        {isPlaying ? (
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path fill="currentColor" d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path fill="currentColor" d="M8 5v14l11-7z"/>
                            </svg>
                        )}
                    </button>
                    <div className="ipod-bottom-bar-progress">
                        <div 
                            className="ipod-bottom-bar-progress-fill"
                            style={{ width: `${(currentTime / playingTrack.duration) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}
            
            {/* Full Screen Now Playing - can be expanded from genre view too */}
            {renderNowPlayingView()}
        </div>
    );

    // Check if a track in current browsing playlist is the currently playing track
    const isTrackPlaying = (track, index) => {
        if (!playingTrack || !playingGenre || !currentGenre) return false;
        // Match by track name, artist, and genre to ensure it's the same track
        return playingTrack.track === track.track && 
               playingTrack.artist === track.artist &&
               playingGenre.id === currentGenre.id;
    };

    // Render playlist view with bottom bar
    const renderPlaylistView = () => (
        <div className="ipod-playlist-view">
            <div className="ipod-view-header">
                <button className="ipod-back-btn" onClick={handleBack}>
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                    </svg>
                </button>
                <h2 className="ipod-view-title" style={{ color: currentGenre?.color }}>
                    {currentGenre?.name || 'Playlist'}
                </h2>
                <span className="ipod-track-count">{currentPlaylist.length} tracks</span>
            </div>
            
            <div className="ipod-tracks-list" ref={playlistContainerRef}>
                {currentPlaylist.map((track, index) => {
                    const isCurrentlyPlaying = isTrackPlaying(track, index);
                    return (
                        <button
                            key={index}
                            className={`ipod-track-item ${isCurrentlyPlaying ? 'active' : ''}`}
                            onClick={() => handleTrackSelect(index)}
                        >
                            <div className="ipod-track-thumb">
                                {track.albumArt ? (
                                    <img src={track.albumArt} alt={track.track} loading="lazy" />
                                ) : (
                                    <div className="ipod-track-thumb-placeholder">♪</div>
                                )}
                                {isCurrentlyPlaying && isPlaying && (
                                    <div className="ipod-track-playing-indicator">
                                        <span></span><span></span><span></span>
                                    </div>
                                )}
                            </div>
                            <div className="ipod-track-info">
                                <div className="ipod-track-name">{track.track}</div>
                                <div className="ipod-track-artist">{track.artist}</div>
                            </div>
                            <div className="ipod-track-duration">{formatTime(track.duration)}</div>
                        </button>
                    );
                })}
            </div>

            {/* Bottom Bar Player (minimized now playing) - uses playingTrack */}
            {playingTrack && (
                <div 
                    className={`ipod-bottom-bar ${nowPlayingExpanded ? 'hidden' : ''}`}
                    onClick={() => setNowPlayingExpanded(true)}
                >
                    <div className="ipod-bottom-bar-thumb">
                        {playingTrack.albumArt ? (
                            <img src={playingTrack.albumArt} alt={playingTrack.track} />
                        ) : (
                            <div className="ipod-bottom-bar-thumb-placeholder">♪</div>
                        )}
                    </div>
                    <div className="ipod-bottom-bar-info">
                        <div className="ipod-bottom-bar-track">{playingTrack.track}</div>
                        <div className="ipod-bottom-bar-artist">{playingTrack.artist}</div>
                    </div>
                    <button 
                        className="ipod-bottom-bar-play"
                        onClick={(e) => {
                            e.stopPropagation();
                            togglePlayback();
                        }}
                    >
                        {isPlaying ? (
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path fill="currentColor" d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path fill="currentColor" d="M8 5v14l11-7z"/>
                            </svg>
                        )}
                    </button>
                    <div className="ipod-bottom-bar-progress">
                        <div 
                            className="ipod-bottom-bar-progress-fill"
                            style={{ width: `${(currentTime / playingTrack.duration) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Full Screen Now Playing */}
            {renderNowPlayingView()}
                </div>
            );

    // Render full screen now playing view - uses playingTrack and playingGenre
    const renderNowPlayingView = () => {
        if (!playingTrack) return null;
        
        const artistInfo = getArtistInfo(playingTrack.artist);
        const progress = playingTrack ? (currentTime / playingTrack.duration) * 100 : 0;

        return (
            <div className={`ipod-now-playing ${nowPlayingExpanded ? 'expanded' : ''}`}>
                <div className="ipod-now-playing-header">
                    <button className="ipod-np-close" onClick={() => setNowPlayingExpanded(false)}>
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                    <span className="ipod-np-genre" style={{ color: playingGenre?.color }}>
                        {playingGenre?.name || 'Now Playing'}
                    </span>
                    <div className="ipod-np-spacer"></div>
                </div>

                <div className="ipod-np-artwork">
                    {playingTrack.albumArt ? (
                        <img 
                            src={playingTrack.albumArt} 
                            alt={playingTrack.track}
                            className={isPlaying ? 'playing' : ''}
                        />
                    ) : (
                        <div className="ipod-np-artwork-placeholder">
                            <span>♪</span>
                        </div>
                    )}
                </div>

                <div className="ipod-np-track-info">
                    <h3 className="ipod-np-track-name">{playingTrack.track}</h3>
                    <p className="ipod-np-artist-name">{playingTrack.artist}</p>
                    {artistInfo?.funFact && (
                        <p className="ipod-np-funfact">{artistInfo.funFact}</p>
                    )}
                </div>

                <div className="ipod-np-progress">
                    <div className="ipod-np-progress-bar">
                        <div 
                            className="ipod-np-progress-fill" 
                            ref={progressFillRef}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="ipod-np-time">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(playingTrack.duration)}</span>
                    </div>
                </div>

                <div className="ipod-np-controls">
                    <button className="ipod-np-ctrl prev" onClick={prevTrack}>
                        <svg viewBox="0 0 24 24" width="32" height="32">
                            <path fill="currentColor" d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                        </svg>
                    </button>
                    <button className="ipod-np-ctrl play" onClick={togglePlayback}>
                        {isPlaying ? (
                            <svg viewBox="0 0 24 24" width="48" height="48">
                                <path fill="currentColor" d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="48" height="48">
                                <path fill="currentColor" d="M8 5v14l11-7z"/>
                            </svg>
                        )}
                    </button>
                    <button className="ipod-np-ctrl next" onClick={nextTrack}>
                        <svg viewBox="0 0 24 24" width="32" height="32">
                            <path fill="currentColor" d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                        </svg>
                    </button>
                </div>

                {playingTrack.spotifyLink && (
                    <a 
                        href={playingTrack.spotifyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ipod-np-spotify-link"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                        Open in Spotify
                    </a>
                )}
            </div>
        );
    };

    return (
        <div className="ipod-section">
            <div className="ipod-container">
                <div className="ipod-hold-switch"></div>
                
                <div className="ipod-screen">
                    <div className="ipod-screen-content">
                        {ipodView === 'genres' && renderGenresView()}
                        {ipodView === 'playlist' && renderPlaylistView()}
                    </div>
                </div>
                
                <div className="ipod-wheel-container">
                    <div className="ipod-wheel">
                        <button 
                            className="wheel-button volume-up-btn" 
                            onClick={() => handleVolumeChange('up')}
                            aria-label="Volume up" 
                            tabIndex="0"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                            </svg>
                        </button>
                        
                        <button 
                            className="wheel-button prev-btn" 
                            onClick={ipodView === 'genres' ? null : (nowPlayingExpanded ? prevTrack : handleBack)}
                            aria-label={nowPlayingExpanded ? "Previous track" : "Back"}
                            tabIndex="0"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                <path fill="currentColor" d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
                            </svg>
                        </button>
                        
                        <button 
                            className="wheel-button center-btn" 
                            onClick={playingTrack ? togglePlayback : null}
                            aria-label="Play/Pause track" 
                            tabIndex="0"
                        >
                            <svg className="play-icon" viewBox="0 0 24 24" width="20" height="20" style={{ display: isPlaying ? 'none' : 'block' }} aria-hidden="true">
                                <path fill="currentColor" d="M8 5v14l11-7z"/>
                            </svg>
                            <svg className="pause-icon" viewBox="0 0 24 24" width="20" height="20" style={{ display: isPlaying ? 'block' : 'none' }} aria-hidden="true">
                                <path fill="currentColor" d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                            </svg>
                        </button>
                        
                        <button 
                            className="wheel-button next-btn" 
                            onClick={playingTrack ? nextTrack : null}
                            aria-label="Next track" 
                            tabIndex="0"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                <path fill="currentColor" d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
                            </svg>
                        </button>
                        
                        <button 
                            className="wheel-button volume-down-btn" 
                            onClick={() => handleVolumeChange('down')}
                            aria-label="Volume down" 
                            tabIndex="0"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                <path fill="currentColor" d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* iOS Volume Toast */}
            {showVolumeToast && (
                <div className="ios-volume-toast">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                    </svg>
                    <span>Use device volume buttons</span>
                </div>
            )}
        </div>
    );
};

export default IPod;
