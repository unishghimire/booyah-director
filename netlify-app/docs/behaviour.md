# Behaviour — Function, Component & API Behaviour Reference

> Exact behaviour of every component, API endpoint, and system function. If it's not listed here, it doesn't exist.

---

## 1. Backend API Endpoints (`api/index.js`)

### Data & Overlay
| Endpoint | Method | Behaviour |
|----------|--------|-----------|
| `getOverlayData` | GET/POST | Returns full tournament state: tournament, teams, players, matches, match_standings, kill_events, elimination_events, current_match, kill_feed, eliminations, standings, assets, design, overlay_state. Supports `?token=xxx` share token auth. |
| `getMatchData` | POST | Returns specific match data (standings, kills, eliminations) by `match_id`, or all matches with summaries if no match_id. |

### Auth & User
| Endpoint | Method | Behaviour |
|----------|--------|-----------|
| `registerUser` | POST | Registers user after Firebase signup. Creates in-memory DB if none. Returns user data. |
| `getUserRole` | GET | Returns current user's role (default: 'admin' for backward compat). |
| `setUserRole` | POST | Owner-only. Sets a user's role. Body: `{ role }`. |
| `checkSubscription` | GET | Returns subscription status. Owners auto-pass. |
| `getShareToken` | GET | Returns unique share token for OBS overlay URLs. |

### Design & Assets
| Endpoint | Method | Behaviour |
|----------|--------|-----------|
| `saveDesign` / `updateDesign` | POST | Saves design tokens (colors, fonts, branding). |
| `getDesign` | GET | Returns current design tokens. |
| `saveAsset` | POST | Saves an image asset to the asset library. |
| `deleteAsset` | POST | Removes an asset by ID. |

### Tournament Management
| Endpoint | Method | Behaviour |
|----------|--------|-----------|
| `initializeTournament` / `createTournament` | POST | Creates a new tournament with config. Sets as active. Initializes empty arrays. |
| `listTournaments` / `getTournaments` | GET | Lists all tournaments for the user. |
| `switchTournament` | POST | Switches active tournament by ID. |
| `deleteTournament` | POST | Deletes a tournament and all related data (teams, players, matches, standings, events). |
| `updateTournament` | POST | Updates tournament settings (name, points config, match count). |
| `updateTournamentSettings` | POST | Updates specific tournament settings. |
| `applyHeadstartPoints` | POST | Applies headstart points to teams before a match. |

### Team & Player Management
| Endpoint | Method | Behaviour |
|----------|--------|-----------|
| `addTeam` | POST | Adds a team to the active tournament. Max 12 teams. Auto-creates match standing. |
| `addPlayer` | POST | Adds a player to a team. Max 4 players per team. |
| `updatePlayer` | POST | Updates player details (name, kills, alive status). |
| `updateTeam` | POST | Updates team details (name). |
| `updateTeamLogo` | POST | Uploads and sets a team logo via ImgBB. |
| `deleteTeam` | POST | Removes a team and its players + match standings. |
| `deletePlayer` | POST | Removes a player from a team. |

### Match Flow
| Endpoint | Method | Behaviour |
|----------|--------|-----------|
| `startNextMatch` / `startMatch` | POST | Creates next match in sequence. Sets state to 'live'. Resets player alive status. |
| `updateMatchState` | POST | Updates match state (lobby, live, paused, ended). |
| `addKill` | POST | Records a kill: increments killer's kills, marks killed player eliminated, auto-assigns placement if team wiped, recalculates team totals. |
| `eliminatePlayer` | POST | Marks a player as eliminated. Auto-assigns team placement if last alive player. |
| `revivePlayer` | POST | Revives an eliminated player. |
| `setTeamPlacement` | POST | Manually sets a team's placement and calculates placement points. |
| `calculateMVP` | POST | Calculates MVP based on kills across all matches. |
| `resetMatch` | POST | Resets current match: clears kills, eliminations, standings, revives all players. |
| `resetDatabase` | POST | Full reset — wipes all tournament data. |
| `restoreState` | POST | Restores full database from JSON backup. |

### Overlay & Events
| Endpoint | Method | Behaviour |
|----------|--------|-----------|
| `switchOverlayScreen` | POST | Sets `overlay_state.current_screen`. |
| `setMVPAndShowScreen` / `setMVP` | POST | Sets MVP data + switches to MVP screen. |
| `setChampionAndShowScreen` / `setChampion` | POST | Sets champion data + switches to champions screen. |
| `declareChampions` | POST | Calculates final standings, declares champion, updates team totals. |
| `triggerEvent` | POST | Triggers an event banner (first blood, double kill, etc.) on the overlay. |

### Discord Integration
| Endpoint | Method | Behaviour |
|----------|--------|-----------|
| `saveDiscordWebhook` | POST | Saves Discord webhook URL. |
| `testDiscordWebhook` | POST | Sends a test message to Discord. |
| `postDiscord` | POST | Posts a custom message to Discord. |

### Admin
| Endpoint | Method | Behaviour |
|----------|--------|-----------|
| `validatePromo` | POST | Validates a promo code for subscription. |

---

## 2. Frontend Components

