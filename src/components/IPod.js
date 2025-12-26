import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { usePlayer } from '../hooks/usePlayer';
import { formatTime } from '../utils/formatTime';

const IPod = () => {
    const {
        currentPlaylist,
        currentTrackIndex,
        isPlaying,
        currentTime,
        setCurrentTime
    } = useApp();

    const { playTrack, togglePlayback, nextTrack, prevTrack, volumeUp, volumeDown } = usePlayer();
    const progressFillRef = useRef(null);
    const currentProgressRef = useRef(null);
    const totalDurationRef = useRef(null);
    const trackNameRef = useRef(null);
    const artistNameRef = useRef(null);
    const albumArtRef = useRef(null);
    const playlistRef = useRef(null);
    const playlistCountRef = useRef(null);
    const intervalRef = useRef(null);

    const currentTrack = currentPlaylist[currentTrackIndex];

    useEffect(() => {
        if (currentTrack) {
            if (trackNameRef.current) trackNameRef.current.textContent = currentTrack.track;
            if (artistNameRef.current) artistNameRef.current.textContent = currentTrack.artist;
            
            if (albumArtRef.current) {
                const placeholder = albumArtRef.current.querySelector('.album-placeholder');
                
                // Always show album art (YouTube player is hidden)
                if (currentTrack.albumArt && currentTrack.albumArt !== '') {
                    albumArtRef.current.style.backgroundImage = `url("${currentTrack.albumArt}")`;
                    albumArtRef.current.style.backgroundSize = 'cover';
                    albumArtRef.current.style.backgroundPosition = 'center';
                    if (placeholder) placeholder.style.display = 'none';
                } else {
                    albumArtRef.current.style.backgroundImage = 'none';
                    if (placeholder) placeholder.style.display = 'flex';
                }
            }
            
            if (totalDurationRef.current) {
                totalDurationRef.current.textContent = formatTime(currentTrack.duration);
            }
        } else {
            if (trackNameRef.current) trackNameRef.current.textContent = 'No track selected';
            if (artistNameRef.current) artistNameRef.current.textContent = 'Select a genre to begin';
            if (albumArtRef.current) {
                albumArtRef.current.style.backgroundImage = 'none';
                const placeholder = albumArtRef.current.querySelector('.album-placeholder');
                if (placeholder) placeholder.style.display = 'flex';
            }
            if (totalDurationRef.current) totalDurationRef.current.textContent = '0:00';
        }
    }, [currentTrack, isPlaying]);

    useEffect(() => {
        if (isPlaying && currentTrack) {
            intervalRef.current = setInterval(() => {
                setCurrentTime(prev => {
                    const newTime = prev + 1;
                    if (newTime >= currentTrack.duration) {
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
    }, [isPlaying, currentTrack, nextTrack, setCurrentTime]);

    useEffect(() => {
        if (currentTrack && progressFillRef.current && currentProgressRef.current) {
            const progress = (currentTime / currentTrack.duration) * 100;
            progressFillRef.current.style.width = `${progress}%`;
            currentProgressRef.current.textContent = formatTime(currentTime);
        } else {
            if (progressFillRef.current) progressFillRef.current.style.width = '0%';
            if (currentProgressRef.current) currentProgressRef.current.textContent = '0:00';
        }
    }, [currentTime, currentTrack]);

    useEffect(() => {
        if (playlistRef.current && currentTrackIndex >= 0) {
            const items = playlistRef.current.querySelectorAll('.tracklist-item');
            items.forEach((item, i) => {
                item.classList.toggle('active', i === currentTrackIndex);
            });
        }
    }, [currentTrackIndex]);

    useEffect(() => {
        if (playlistCountRef.current) {
            playlistCountRef.current.textContent = `${currentPlaylist.length} track${currentPlaylist.length !== 1 ? 's' : ''}`;
        }
    }, [currentPlaylist.length]);

    const renderPlaylist = () => {
        if (currentPlaylist.length === 0) {
            return (
                <div className="tracklist-empty">
                    <div className="empty-icon">🎵</div>
                    <p>Select a genre to start</p>
                    <span className="empty-hint">Click any mood blob above</span>
                </div>
            );
        }

        return currentPlaylist.map((track, index) => (
            <div
                key={index}
                className={`tracklist-item ${index === currentTrackIndex ? 'active' : ''}`}
                data-index={index}
                role="button"
                tabIndex="0"
                aria-label={`Play ${track.track} by ${track.artist}`}
                onClick={() => playTrack(index)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        playTrack(index);
                    }
                }}
            >
                <div className="tracklist-item-info">
                    <div className="tracklist-item-track">{track.track}</div>
                    <div className="tracklist-item-artist">{track.artist}</div>
                </div>
                <div className="tracklist-item-duration">{formatTime(track.duration)}</div>
            </div>
        ));
    };

    return (
        <div className="ipod-section">
            <div className="ipod-container">
                <div className="ipod-hold-switch"></div>
                
                <div className="ipod-screen">
                    <div className="ipod-screen-content">
                        <div className="ipod-track-info">
                            <div className="track-name" ref={trackNameRef} aria-live="polite" aria-atomic="true">
                                No track selected
                            </div>
                            <div className="artist-name" ref={artistNameRef} aria-live="polite" aria-atomic="true">
                                Select a genre to begin
                            </div>
                        </div>
                        
                        <div className="album-art-container">
                            <div className="album-art-background" ref={albumArtRef} role="img" aria-label="Album artwork">
                                {/* <div id="youtube-player" className="youtube-player-background"></div> */}
                                <div className="album-placeholder">
                                    <div className="music-icon" aria-hidden="true">♪</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="progress-container" role="progressbar" aria-valuenow={currentTime} aria-valuemin="0" aria-valuemax={currentTrack?.duration || 100} aria-label="Track progress">
                            <div className="progress-time-left" ref={currentProgressRef} aria-hidden="true">0:00</div>
                            <div className="progress-bar-wrapper">
                                <div className="progress-bar">
                                    <div className="progress-fill" ref={progressFillRef}></div>
                                </div>
                            </div>
                            <div className="progress-time-right" ref={totalDurationRef} aria-hidden="true">0:00</div>
                        </div>
                        
                        <div className="tracklist-container">
                            <div className="tracklist-header">
                                <span className="tracklist-title">Playlist</span>
                                <span className="tracklist-count" ref={playlistCountRef}>0 tracks</span>
                            </div>
                            <div className="tracklist" ref={playlistRef}>
                                {renderPlaylist()}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="ipod-wheel-container">
                    <div className="ipod-wheel">
                        <button 
                            className="wheel-button volume-up-btn" 
                            onClick={volumeUp}
                            aria-label="Volume up" 
                            tabIndex="0"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                            </svg>
                        </button>
                        
                        <button 
                            className="wheel-button prev-btn" 
                            onClick={prevTrack}
                            aria-label="Previous track" 
                            tabIndex="0"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                <path fill="currentColor" d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
                                <path fill="currentColor" d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" transform="translate(-5, 0)"/>
                            </svg>
                        </button>
                        
                        <button 
                            className="wheel-button center-btn" 
                            onClick={togglePlayback}
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
                            onClick={nextTrack}
                            aria-label="Next track" 
                            tabIndex="0"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                <path fill="currentColor" d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
                                <path fill="currentColor" d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" transform="translate(5, 0)"/>
                            </svg>
                        </button>
                        
                        <button 
                            className="wheel-button volume-down-btn" 
                            onClick={volumeDown}
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
        </div>
    );
};

export default IPod;
