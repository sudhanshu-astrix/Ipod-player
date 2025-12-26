import React from 'react';
import { useApp } from '../context/AppContext';
import { usePlayer } from '../hooks/usePlayer';

const MiniPlayer = ({ showContent, setShowContent, contentRef }) => {
    const { currentPlaylist, currentTrackIndex, isPlaying } = useApp();
    const { togglePlayback, prevTrack, nextTrack } = usePlayer();

    const currentTrack = currentPlaylist[currentTrackIndex];

    if (!currentTrack) return null;

    return (
        <div className="mini-player" style={{ display: 'flex' }}>
            <button 
                className="mini-player-toggle" 
                id="miniPlayerToggle"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowContent(!showContent);
                }}
                aria-label="Toggle mini player"
            >
                <div className="mini-player-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                </div>
                {isPlaying && (
                    <div className="floating-notes" style={{ display: 'block' }}>
                        <span className="note">♪</span>
                        <span className="note">♫</span>
                        <span className="note">♪</span>
                    </div>
                )}
            </button>
            <div 
                ref={contentRef}
                className={`mini-player-content ${showContent ? 'show' : ''}`}
            >
                <div className="mini-player-info">
                    <div className="mini-player-track">{currentTrack.track}</div>
                    <div className="mini-player-artist">{currentTrack.artist}</div>
                </div>
                <div className="mini-player-controls">
                    <button 
                        className="mini-control-btn prev-mini" 
                        onClick={(e) => {
                            e.stopPropagation();
                            prevTrack();
                        }}
                        aria-label="Previous track"
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                        </svg>
                    </button>
                    <button 
                        className="mini-control-btn play-mini" 
                        onClick={(e) => {
                            e.stopPropagation();
                            togglePlayback();
                        }}
                        aria-label="Play/Pause"
                    >
                        <svg className="mini-play-icon" viewBox="0 0 24 24" width="18" height="18" style={{ display: isPlaying ? 'none' : 'block' }}>
                            <path fill="currentColor" d="M8 5v14l11-7z"/>
                        </svg>
                        <svg className="mini-pause-icon" viewBox="0 0 24 24" width="18" height="18" style={{ display: isPlaying ? 'block' : 'none' }}>
                            <path fill="currentColor" d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                        </svg>
                    </button>
                    <button 
                        className="mini-control-btn next-mini" 
                        onClick={(e) => {
                            e.stopPropagation();
                            nextTrack();
                        }}
                        aria-label="Next track"
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MiniPlayer;
