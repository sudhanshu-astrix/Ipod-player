import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { genres } from '../constants/genres';
import { playlistData } from '../constants/playlistData';
import ArtistCardModal from './ArtistCardModal';

const ArtistsOverlay = () => {
    const { showArtistsOverlay, setShowArtistsOverlay } = useApp();
    const [selectedGenre, setSelectedGenre] = useState('all');
    const [flippedCards, setFlippedCards] = useState(new Set());
    const [selectedArtist, setSelectedArtist] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const deckStackRef = useRef(null);
    const dragState = useRef({ isDragging: false, startX: 0, startY: 0, currentX: 0, currentY: 0, hasMoved: false });
    const clickTimeoutRef = useRef(null);

    // Get unique artists with their genres
    const getUniqueArtists = () => {
        const artistsMap = new Map();
        
        Object.entries(playlistData).forEach(([genreId, tracks]) => {
            tracks.forEach(track => {
                const artistName = track.artist;
                if (!artistsMap.has(artistName)) {
                    const genre = genres.find(g => g.id === genreId);
                    artistsMap.set(artistName, {
                        name: artistName,
                        genre: genreId,
                        genreName: genre ? genre.name : '',
                        genreColor: genre ? genre.color : '#666',
                        albumArt: track.albumArt,
                        tracks: []
                    });
                }
                artistsMap.get(artistName).tracks.push(track);
            });
        });
        
        return Array.from(artistsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    };

    const allArtists = getUniqueArtists();
    
    // Filter artists by selected genre
    const filteredArtists = selectedGenre === 'all' 
        ? allArtists 
        : allArtists.filter(artist => artist.genre === selectedGenre);

    // Handle card flip
    const handleCardClick = (artistName, e) => {
        // Don't flip if we just dragged
        if (dragState.current.hasMoved) {
            dragState.current.hasMoved = false;
            return;
        }

        // Check if it's a double click
        if (e.detail === 2) {
            const artist = allArtists.find(a => a.name === artistName);
            if (artist) {
                setSelectedArtist(artist);
                setShowModal(true);
            }
            return;
        }

        // Single click - flip card (with slight delay to detect double click)
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
        }
        
        clickTimeoutRef.current = setTimeout(() => {
            setFlippedCards(prev => {
                const newSet = new Set(prev);
                if (newSet.has(artistName)) {
                    newSet.delete(artistName);
                } else {
                    newSet.add(artistName);
                }
                return newSet;
            });
        }, 200);
    };

    // Handle drag start
    const handleDragStart = (e, artistName) => {
        const card = e.currentTarget;
        const deckStack = deckStackRef.current;
        if (!card || !deckStack || card !== deckStack.lastElementChild) return;
        
        // Don't start drag if card is flipped
        if (flippedCards.has(artistName)) return;
        
        dragState.current = {
            isDragging: true,
            startX: e.clientX || e.touches?.[0]?.clientX || 0,
            startY: e.clientY || e.touches?.[0]?.clientY || 0,
            currentX: 0,
            currentY: 0,
            hasMoved: false
        };
        card.style.transition = 'none';
        card.style.cursor = 'grabbing';
    };

    // Handle drag move
    const handleDragMove = (e) => {
        if (!dragState.current.isDragging) return;
        
        const currentX = e.clientX || e.touches?.[0]?.clientX || 0;
        const currentY = e.clientY || e.touches?.[0]?.clientY || 0;
        
        dragState.current.currentX = currentX - dragState.current.startX;
        dragState.current.currentY = currentY - dragState.current.startY;
        
        // Mark as moved if moved more than 5px
        if (Math.abs(dragState.current.currentX) > 5 || Math.abs(dragState.current.currentY) > 5) {
            dragState.current.hasMoved = true;
            if (clickTimeoutRef.current) {
                clearTimeout(clickTimeoutRef.current);
                clickTimeoutRef.current = null;
            }
        }
        
        const deckStack = deckStackRef.current;
        if (deckStack && deckStack.lastElementChild) {
            const topCard = deckStack.lastElementChild;
            const rotation = dragState.current.currentX * 0.1;
            topCard.style.transform = `translateX(${dragState.current.currentX}px) translateY(${dragState.current.currentY}px) rotateZ(${rotation}deg)`;
        }
    };

    // Handle drag end
    const handleDragEnd = () => {
        if (!dragState.current.isDragging) return;
        
        const deckStack = deckStackRef.current;
        if (deckStack && deckStack.lastElementChild) {
            const topCard = deckStack.lastElementChild;
            const threshold = 100;
            
            // If dragged far enough, move card to back
            if (Math.abs(dragState.current.currentX) > threshold || Math.abs(dragState.current.currentY) > threshold) {
                topCard.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                topCard.style.transform = 'translateX(-500px) translateY(500px) rotateZ(-45deg)';
                topCard.style.opacity = '0';
                
                setTimeout(() => {
                    deckStack.insertBefore(topCard, deckStack.firstChild);
                    topCard.style.transition = '';
                    topCard.style.transform = '';
                    topCard.style.opacity = '';
                    topCard.style.cursor = '';
                }, 500);
            } else {
                // Snap back
                topCard.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                topCard.style.transform = '';
                topCard.style.cursor = '';
                
                setTimeout(() => {
                    topCard.style.transition = '';
                }, 300);
            }
        }
        
        dragState.current = { isDragging: false, startX: 0, startY: 0, currentX: 0, currentY: 0, hasMoved: false };
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (clickTimeoutRef.current) {
                clearTimeout(clickTimeoutRef.current);
            }
        };
    }, []);

    // Set up drag event listeners
    useEffect(() => {
        if (!showArtistsOverlay) return;

        const handleMouseMove = (e) => {
            if (dragState.current.isDragging) {
                handleDragMove(e);
            }
        };
        const handleMouseUp = () => {
            if (dragState.current.isDragging) {
                handleDragEnd();
            }
        };
        const handleTouchMove = (e) => {
            if (dragState.current.isDragging) {
                e.preventDefault();
                handleDragMove(e);
            }
        };
        const handleTouchEnd = () => {
            if (dragState.current.isDragging) {
                handleDragEnd();
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [showArtistsOverlay]);

    // Prevent body scroll when overlay is open
    useEffect(() => {
        if (showArtistsOverlay) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showArtistsOverlay]);

    if (!showArtistsOverlay) return null;

    // Generate fun fact for artist (placeholder - can be enhanced with real data)
    const getFunFact = (artist) => {
        return `${artist.name} is known for their unique sound in the ${artist.genreName} genre. With ${artist.tracks.length} track${artist.tracks.length !== 1 ? 's' : ''} in our playlist, they bring a distinctive style to the festival.`;
    };

    // Get YouTube URL for artist
    const getYouTubeUrl = (artist) => {
        const firstTrack = artist.tracks[0];
        if (firstTrack && firstTrack.youtubeId && firstTrack.youtubeId !== 'sample') {
            return `https://www.youtube.com/watch?v=${firstTrack.youtubeId}`;
        }
        return `https://www.youtube.com/results?search_query=${encodeURIComponent(artist.name)}`;
    };

    return (
        <>
            <div 
                className={`artists-overlay ${showArtistsOverlay ? 'active' : ''}`}
                onClick={(e) => {
                    // Close when clicking on the overlay background
                    if (e.target.classList.contains('artists-overlay')) {
                        setShowArtistsOverlay(false);
                    }
                }}
            >
                <div className="artists-container">
                    <div className="artists-header">
                        <h2 className="artists-title">Artists</h2>
                        <button 
                            className="artists-close" 
                            onClick={() => setShowArtistsOverlay(false)}
                            aria-label="Close artists"
                        >
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    
                    {/* Genre Filters */}
                    <div className="artists-filters">
                        <button 
                            className={`filter-btn ${selectedGenre === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedGenre('all')}
                            data-genre="all"
                        >
                            All
                        </button>
                        {genres.map(genre => (
                            <button
                                key={genre.id}
                                className={`filter-btn ${selectedGenre === genre.id ? 'active' : ''}`}
                                onClick={() => setSelectedGenre(genre.id)}
                                data-genre={genre.id}
                            >
                                {genre.name}
                            </button>
                        ))}
                    </div>
                    
                    {/* Card Deck Container */}
                    <div className="deck-wrapper">
                        <div className="deck-container">
                            {filteredArtists.length === 0 ? (
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '4rem 2rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎵</div>
                                    <p>No artists found for this genre.</p>
                                </div>
                            ) : (
                                <div className="deck-stack" ref={deckStackRef}>
                                    {filteredArtists.map((artist, index) => (
                                    <div
                                        key={artist.name}
                                        className={`artist-deck-card ${flippedCards.has(artist.name) ? 'flipped' : ''}`}
                                        style={{ '--card-index': index }}
                                        onClick={(e) => handleCardClick(artist.name, e)}
                                        onMouseDown={(e) => handleDragStart(e, artist.name)}
                                        onTouchStart={(e) => handleDragStart(e, artist.name)}
                                    >
                                        {/* Front of card */}
                                        <div className="artist-deck-card-front">
                                            <div className="artist-deck-photo">
                                                <img 
                                                    src={artist.albumArt || 'https://via.placeholder.com/320x450/333/fff?text=Artist'} 
                                                    alt={artist.name}
                                                    loading="lazy"
                                                />
                                            </div>
                                            <div className="artist-deck-info">
                                                <div className="artist-deck-name">{artist.name}</div>
                                                <div className="artist-deck-genre" style={{ color: artist.genreColor }}>
                                                    {artist.genreName}
                                                </div>
                                                <div className="artist-deck-flip-hint">Click to flip</div>
                                            </div>
                                        </div>
                                        
                                        {/* Back of card */}
                                        <div className="artist-deck-card-back">
                                            <div className="artist-deck-back-photo">
                                                <img 
                                                    src={artist.albumArt || 'https://via.placeholder.com/320x450/333/fff?text=Artist'} 
                                                    alt={artist.name}
                                                    loading="lazy"
                                                />
                                            </div>
                                            <div className="artist-deck-back-name">{artist.name}</div>
                                            <div className="artist-deck-back-funfact">
                                                {getFunFact(artist)}
                                            </div>
                                            <div className="artist-deck-back-youtube">
                                                <a 
                                                    href={getYouTubeUrl(artist)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Watch on YouTube
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {filteredArtists.length > 0 && (
                            <div className="deck-hint">Drag to browse • Click to flip • Double-click for details</div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Artist Card Modal */}
            {selectedArtist && (
                <ArtistCardModal
                    artist={selectedArtist}
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedArtist(null);
                    }}
                    getFunFact={getFunFact}
                    getYouTubeUrl={getYouTubeUrl}
                />
            )}
        </>
    );
};

export default ArtistsOverlay;
