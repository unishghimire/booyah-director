# ⚡ Booyah Director

A real-time Free Fire tournament streaming overlay system — built on Base44.

## Features

- 🎮 **Control Panel** — full operator dashboard for managing teams, players, kills, placements
- 📺 **OBS Overlay** — 1920×1080 browser source with 7 switchable screens
- ⚡ **Real-time** — 500ms polling, instant updates across all screens
- 🏆 **Full point system** — configurable kill points + placement points (12 positions)
- 💀 **Kill tracking** — per-player kill logging with kill feed ticker
- ⭐ **MVP reveal** — auto-calculates match MVP by kills
- 🎊 **BOOYAH screen** — champions celebration with confetti animation

## Overlay Screens

| Screen | Description |
|--------|-------------|
| `setup_blank` | Clean black canvas |
| `pre_match_map` | Map reveal with team grid |
| `scoreboard` | Live standings + kill leaders |
| `kill_feed` | Recent kills display |
| `elimination_alert` | Dramatic elimination banner |
| `mvp` | Match MVP reveal |
| `champions` | BOOYAH champions celebration |

## OBS Setup

1. Add **Browser Source** in OBS
2. URL: `https://kaelo-cec2b53f.base44.app/overlay`
3. Width: **1920** | Height: **1080**
4. ✅ Done

## Live URLs

- **Control Panel:** https://kaelo-cec2b53f.base44.app/control-panel
- **OBS Overlay:** https://kaelo-cec2b53f.base44.app/overlay

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS + Framer Motion
- **Backend:** 13 Base44 serverless functions
- **Database:** Base44 entities (8 schemas)
- **Hosting:** Base44 platform

## Backend Functions

| Function | Purpose |
|----------|---------|
| `initializeTournament` | Create tournament with point config |
| `addTeam` | Add team + players |
| `startNextMatch` | Start next match, reset player lives |
| `updateMatchState` | Transition match states |
| `addKill` | Log kill, update points |
| `eliminatePlayer` | Mark player eliminated |
| `setTeamPlacement` | Award placement points |
| `calculateMVP` | Find match top killer |
| `setMVPAndShowScreen` | Show MVP on overlay |
| `setChampionAndShowScreen` | BOOYAH champions screen |
| `switchOverlayScreen` | Switch overlay screen |
| `getOverlayData` | Master data feed (polled every 500ms) |
| `declareChampions` | Rank all teams by total points |

## Tournament Flow

1. Create tournament → set kill pts + placement pts config
2. Add teams (up to 12) with up to 4 players each
3. Select map → Start Match → overlay auto-switches to Map Reveal
4. Click GO LIVE → scoreboard appears on stream
5. During match: +KILL per player, ☠️ ELIM when player is out
6. Set team placements as they finish
7. End Match → Calculate MVP → Show MVP on overlay
8. Repeat for all matches
9. Declare Champions → BOOYAH! 🏆

---
Built with ❤️ using [Base44](https://base44.com)
