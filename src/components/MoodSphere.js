import React, { useEffect, useState } from 'react';
import { genres } from '../constants/genres';
import { playlistData } from '../constants/playlistData';
import { useApp } from '../context/AppContext';

const MoodSphere = () => {
    const { currentGenre, setCurrentGenre, setCurrentPlaylist, setCurrentTrackIndex, setShowMiniPlayer } = useApp();
    const [selectedGenreName, setSelectedGenreName] = useState('SELECT');

    const selectGenre = (genreId) => {
        setCurrentGenre(genreId);
        const genre = genres.find(g => g.id === genreId);
        setSelectedGenreName(genre.name);
        
        // Generate playlist
        const playlist = playlistData[genreId] || [];
        setCurrentPlaylist(playlist);
        setCurrentTrackIndex(-1);
        setShowMiniPlayer(false);
    };

    const clearSelection = () => {
        setCurrentGenre(null);
        setCurrentPlaylist([]);
        setCurrentTrackIndex(-1);
        setSelectedGenreName('SELECT');
        setShowMiniPlayer(false);
    };

    return (
        <div className="mood-section">
            <div className="mood-sphere-wrapper">
                <div className="mood-sphere-container">
                    <div className="gradient-blobs-container">
                        {genres.map((genre, index) => {
                            const angle = (genre.angle * Math.PI) / 180;
                            const centerX = 50;
                            const centerY = 50;
                            const radius = 35;
                            const x = centerX + radius * Math.cos(angle);
                            const y = centerY + radius * Math.sin(angle);
                            
                            return (
                                <button
                                    key={genre.id}
                                    className={`genre-blob ${currentGenre === genre.id ? 'active' : ''}`}
                                    data-genre={genre.id}
                                    data-index={index}
                                    aria-label={`Select ${genre.name} genre: ${genre.description || genre.name}`}
                                    role="button"
                                    tabIndex="0"
                                    style={{
                                        top: `${y}%`,
                                        left: `${x}%`,
                                        width: `${genre.size}px`,
                                        height: `${genre.size}px`,
                                        animationDelay: `${index * 0.05}s`
                                    }}
                                    onClick={() => selectGenre(genre.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            selectGenre(genre.id);
                                        }
                                    }}
                                >
                                    <div 
                                        className="gradient-blob-bg"
                                        style={{ background: genre.gradient }}
                                        aria-hidden="true"
                                    />
                                    <div className="genre-blob-label" aria-hidden="true">
                                        {genre.name}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    
                    <div 
                        className="sphere-center"
                        onClick={clearSelection}
                        role="button"
                        aria-label="Clear selection"
                        tabIndex="0"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                clearSelection();
                            }
                        }}
                    >
                        <div className="sphere-center-content">
                            <span className="center-text">{selectedGenreName}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MoodSphere;
