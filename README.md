# Lollapalooza India 2026 - Mood Playlist Generator (React)

A React version of the Lollapalooza India 2026 Mood Playlist Generator, featuring an interactive mood sphere for genre selection and a classic iPod-style music player interface.

## Features

- 🎵 Interactive circular genre selection (mood sphere)
- 🎧 Classic iPod-style music player interface
- 🌓 Dark/Light theme toggle
- 📱 Fully responsive design for mobile and desktop
- 🎬 YouTube integration for audio playback
- 🎨 Modern glassmorphism UI design
- ⚡ React hooks and context for state management

## Installation

```bash
cd react-app
npm install
```

## Running the App

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Building for Production

```bash
npm run build
```

## Project Structure

```
react-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.js
│   │   ├── MiniPlayer.js
│   │   ├── MoodSphere.js
│   │   └── IPod.js
│   ├── context/
│   │   └── AppContext.js
│   ├── hooks/
│   │   ├── usePlayer.js
│   │   └── useYouTubePlayer.js
│   ├── constants/
│   │   ├── genres.js
│   │   ├── playlistData.js
│   │   └── config.js
│   ├── utils/
│   │   ├── youtubeAPI.js
│   │   ├── youtubeCache.js
│   │   └── formatTime.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── styles.css
└── package.json
```

## Configuration

Update the YouTube API key in `src/constants/config.js`:

```javascript
export const YOUTUBE_CONFIG = {
    API_KEY: 'YOUR_YOUTUBE_API_KEY_HERE',
    CACHE_EXPIRY_DAYS: 30,
    SEARCH_DELAY: 100
};
```

## Features Maintained

- All original functionality from the vanilla JS version
- Theme switching (dark/light)
- Genre selection with mood sphere
- Playlist generation
- Track playback controls
- Volume controls
- Progress tracking
- Mini player
- Mobile responsive design

## Technologies Used

- React 18.2.0
- React Hooks (useState, useEffect, useContext)
- YouTube IFrame API
- CSS3 (Glassmorphism, Animations)
- LocalStorage for caching

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

ISC
