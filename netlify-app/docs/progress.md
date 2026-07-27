# Progress — Build Tracker

> Check what's done, what's in progress, and what's blocked.

---

## Legend
- [x] Complete
- [~] In Progress
- [ ] Not Started
- [!] Blocked

---

## Latest Update: 2026-07-27

### Just Completed
- [x] Fixed overlay tab crash — missing lucide-react icon imports in ScreenSwitcher.jsx
- [x] Expanded OVERLAYS array from 12 → 28 entries (all overlay screens now have links)
- [x] Expanded SCREENS array from 11 → 16 entries (all screens in scene control)
- [x] Added `getMatchData` backend endpoint (match data API)
- [x] Added `getMatchData` to overlayApi.js frontend client
- [x] Added `data_inputer` role to roles.js (6th role)
- [x] Created docs/ directory with 6 documentation files

### In Progress
- [~] Verifying all 6 roles × 14 tabs for crashes
- [~] DataInputer page route (`/inputer`)

### Not Started
- [ ] ORS (Official Result Service) public API
- [ ] Fine-grained role permissions (per-button, not just per-tab)
- [ ] Match history view with getMatchData integration
- [ ] CSV bulk match results import
- [ ] Real-time WebSocket for overlays (replacing polling)
- [ ] Multi-day tournament support
- [ ] Observer panel
- [ ] OBS auto-configuration
- [ ] Tournament templates
- [ ] Cloud backup system

---

## Build Health

| Metric | Status |
|--------|--------|
| Build | ✅ Clean — zero warnings |
| Chunk sizes | ✅ All <500KB |
| Dependencies | ✅ No new packages |
| Production URL | ✅ https://booyah-director.vercel.app |
| Git | ✅ Pushed to github.com/unishghimire/booyah-director |

### Chunk Sizes (Latest Build)
| Chunk | Size | Gzipped |
|-------|------|---------|
| firebase-vendor | 320.96 KB | 68.65 KB |
| DirectorPanel | 261.78 KB | 56.73 KB |
| react-vendor | 163.43 KB | 53.35 KB |
| Overlay | 113.47 KB | 21.95 KB |
| ui-vendor | 77.94 KB | 21.14 KB |
| index | 68.86 KB | 17.78 KB |
| obs-vendor | 20.74 KB | 7.99 KB |
| OverlayLinks | 18.39 KB | 4.62 KB |
| index.css | 61.75 KB | 11.30 KB |
| maps | 0.18 KB | 0.16 KB |
| motion-vendor | 0.07 KB | 0.07 KB |

---

## Role System Status

| Role | Tabs | Status |
|------|------|--------|
| Production Admin | All 14 | ✅ Working |
| Graphics Operator | 8 tabs | ✅ Working |
| Observer | 3 tabs | ✅ Working |
| Referee | 4 tabs | ✅ Working |
| Stream Producer | 4 tabs | ✅ Working |
| Data Inputer | 4 tabs | ✅ Role added, [~] Page not yet built |

---

## Overlay System Status

| Category | Count | Status |
|----------|-------|--------|
| Transparent overlays | 16 | ✅ All linked |
| Full-scene overlays | 12 | ✅ All linked |
| Total overlay routes | 28+ | ✅ All in OVERLAYS array |
| ScreenSwitcher entries | 16 | ✅ All with correct icons |
| Event banners | 12 | ✅ All linked |

---

## API Endpoints Status

| Category | Count | Status |
|----------|-------|--------|
| Data & overlay | 2 | ✅ getOverlayData + getMatchData |
| Auth & user | 5 | ✅ Working |
| Design & assets | 4 | ✅ Working |
| Tournament mgmt | 7 | ✅ Working |
| Team & player | 7 | ✅ Working |
| Match flow | 10 | ✅ Working |
| Overlay & events | 5 | ✅ Working |
| Discord | 3 | ✅ Working |
| Admin | 1 | ✅ Working |
| **Total** | **44** | ✅ All functional |

---

## Known Issues (Resolved)

| Issue | Resolution | Date |
|-------|-----------|------|
| Overlay tab crashing | Fixed — added missing icon imports to ScreenSwitcher | 2026-07-27 |
| Only 12 overlay links | Fixed — expanded to 28 | 2026-07-27 |
| No match data API | Added getMatchData endpoint + client | 2026-07-27 |
| No data_inputer role | Added 6th role to roles.js | 2026-07-27 |
| Vercel CLI deploys stuck | Workaround — use git push instead | 2026-07-27 |
| JSX warning in kill feed | Fixed — style prop moved inside div tag | 2026-07-27 |

---

## Deployment History (Recent)

| Time | Commit | Status |
|------|--------|--------|
| 17:00 | Fix overlay tab crash + getMatchData + data_inputer role | ✅ Ready |
| 16:40 | Add all 28 overlay links | ✅ Ready |
| 16:30 | Fix overlay tab crash — missing icon imports | ✅ Ready |
| 16:00 | Dead code cleanup (1,086 lines) | ✅ Ready |
