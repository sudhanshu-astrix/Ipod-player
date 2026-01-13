import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import IPod from './components/IPod';
import ArtistsOverlay from './components/ArtistsOverlay';
import { usePlayer } from './hooks/usePlayer';

const AppContent = () => {
    // Use playingTrack to determine if mini player should show
    const { playingTrack, setShowMiniPlayer, setShowArtistsOverlay } = useApp();
    const { togglePlayback, nextTrack, prevTrack } = usePlayer();

    useEffect(() => {
        // Show mini player when a track is playing
        if (playingTrack) {
            setShowMiniPlayer(true);
        } else {
            setShowMiniPlayer(false);
        }
    }, [playingTrack, setShowMiniPlayer]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                togglePlayback();
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                nextTrack();
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                prevTrack();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [togglePlayback, nextTrack, prevTrack]);

    return (
        <div className="App">
            <Header />
            <div className="dashed-separator"></div>
            
            <div className="container ipod-only">
                <main className="main-content">
                    {/* Left Section - YOUR GUIDE TO */}
                    <div className="guide-section guide-section-desktop">
                        <h1 className="guide-title">
                            <span>YOUR</span>
                            <span>GUIDE TO</span>
                        </h1>
                        <p className="guide-subtitle guide-subtitle-desktop desktop-only">
                            25+ artists, 2 days, 1 perfect playlist. Pick a genre
                        </p>
                        <p className="guide-subtitle mobile-only">
                            25+ artists, 2 days, 1 perfect playlist. Pick a genre and discover the artists taking the stage at Lolla '26.
                        </p>
                        <div className="guide-arrow">
                            <img src="/down-arrows.svg" alt="Scroll down" />
                        </div>
                    </div>

                    {/* Center - iPod */}
                    <div className="ipod-section">
                        <IPod />
                    </div>

                    {/* Right Section - Event Title */}
                    <div className="event-section">
                        <h2 className="event-title">
                            <span>LOLLAPALOOZA</span>
                            <span>INDIA '26</span>
                        </h2>
                        <p className="event-description">
                            Discover the artists taking the stage at Lolla '26.
                        </p>
                    </div>
                </main>

                {/* Event Title - Mobile Only */}
                <div className="event-title-mobile">
                    <h2>
                        <span>LOLLAPALOOZA</span>
                        <span>INDIA '26</span>
                    </h2>
                </div>

                {/* Discover All Artists Button */}
                <div className="discover-btn-wrapper">
                    <button 
                        className="discover-btn"
                        onClick={() => setShowArtistsOverlay(true)}
                    >
                        <span>Discover All Artists</span>
                    </button>
                    <button 
                        className="discover-btn-arrow"
                        onClick={() => setShowArtistsOverlay(true)}
                        aria-label="Discover Artists"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Footer */}
            <footer className="site-footer">
                <span>Powered by</span>
                <img src="/astrix-logo.svg" alt="Astrix" className="astrix-logo-img" />
            </footer>

            <ArtistsOverlay />
        </div>
    );
};

const App = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;
