/**
 * Shuffles a playlist to ensure variety by distributing tracks from the same artist
 * throughout the playlist instead of keeping them grouped together.
 * 
 * Algorithm:
 * 1. Group tracks by artist
 * 2. Shuffle each artist's tracks
 * 3. Distribute tracks round-robin style to avoid consecutive tracks from same artist
 * 
 * @param {Array} tracks - Array of track objects with artist property
 * @returns {Array} - Shuffled array with artist variety
 */
export function shufflePlaylistWithVariety(tracks) {
    if (!tracks || tracks.length === 0) return [];
    
    // Group tracks by artist
    const artistGroups = {};
    tracks.forEach(track => {
        const artist = track.artist;
        if (!artistGroups[artist]) {
            artistGroups[artist] = [];
        }
        artistGroups[artist].push(track);
    });
    
    // Shuffle tracks within each artist group
    Object.keys(artistGroups).forEach(artist => {
        artistGroups[artist] = shuffleArray(artistGroups[artist]);
    });
    
    // Convert to array of artist track lists
    const artistTrackLists = Object.values(artistGroups);
    
    // Shuffle the order of artists to add more randomness
    const shuffledArtists = shuffleArray(artistTrackLists);
    
    // Distribute tracks round-robin to maximize artist variety
    const result = [];
    let maxLength = Math.max(...shuffledArtists.map(list => list.length));
    
    for (let i = 0; i < maxLength; i++) {
        shuffledArtists.forEach(artistTracks => {
            if (i < artistTracks.length) {
                result.push(artistTracks[i]);
            }
        });
    }
    
    return result;
}

/**
 * Fisher-Yates shuffle algorithm for randomizing array order
 * @param {Array} array - Array to shuffle
 * @returns {Array} - New shuffled array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
