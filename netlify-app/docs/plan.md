# Plan — What To Build & How

> Roadmap for remaining and future work on NexOverlays Director.

---

## Current Status: Stable & Deployed

All 4 development phases complete. Production is live. Overlay tab crash fixed. Match data API added. Data Inputer role added.

---

## PRIORITY 1: Fix Remaining Issues (This Session)

### 1.1 DataInputer Route & Page
**What:** Create a dedicated DataInputer page at `/inputer` for rapid data entry operators.
**Why:** Data inputers need a focused interface without the full director panel overhead.
**How:**
- Create `src/pages/DataInputer.jsx` — simplified view with: match results entry, player stats entry, team standings update
- Add route in `App.jsx`: `<Route path="/inputer" element={...} />`
- Add to sidebar navigation
- Gate by `data_inputer` role
- API calls: `addKill`, `setTeamPlacement`, `updatePlayer`, `getMatchData`

### 1.2 Role Tab Verification
**What:** Verify every role sees exactly the right tabs and no tab crashes.
**Why:** Current role system may have gaps — some tabs may not render content for certain roles.
**How:**
- Test each role: admin, operator, observer, referee, producer, data_inputer
- Verify `canAccessTab()` returns correct results for all 14 tabs × 6 roles
- Ensure tab content components don't crash when data is missing
- Add fallback content for roles that should see limited data

### 1.3 Match Data API Integration
**What:** Wire `getMatchData` endpoint into the UI — match history view, per-match details.
**Why:** Operators need to review past match results and export data.
**How:**
- Add "Match History" section to MATCH tab
- Call `getMatchData` on match selection
- Display: standings table, kill timeline, elimination list
- Export button: download match data as JSON/CSV

---

## PRIORITY 2: Feature Enhancements (Next Session)

### 2.1 ORS (Official Result Service) API
**What:** External API endpoint for third-party systems to pull match/tournament results.
**Why:** Tournament organizers need to integrate results into scoring platforms.
**How:**
- New endpoint: `getPublicResults` — returns public tournament results by share token
- New endpoint: `getTournamentStandings` — returns final standings
- No Firebase auth required — share token auth only
- Rate limited more aggressively (30 req/min)
- Returns: teams, standings, match results, MVP, champions

### 2.2 Enhanced Role Permissions
**What:** Fine-grained permissions within tabs, not just tab visibility.
**Why:** Referee can see MATCH tab but shouldn't be able to start/end matches. Data inputer should only add results, not control match flow.
**How:**
- Add `canEdit` checks to individual buttons/actions
- Add `actionWhitelist` per role (e.g., referee can only: addKill, eliminatePlayer, revivePlayer)
- Disable buttons visually (opacity + cursor-not-allowed) when not permitted

### 2.3 DataInputer CSV Bulk Import
**What:** Import full match results from a CSV file.
**Why:** Post-match data entry is faster via spreadsheet.
**How:**
- CSV template: team_name, player_name, kills, placement
- Parse and validate against existing teams/players
- Auto-create match standings from placement data
- Show preview before confirming import

---

## PRIORITY 3: Broadcast Enhancements (Future)

### 3.1 Real-time WebSocket (vs polling)
**What:** Replace 2s polling with Firebase RTDB real-time listeners for overlays.
**Why:** Eliminates 2s delay between operator action and overlay update.
**How:**
- Firebase `onValue()` listeners in Overlay.jsx
- Fallback to polling if WebSocket fails
- Debounce rapid state changes

### 3.2 Multi-day Tournament Support
**What:** Support tournaments spanning multiple days with daily standings.
**Why:** Real esports tournaments run 2-5 days with cumulative scoring.
**How:**
- Add `day` field to Match entity
- Group matches by day in UI
- Daily standings + cumulative standings views
- Day transition overlay screen

### 3.3 Observer Panel
**What:** Read-only observer view for tournament officials.
**Why:** Observers need a clean dashboard without controls.
**How:**
- Simplified dashboard: current match, standings, alive count
- No edit controls
- Auto-refresh view
- Public link (share token based)

### 3.4 Mobile Director
**What:** Mobile-optimized director panel for on-the-go match management.
**Why:** Operators sometimes need to manage matches from phones.
**How:**
- Responsive tab layout
- Touch-optimized buttons
- Swipe between tabs
- Simplified control panel

---

## PRIORITY 4: Polish & Scale (Future)

### 4.1 OBS Auto-Configuration
**What:** Auto-configure OBS browser sources from the director panel.
**Why:** Eliminates manual OBS setup step.
**How:**
- OBS WebSocket integration already exists
- Add "Auto-Setup OBS" button that creates all browser sources
- Set correct dimensions (1920×1080) per source
- Assign to correct scenes

### 4.2 Tournament Templates
**What:** Pre-configured tournament templates (12 teams, standard points, etc).
**Why:** Speeds up tournament setup for common formats.
**How:**
- Template library: FFWS format, custom format, quick play
- One-click apply creates tournament + matches + default settings
- Save custom templates

### 4.3 Cloud Backup
**What:** Automatic cloud backup of tournament data.
**Why:** Prevents data loss during live tournaments.
**How:**
- Scheduled backup to Firebase (already using RTDB)
- Export to cloud storage on match end
- Restore from any device

---

## Build Methodology

1. **Always:** Modify existing code, don't rewrite
2. **Always:** Build first, deploy second, verify third
3. **Always:** Zero build warnings, all chunks <500KB
4. **Always:** Test with `npm run build` before deploying
5. **Deploy:** `git push github main` (Vercel CLI may get stuck)
6. **Verify:** Check Vercel deployment status, then curl production URLs
7. **Document:** Update task.md, progress.md after each change
