import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { genres } from '../constants/genres';
import { playlistData, ArtistData } from '../constants/playlistData';

const ArtistsOverlay = () => {
    const { showArtistsOverlay, setShowArtistsOverlay } = useApp();
    const [selectedGenre, setSelectedGenre] = useState(genres[0]?.id || 'rock');
    const [flippedCards, setFlippedCards] = useState(new Set());
    const [cardOrder, setCardOrder] = useState([]); // Track card order for stack
    const [currentCardIndex, setCurrentCardIndex] = useState(0); // For carousel navigation
    const [isStackExpanded, setIsStackExpanded] = useState(false); // For stack fan-out effect
    const [mobilePopupArtist, setMobilePopupArtist] = useState(null); // For mobile popup
    const deckStackRef = useRef(null);
    const activeCardRef = useRef(null);
    const carouselRef = useRef(null);
    const dragState = useRef({ 
        isDragging: false, 
        startX: 0, 
        startY: 0, 
        currentX: 0, 
        currentY: 0, 
        hasMoved: false,
        velocity: { x: 0, y: 0 },
        lastTime: 0,
        lastX: 0,
        lastY: 0
    });
    const clickTimeoutRef = useRef(null);
    const animationFrameRef = useRef(null);

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
    const filteredArtists = allArtists.filter(artist => artist.genre === selectedGenre);
    
    // Initialize card order when genre changes
    useEffect(() => {
        setCardOrder(filteredArtists.map((_, i) => i));
        setFlippedCards(new Set());
        setCurrentCardIndex(0);
        setIsStackExpanded(false);
    }, [selectedGenre, filteredArtists.length]);
    
    // Navigation functions for carousel
    const goToNextCard = useCallback(() => {
        if (filteredArtists.length > 0) {
            setCurrentCardIndex(prev => (prev + 1) % filteredArtists.length);
        }
    }, [filteredArtists.length]);
    
    const goToPrevCard = useCallback(() => {
        if (filteredArtists.length > 0) {
            setCurrentCardIndex(prev => (prev - 1 + filteredArtists.length) % filteredArtists.length);
        }
    }, [filteredArtists.length]);
    
    // Get current artist for center display (desktop carousel)
    const currentArtist = filteredArtists[currentCardIndex];
    
    // Get ordered artists based on card order
    const getOrderedArtists = useCallback(() => {
        if (cardOrder.length !== filteredArtists.length) {
            return filteredArtists;
        }
        return cardOrder.map(index => filteredArtists[index]);
    }, [cardOrder, filteredArtists]);
    
    // Get the top card artist for mobile stack (last item in ordered array)
    const orderedArtists = getOrderedArtists();
    const topStackArtist = orderedArtists.length > 0 ? orderedArtists[orderedArtists.length - 1] : null;

    // Handle card click - only for dragging, no flip
    const handleCardClick = (artistName, e) => {
        // Don't do anything if we just dragged
        if (dragState.current.hasMoved) {
            dragState.current.hasMoved = false;
            return;
        }
    };
    
    // Flip card to show back side (triggered by arrow button) - Desktop only
    const flipCardToBack = (artistName, e) => {
        e.stopPropagation();
        setFlippedCards(prev => {
            const newSet = new Set(prev);
            newSet.add(artistName);
            return newSet;
        });
    };
    
    // Show popup with artist info (triggered by arrow button) - Mobile only
    const showMobilePopup = (artist, e) => {
        e.stopPropagation();
        setMobilePopupArtist(artist);
    };
    
    // Close mobile popup
    const closeMobilePopup = () => {
        setMobilePopupArtist(null);
    };
    
    // Flip card back to front (triggered by clicking back side)
    const flipCardToFront = (artistName, e) => {
        e.stopPropagation();
        setFlippedCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(artistName);
            return newSet;
        });
    };
    
    // Get artist data for back side info
    const getArtistBackInfo = (artist) => {
        const artistData = ArtistData[artist.name];
        return {
            photo: artistData?.photo || artist.albumArt || 'https://via.placeholder.com/100/333/fff?text=Artist',
            funFact: artistData?.funFact || getFunFact(artist),
            youtubeLink: artistData?.youtubeLink || getYouTubeUrl(artist)
        };
    };

    // Move top card to back of stack
    const moveCardToBack = useCallback(() => {
        if (cardOrder.length <= 1) return;
        
        setCardOrder(prev => {
            const newOrder = [...prev];
            const topCard = newOrder.pop(); // Remove last (top) card
            newOrder.unshift(topCard); // Add to beginning (back)
            return newOrder;
        });
    }, [cardOrder.length]);

    // Handle drag start - works on entire top card
    const handleDragStart = useCallback((e, artistName, isTopCard) => {
        // Only allow dragging the top card
        if (!isTopCard) return;
        
        // Don't start drag if card is flipped
        if (flippedCards.has(artistName)) return;
        
        // Prevent default to stop text selection and scrolling
        if (e.type === 'touchstart') {
            // Don't prevent default here to allow click events
        }
        
        const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
        const now = Date.now();
        
        dragState.current = {
            isDragging: true,
            startX: clientX,
            startY: clientY,
            currentX: 0,
            currentY: 0,
            hasMoved: false,
            velocity: { x: 0, y: 0 },
            lastTime: now,
            lastX: clientX,
            lastY: clientY
        };
        
        activeCardRef.current = e.currentTarget;
        if (activeCardRef.current) {
            activeCardRef.current.style.transition = 'none';
            activeCardRef.current.style.cursor = 'grabbing';
            activeCardRef.current.style.zIndex = '100';
        }
    }, [flippedCards]);

    // Handle drag move with smooth animation frame
    const handleDragMove = useCallback((e) => {
        if (!dragState.current.isDragging || !activeCardRef.current) return;
        
        // Prevent scrolling while dragging
        if (e.cancelable) {
            e.preventDefault();
        }
        
        const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
        const now = Date.now();
        
        // Calculate velocity for momentum
        const dt = now - dragState.current.lastTime;
        if (dt > 0) {
            dragState.current.velocity = {
                x: (clientX - dragState.current.lastX) / dt * 16,
                y: (clientY - dragState.current.lastY) / dt * 16
            };
        }
        
        dragState.current.lastTime = now;
        dragState.current.lastX = clientX;
        dragState.current.lastY = clientY;
        
        dragState.current.currentX = clientX - dragState.current.startX;
        dragState.current.currentY = clientY - dragState.current.startY;
        
        // Mark as moved if moved more than 5px
        if (Math.abs(dragState.current.currentX) > 5 || Math.abs(dragState.current.currentY) > 5) {
            dragState.current.hasMoved = true;
            if (clickTimeoutRef.current) {
                clearTimeout(clickTimeoutRef.current);
                clickTimeoutRef.current = null;
            }
        }
        
        // Cancel any pending animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        
        // Use requestAnimationFrame for smooth animation
        animationFrameRef.current = requestAnimationFrame(() => {
            if (activeCardRef.current) {
                const rotation = dragState.current.currentX * 0.08;
                const scale = 1 - Math.min(Math.abs(dragState.current.currentX) / 1000, 0.05);
                activeCardRef.current.style.transform = `
                    translateX(${dragState.current.currentX}px) 
                    translateY(${dragState.current.currentY}px) 
                    rotateZ(${rotation}deg)
                    scale(${scale})
                `;
            }
        });
    }, []);

    // Handle drag end with momentum
    const handleDragEnd = useCallback(() => {
        if (!dragState.current.isDragging) return;
        
        const card = activeCardRef.current;
        if (!card) {
            dragState.current = { 
                isDragging: false, startX: 0, startY: 0, currentX: 0, currentY: 0, 
                hasMoved: false, velocity: { x: 0, y: 0 }, lastTime: 0, lastX: 0, lastY: 0 
            };
            return;
        }
        
        // Calculate total movement including velocity for momentum
        const totalX = dragState.current.currentX + dragState.current.velocity.x * 5;
        const totalY = dragState.current.currentY + dragState.current.velocity.y * 5;
        const threshold = 80;
        
        // If dragged far enough or has enough momentum, swipe away
        if (Math.abs(totalX) > threshold || Math.abs(totalY) > threshold) {
            // Determine swipe direction
            const angle = Math.atan2(dragState.current.currentY, dragState.current.currentX);
            const distance = 800;
            const exitX = Math.cos(angle) * distance;
            const exitY = Math.sin(angle) * distance;
            const exitRotation = dragState.current.currentX * 0.15;
            
            card.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease';
            card.style.transform = `translateX(${exitX}px) translateY(${exitY}px) rotateZ(${exitRotation}deg) scale(0.8)`;
            card.style.opacity = '0';
            
            setTimeout(() => {
                // Reset card styles
                card.style.transition = '';
                card.style.transform = '';
                card.style.opacity = '';
                card.style.cursor = '';
                card.style.zIndex = '';
                
                // Move to back of stack via state
                moveCardToBack();
            }, 400);
        } else {
            // Snap back with spring animation
            card.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            card.style.transform = '';
            card.style.cursor = '';
            
            setTimeout(() => {
                if (card) {
                    card.style.transition = '';
                    card.style.zIndex = '';
                }
            }, 400);
        }
        
        activeCardRef.current = null;
        dragState.current = { 
            isDragging: false, startX: 0, startY: 0, currentX: 0, currentY: 0, 
            hasMoved: false, velocity: { x: 0, y: 0 }, lastTime: 0, lastX: 0, lastY: 0 
        };
    }, [moveCardToBack]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (clickTimeoutRef.current) {
                clearTimeout(clickTimeoutRef.current);
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
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
    }, [showArtistsOverlay, handleDragMove, handleDragEnd]);

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
                    {/* Header */}
                    <div className="artists-header">
                        <button 
                            className="back-to-player" 
                            onClick={() => setShowArtistsOverlay(false)}
                            aria-label="Back to player"
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            <span>Back to Player</span>
                        </button>
                        <button className="reach-out-btn-overlay">
                            Reach Out
                        </button>
                    </div>

                    <div className="dashed-separator-overlay"></div>
                    
                    {/* Genre Filters */}
                    <div className="artists-filters">
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
                    
                    {/* Background Artist Name Text - Desktop */}
                    {currentArtist && (
                        <div className="artist-bg-text desktop-only">
                            {currentArtist.name.toUpperCase()}
                        </div>
                    )}
                    
                    {/* Background Artist Name Text - Mobile (follows stack top card) */}
                    {topStackArtist && (
                        <div className="artist-bg-text mobile-only">
                            {topStackArtist.name.toUpperCase()}
                        </div>
                    )}
                    
                    {/* Card Deck Container - CD Case Style */}
                    <div className="deck-wrapper">
                        <div className="deck-container" ref={carouselRef}>
                            {filteredArtists.length === 0 ? (
                                <div className="no-artists">
                                    <div className="no-artists-icon">🎵</div>
                                    <p>No artists found for this genre.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop Carousel View */}
                                    <div className="carousel-container desktop-only">
                                        {/* Left side cards */}
                                        <div className="carousel-side carousel-left">
                                            {filteredArtists.slice(0, currentCardIndex).slice(-2).map((artist, idx) => (
                                                <div 
                                                    key={artist.name} 
                                                    className="carousel-side-card"
                                                    onClick={() => setCurrentCardIndex(filteredArtists.indexOf(artist))}
                                                >
                                                    <img 
                                                        src={artist.albumArt || 'https://via.placeholder.com/150x150/333/fff?text=Artist'} 
                                                        alt={artist.name}
                                                        loading="lazy"
                                                    />
                                                    <div className="carousel-side-info">
                                                        <span className="carousel-side-name">{artist.name}</span>
                                                        <button className="carousel-side-arrow">
                                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                                <polyline points="12 5 19 12 12 19"></polyline>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Center CD Case */}
                                        {currentArtist && (() => {
                                            const backInfo = getArtistBackInfo(currentArtist);
                                            return (
                                            <div className="cd-case-container">
                                                <div 
                                                    className={`cd-case ${flippedCards.has(currentArtist.name) ? 'flipped' : ''}`}
                                                    onMouseDown={(e) => handleDragStart(e, currentArtist.name, true)}
                                                    onTouchStart={(e) => handleDragStart(e, currentArtist.name, true)}
                                                    ref={activeCardRef}
                                                >
                                                    <div className="cd-case-front">
                                                        <div className="cd-case-cover">
                                                            <img 
                                                                src={currentArtist.albumArt || 'https://via.placeholder.com/320x320/333/fff?text=Artist'} 
                                                                alt={currentArtist.name}
                                                                draggable="false"
                                                            />
                                                        </div>
                                                        <div className="cd-case-info">
                                                            <h2 className="cd-artist-name">{currentArtist.name.toUpperCase()}</h2>
                                                            <button 
                                                                className="cd-view-more"
                                                                onClick={(e) => flipCardToBack(currentArtist.name, e)}
                                                            >
                                                                <img src="/artist-overlay-linkbutton.png" alt="View details" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div 
                                                        className="cd-case-back"
                                                        onClick={(e) => flipCardToFront(currentArtist.name, e)}
                                                    >
                                                        <div className="cd-case-back-content">
                                                            <div className="card-back-photo">
                                                                <img 
                                                                    src={backInfo.photo} 
                                                                    alt={currentArtist.name}
                                                                />
                                                            </div>
                                                            <h3 className="card-back-name">{currentArtist.name}</h3>
                                                            <p className="card-back-funfact">{backInfo.funFact}</p>
                                                            <a 
                                                                className="card-back-youtube"
                                                                href={backInfo.youtubeLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                Watch on YouTube
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            );
                                        })()}

                                        {/* Right side cards */}
                                        <div className="carousel-side carousel-right">
                                            {filteredArtists.slice(currentCardIndex + 1, currentCardIndex + 3).map((artist, idx) => (
                                                <div 
                                                    key={artist.name} 
                                                    className="carousel-side-card"
                                                    onClick={() => setCurrentCardIndex(filteredArtists.indexOf(artist))}
                                                >
                                                    <img 
                                                        src={artist.albumArt || 'https://via.placeholder.com/150x150/333/fff?text=Artist'} 
                                                        alt={artist.name}
                                                        loading="lazy"
                                                    />
                                                    <div className="carousel-side-info">
                                                        <span className="carousel-side-name">{artist.name}</span>
                                                        <button className="carousel-side-arrow">
                                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                                <polyline points="12 5 19 12 12 19"></polyline>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Mobile Stack View */}
                                    <div 
                                        className={`deck-stack mobile-only ${isStackExpanded ? 'expanded' : ''}`} 
                                        ref={deckStackRef}
                                        onClick={() => setIsStackExpanded(!isStackExpanded)}
                                    >
                                    {getOrderedArtists().map((artist, index, arr) => {
                                        const isTopCard = index === arr.length - 1;
                                        return (
                                            <div
                                                key={artist.name}
                                                className={`cd-case-mobile ${isTopCard ? 'top-card' : ''}`}
                                                style={{ 
                                                    '--card-index': index,
                                                    cursor: isTopCard ? 'grab' : 'default'
                                                }}
                                                onClick={(e) => handleCardClick(artist.name, e)}
                                                onMouseDown={(e) => handleDragStart(e, artist.name, isTopCard)}
                                                onTouchStart={(e) => handleDragStart(e, artist.name, isTopCard)}
                                            >
                                                <div className="cd-case-mobile-front">
                                                    <div className="cd-case-cover">
                                                        <img 
                                                            src={artist.albumArt || 'https://via.placeholder.com/320x320/333/fff?text=Artist'} 
                                                            alt={artist.name}
                                                            draggable="false"
                                                        />
                                                    </div>
                                                    <div className="cd-case-info">
                                                        <h2 className="cd-case-artist-name">{artist.name.toUpperCase()}</h2>
                                                        <button 
                                                            className="cd-case-arrow"
                                                            onClick={(e) => showMobilePopup(artist, e)}
                                                        >
                                                            <img src="/artist-overlay-linkbutton.png" alt="View details" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                </>
                            )}
                        </div>
                        {filteredArtists.length > 0 && (
                            <div className="deck-hint">Drag to browse · Click arrow for details</div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="overlay-footer">
                        <h2 className="overlay-event-title">
                            <span>LOLLAPALOOZA INDIA '26</span>
                            <span></span>
                        </h2>
                        <div className="overlay-powered-by">
                            <span>Powered by</span>
                            <img src="/astrix-logo.svg" alt="Astrix" className="astrix-logo-img" />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Mobile Artist Info Popup */}
            {mobilePopupArtist && (() => {
                const popupInfo = getArtistBackInfo(mobilePopupArtist);
                return (
                    <div 
                        className="mobile-artist-popup-overlay"
                        onClick={closeMobilePopup}
                    >
                        <div 
                            className="mobile-artist-popup"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button 
                                className="mobile-popup-close"
                                onClick={closeMobilePopup}
                                aria-label="Close popup"
                            >
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                            <div className="mobile-popup-content">
                                <div className="card-back-photo">
                                    <img 
                                        src={popupInfo.photo} 
                                        alt={mobilePopupArtist.name}
                                    />
                                </div>
                                <h3 className="card-back-name">{mobilePopupArtist.name}</h3>
                                <p className="card-back-funfact">{popupInfo.funFact}</p>
                                <a 
                                    className="card-back-youtube"
                                    href={popupInfo.youtubeLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Watch on YouTube
                                </a>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </>
    );
};

export default ArtistsOverlay;
