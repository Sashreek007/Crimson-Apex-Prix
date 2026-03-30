# Crimson Apex Prix

Crimson Apex Prix is a browser-based 3D arcade racing game built with Three.js and Vite. It drops you into a compact Formula 1-inspired race weekend with configurable laps, AI rivals, multiple circuit layouts, reactive race audio, and a full HUD/garage flow.

## Features

- 3D arcade racing with a third-person chase camera
- Garage setup for track, lap count, rival count, difficulty, and audio settings
- Multi-lap race flow with countdown, leaderboard, lap timer, best lap, and finish screen
- Five game-scale circuits inspired by Monza, Silverstone, Suzuka, Monaco, and Spa
- F1-style cars with wings, halo, suspension details, and stylized materials
- Reactive race audio with engine, wind, boost, countdown, and finish cues

## Controls

- `W`, `A`, `S`, `D` or arrow keys: drive and steer
- `Shift`: ERS boost
- `V`: change camera
- `P` or `Esc`: pause/resume
- `R`: restart race
- `M`: mute/unmute
- `Space`: launch the currently selected session from the garage

## Getting Started

### Requirements

- Node.js 18+ recommended
- npm

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open the local URL Vite prints in the terminal.

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```text
.
├── index.html
├── public/
│   └── audio/
├── src/
│   ├── audio.js
│   ├── main.js
│   └── style.css
├── package.json
└── README.md
```

## Tech Stack

- Vite
- Three.js
- Web Audio API

## Notes

- The circuits are game-scale recreations, not sim-grade or laser-scanned replicas.
- Audio source attributions are listed in `public/audio/ATTRIBUTION.md`.
- The project is set up to deploy cleanly to Vercel.
