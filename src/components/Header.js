import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import MiniPlayer from './MiniPlayer';

const Header = () => {
    const { toggleTheme, showMiniPlayer, setShowArtistsOverlay } = useApp();
    const [showMiniContent, setShowMiniContent] = useState(false);
    const miniContentRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (miniContentRef.current && !miniContentRef.current.contains(e.target)) {
                const toggleBtn = document.getElementById('miniPlayerToggle');
                if (toggleBtn && !toggleBtn.contains(e.target)) {
                    setShowMiniContent(false);
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
                    <a href="/" className="site-logo">
                        <span className="logo-text">Lollapalooza</span>
                        <span className="logo-year">India 2026</span>
                    </a>
                </div>
                <nav className="site-nav">
                    <button 
                        className="theme-toggle" 
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                    >
                        <svg className="theme-icon sun-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                        <svg className="theme-icon moon-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                    </button>
                    <button 
                        style={{cursor: 'pointer', background: "none", border: "none"}}
                        className="nav-link" 
                        onClick={() => setShowArtistsOverlay(true)}
                        aria-label="Open artists page"
                    >
                        Artists
                    </button>
                    {showMiniPlayer && (
                        <MiniPlayer 
                            showContent={showMiniContent}
                            setShowContent={setShowMiniContent}
                            contentRef={miniContentRef}
                        />
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
