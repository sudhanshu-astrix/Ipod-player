import React, { useEffect } from 'react';
import { ArtistData } from '../constants/playlistData';

const ArtistCardModal = ({ artist, isOpen, onClose, getFunFact, getYouTubeUrl }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen || !artist) return null;

    // Match artist name with ArtistData object key
    const artistData = ArtistData[artist.name];
    
    // Use data from ArtistData if available, otherwise fall back to props or defaults
    const artistPhoto = artistData?.photo || artist.albumArt || 'https://via.placeholder.com/100/333/fff?text=Artist';
    const artistFunFact = artistData?.funFact || (getFunFact ? getFunFact(artist) : `${artist.name} is featured in our ${artist.genreName || ''} playlist.`);
    const artistYouTubeLink = artistData?.youtubeLink || (getYouTubeUrl ? getYouTubeUrl(artist) : `https://www.youtube.com/results?search_query=${encodeURIComponent(artist.name)}`);

    return (
        <div 
            className={`artist-card-modal ${isOpen ? 'active' : ''}`}
            onClick={(e) => {
                if (e.target.classList.contains('artist-card-modal')) {
                    onClose();
                }
            }}
        >
            <div className="artist-card" id="artistCard">
                {/* Window Controls */}
                <div className="artist-card-controls">
                    {/* <button className="window-control minimize" aria-label="Minimize"></button>
                    <button className="window-control maximize" aria-label="Maximize"></button> */}
                    <button 
                        className="window-control close" 
                        onClick={onClose}
                        aria-label="Close"
                    ></button>
                </div>
                
                <div className="artist-card-content">
                    {/* Top Section: Photo + Name */}
                    <div className="artist-card-top">
                        <div className="artist-card-photo">
                            <img 
                                id="artistCardPhoto" 
                                src={artistPhoto} 
                                alt={artist.name}
                            />
                        </div>
                        <div className="artist-card-name" id="artistCardName">
                            {artist.name}
                        </div>
                    </div>
                    
                    {/* Middle Section: Fun Fact */}
                    <div className="artist-card-funfact" id="artistCardFunFact">
                        {artistFunFact}
                    </div>
                    
                    {/* Bottom Section: YouTube Link */}
                    <div className="artist-card-youtube">
                        <a 
                            id="artistCardYoutube" 
                            href={artistYouTubeLink}
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
};

export default ArtistCardModal;

