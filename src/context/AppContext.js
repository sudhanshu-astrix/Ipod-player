import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });
    
    const [currentGenre, setCurrentGenre] = useState(null);
    const [currentPlaylist, setCurrentPlaylist] = useState([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(100);
    const [showArtistsOverlay, setShowArtistsOverlay] = useState(false);
    const [showMiniPlayer, setShowMiniPlayer] = useState(false);
    const [showMiniPlayerContent, setShowMiniPlayerContent] = useState(false);

    useEffect(() => {
        document.body.classList.toggle('light-theme', theme === 'light');
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <AppContext.Provider value={{
            theme,
            toggleTheme,
            currentGenre,
            setCurrentGenre,
            currentPlaylist,
            setCurrentPlaylist,
            currentTrackIndex,
            setCurrentTrackIndex,
            isPlaying,
            setIsPlaying,
            currentTime,
            setCurrentTime,
            volume,
            setVolume,
            showArtistsOverlay,
            setShowArtistsOverlay,
            showMiniPlayer,
            setShowMiniPlayer,
            showMiniPlayerContent,
            setShowMiniPlayerContent
        }}>
            {children}
        </AppContext.Provider>
    );
};