### App.jsx
- **AuthProvider** wraps everything
- **QueryClientProvider** for React Query
- **Router** with BrowserRouter
- **Auth gate:** If not logged in → AuthPage. If logged in but not subscribed → PricingPage. If subscribed → ShellLayout.
- **Overlay routes** bypass the shell (transparent, no header/sidebar).
- **Routes:** `/director`, `/overlay/:screen`, `/overlay-links`, `/control-panel` (redirects to `/director`)

### DirectorPanel.jsx
- Loads tournament list + user role on mount
- Polls `getOverlayData` every 2s (adaptive)
- 14 tabs filtered by role via `canAccessTab()`
- Keyboard shortcuts: 1-9 (tabs), s (sound), a (animations), - (timeline), = (setup)
- Tournament switcher dropdown (role-gated)
- Role badge in header center
- Preview/Take workflow for overlay scenes

### LiveControlPanel.jsx
- Kill feed: add kill (select killer + victim), remove last kill
- Alive counter: shows alive vs eliminated
- Player grid: click to eliminate/revive
- Quick scene switch buttons
- Auto-placement on team wipe (handled by backend `addKill`/`eliminatePlayer`)
- Toast notifications for all actions

### PlayerManager.jsx
- Player grid with team grouping
- Add player form (name + team select)
- CSV import with fuzzy team name matching
- Edit player name, kill count
- Toggle alive status
- Delete player (with confirmation)
- Revive eliminated players

### ScreenSwitcher.jsx
- Exports `SCREENS` array (16 screens) and `GROUP_LABELS`
- Preview/Take workflow: click screen → preview (blue), click TAKE → go live (purple pulse)
- Grouped by: FULL SCENES (solid) and LIVE OVERLAYS (transparent)
- Live screen indicated with green dot

### OverlayLinks.jsx
- Exports `OVERLAYS` array (28 overlay screens) and `CopyBtn` component
- Imports `SCREENS` + `GROUP_LABELS` from ScreenSwitcher for scene control section
- Two grid sections: Transparent Overlays + Full Scene Overlays
- Each card: icon, label, description, URL, copy/open/test buttons
- OBS setup instructions card
- Share token display

### Overlay.jsx
- Route: `/overlay/:screen`
- Root container: 1920×1080, transparent background
- Screens object maps screen names to components (with alias support)
- Falls back to `null` for unknown screens (shows blank)
- Polls `getOverlayData` every 2s
- No Framer Motion — CSS animations only
- Dynamic theming via `design` prop from state

### DesignStudio.jsx
- Color pickers for all design tokens
- Branding upload (tournament logo, sponsor logo via ImgBB)
- Live preview of changes
- Save button calls `saveDesign` API

### ThemeManager.jsx
- Preset theme cards
- Apply button saves theme tokens via `saveDesign`
- Themes: NexPlay (purple/blue), Midnight (deep blue), Solar (orange/teal), Custom

### AssetManager.jsx
- Image grid with upload (ImgBB)
- Categories for sorting
- Delete with confirmation
- Copy URL to clipboard

### EventTimeline.jsx
- Chronological list of events
- Color-coded: kills (red), eliminations (orange), match events (blue)
- Scrollable with auto-scroll to latest

### TournamentManager.jsx
- Create tournament form
- Delete tournament (with confirmation)
- List of existing tournaments with switch button

---

## 3. Library Functions

### overlayApi.js
- `call(name, payload, method, retry, signal)` — Core API caller with Firebase token auth
- Auto-refreshes Firebase token on 401
- 2s timeout per request
- AbortController for cancellable requests
- `useOverlayData(enabled)` — Polling hook with 2s adaptive interval (slows to 8s on errors)
- 45+ API methods mapping to backend endpoints

### roles.js
- `ROLES` object: 6 roles with tab lists and permission flags
- `getRoleConfig(roleName, isOwner)` — Returns role config, owners always get admin
- `canAccessTab(roleName, tabId, isOwner)` — Boolean check for tab access
- `canPerform(roleName, action, isOwner)` — Boolean check for action permission

### designTokens.js
- Centralized design system tokens
- `getTheme(design)` — Returns theme object from design tokens
- Color helper functions: `t.p` (primary), `t.s` (secondary), `t.bg`, `t.card`, `t.acc` (accent)
- Clip path definitions
- Gradient definitions

### maps.js
- 7 Free Fire maps: Bermuda, Bermuda 2.0, Kalahari, Purgatory, Alpine, Nexterra, Solara
- Each map: name, image URL, description
- Custom map images via ImgBB

### obsStore.js + obsWebSocket.js
- Zustand store for OBS connection state
- WebSocket service for OBS scene/source control
- Auto-reconnect on disconnect
- Scene switching, source visibility toggling

### useUndoRedo.js
- Snapshot-based undo/redo (30-deep history)
- `pushSnapshot(state)` — Save current state
- `undo()` — Revert to previous state
- `redo()` — Re-apply undone state
- `canUndo` / `canRedo` flags

### imageUpload.js
- Uploads to ImgBB free tier
- Returns permanent CDN URL
- Base64 encoding for API transport

### AuthContext.jsx
- Firebase auth provider
- `user` — Current Firebase user
- `subscription` — Subscription status
- `shareToken` — Unique overlay share token
- `loading` — Initial auth loading state
- `logout()` — Sign out
- Owner detection via email matching

### firebase.js
- Firebase initialization
- Project: "nexoverlays"
- RTDB region: asia-southeast1
- Google Sign-In provider
