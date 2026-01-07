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
    
    // Browsing state - changes when navigating playlists
    const [currentGenre, setCurrentGenre] = useState(null);
    const [currentPlaylist, setCurrentPlaylist] = useState([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
    
    // Playing state - only changes when a track is explicitly played
    const [playingTrack, setPlayingTrack] = useState(null);
    const [playingGenre, setPlayingGenre] = useState(null);
    const [playingPlaylist, setPlayingPlaylist] = useState([]);
    const [playingTrackIndex, setPlayingTrackIndex] = useState(-1);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(100);
    const [showArtistsOverlay, setShowArtistsOverlay] = useState(false);
    const [showMiniPlayer, setShowMiniPlayer] = useState(false);
    const [showMiniPlayerContent, setShowMiniPlayerContent] = useState(false);

    // iPod screen view states: 'genres', 'playlist', 'nowPlaying'
    const [ipodView, setIpodView] = useState('genres');
    // Track if now playing is expanded (full screen) or minimized (bottom bar)
    const [nowPlayingExpanded, setNowPlayingExpanded] = useState(false);

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
            // Browsing state
            currentGenre,
            setCurrentGenre,
            currentPlaylist,
            setCurrentPlaylist,
            currentTrackIndex,
            setCurrentTrackIndex,
            // Playing state
            playingTrack,
            setPlayingTrack,
            playingGenre,
            setPlayingGenre,
            playingPlaylist,
            setPlayingPlaylist,
            playingTrackIndex,
            setPlayingTrackIndex,
            // Playback state
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
            setShowMiniPlayerContent,
            ipodView,
            setIpodView,
            nowPlayingExpanded,
            setNowPlayingExpanded
        }}>
            {children}
        </AppContext.Provider>
    );
};
