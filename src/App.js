import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import IPod from './components/IPod';
import ArtistsOverlay from './components/ArtistsOverlay';
import { usePlayer } from './hooks/usePlayer';

const AppContent = () => {
    // Use playingTrack to determine if mini player should show
    const { playingTrack, setShowMiniPlayer } = useApp();
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
            <div className="container ipod-only">
                <main className="main-content">
                    <IPod />
                </main>
            </div>
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
