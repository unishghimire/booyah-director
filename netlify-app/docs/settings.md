# Settings — Codebase Structure & UI Design Style

> Single source of truth for project architecture, file layout, and design system.

---

## 1. Project Identity

- **Name:** NexOverlays Director
- **Purpose:** Real-time Free Fire esports tournament broadcast graphics system
- **Production:** https://booyah-director.vercel.app
- **GitHub:** github.com/unishghimire/booyah-director
- **Owner:** Unish Ghimire (nex.unishghimire@gmail.com)

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 + Tailwind 3 + Framer Motion + Zustand |
| Backend | Single dependency-free `/api/index.js` (no Express, no npm in functions) |
| Database | Firebase RTDB at `asia-southeast1`, namespaced `/users/{uid}/booyah/` |
| Auth | Firebase Auth (Google Sign-In mandatory) |
| Images | ImgBB free tier, permanent CDN URLs |
| OBS | obs-websocket-js v5 for scene/source control |
| Deploy | Vercel, Vite preset, Node.js 24.x |
| Polling | 2s adaptive (slows to 8s on errors), AbortController per request |

---

## 3. Directory Structure

```
netlify-app/
├── api/
│   └── index.js              # Single-file serverless backend (1700+ lines, 40+ routes)
├── src/
│   ├── App.jsx               # Root app — routing, shell layout, auth gate
│   ├── main.jsx              # Entry point
│   ├── index.css             # NexOverlays v2 design system CSS
│   ├── components/
│   │   ├── ErrorBoundary.jsx  # Error boundary + SectionBoundary + PanelBoundary
│   │   ├── ScrollToTop.jsx
│   │   ├── ImageUpload.jsx
│   │   ├── ConnectionStatusBar.jsx
│   │   └── control/
│   │       ├── LiveControlPanel.jsx    # Main live match control (kills, elim, alive)
│   │       ├── PlayerManager.jsx       # Player CRUD, CSV import
│   │       ├── TeamRoster.jsx          # Team grid display
│   │       ├── TournamentManager.jsx   # Tournament CRUD
│   │       ├── ScreenSwitcher.jsx      # Scene preview/take, exports SCREENS + GROUP_LABELS
│   │       ├── DesignStudio.jsx        # Design tokens editor (colors, fonts, branding)
│   │       ├── ThemeManager.jsx        # Preset themes
│   │       ├── AssetManager.jsx         # Image assets (logos, banners)
│   │       ├── AnimationLibrary.jsx    # Animation presets
│   │       ├── SoundManager.jsx        # Sound effects control
│   │       ├── EventTimeline.jsx       # Event log timeline
│   │       └── BroadcastDashboard.jsx  # Overview dashboard
│   ├── lib/
│   │   ├── firebase.js        # Firebase init (project "nexoverlays", RTDB asia-southeast1)
│   │   ├── AuthContext.jsx    # Firebase auth provider + subscription + share token
│   │   ├── overlayApi.js      # Frontend API client (45+ methods, token auth, polling hook)
│   │   ├── roles.js           # 6-role permission system
│   │   ├── designTokens.js    # Centralized design system (colors, typography, clip paths)
│   │   ├── maps.js            # Free Fire map registry (7 maps)
│   │   ├── obsStore.js        # OBS WebSocket Zustand store
│   │   ├── obsWebSocket.js    # OBS WebSocket service layer
│   │   ├── useUndoRedo.js     # Snapshot-based undo/redo (30-deep history)
│   │   ├── imageUpload.js     # ImgBB image hosting
│   │   └── PageNotFound.jsx
│   ├── pages/
│   │   ├── DirectorPanel.jsx  # Main control panel (1196 lines, 14 tabs)
│   │   ├── Overlay.jsx        # OBS overlay renderer (2467 lines, 30+ screen routes)
│   │   ├── OverlayLinks.jsx   # OBS setup page + OVERLAYS export
│   │   ├── AuthPage.jsx       # Firebase Google Sign-In
│   │   └── PricingPage.jsx   # Subscription tiers
│   ├── tailwind.config.js
│   ├── vite.config.js        # Manual chunks, 500KB limit
│   └── vercel.json            # Vercel deploy config
├── docs/                     # Project documentation (this folder)
├── package.json
├── postcss.config.js
└── netlify.toml
```

---

## 4. Design System (NexOverlays v2)

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#7C3AED` | Purple — main accent, CTA buttons, active states |
| Secondary | `#3B82F6` | Blue — secondary accent, links, info elements |
| Background (deep) | `#04060E` | Darkest navy — root background |
| Background (mid) | `#0D0B1A` | Mid navy — section backgrounds |
| Card | `#131127` | Card/panel surfaces |
| Elevated | `#1A1830` | Elevated panels, modals |
| Success/Alive | `#10B981` | Green — alive status, success toasts |
| Eliminated | `#EF4444` | Red — eliminated status, errors |
| Gold/Rank | `#FBBF24` | Gold — placement rank highlights |

### Typography

| Font | Role | Usage |
|------|------|-------|
| Orbitron | Display | Headings, labels, badges, tab names |
| Rajdhani | Body | Body text, descriptions, form labels |
| Teko | Numbers/Stats | Scores, kill counts, placement numbers |

### CSS Variables (`index.css`)

All colors are defined as CSS variables on `:root` and consumed via Tailwind classes like `text-[#7C3AED]` or `bg-[#131127]`.

### Clip Paths

Angular broadcast aesthetics defined in `designTokens.js`:
- `angular` — Angled corner cut
- `arrow` — Arrow-shaped panel
- `hex` — Hexagonal badge
- `tag` — Tag/label shape
- `diagonal` — Diagonal slope

### Glow Effects

Purple/blue box-shadows for accent elements:
```css
box-shadow: 0 0 10px rgba(124,58,237,0.4);
box-shadow: 0 0 15px rgba(59,130,246,0.3);
```

---

## 5. Vite Build Configuration

- **Manual chunks:** react-vendor, firebase-vendor, ui-vendor, motion-vendor, obs-vendor
- **Chunk size warning limit:** 500KB
- **Minify:** esbuild
- **Target:** ES2020
- **Preset:** Vite
- **Node version:** 24.x (via .node-version)

---

## 6. Backend Architecture

- **Single file:** `api/index.js` — no Express, no npm dependencies in functions
- **Routes:** 40+ endpoints, all return JSON even on error
- **Auth:** Firebase token verification on every request (except getOverlayData with share token)
- **Rate limiting:** 120 req/min per IP
- **Input sanitization:** All user-submitted data is sanitized
- **Owner bypass:** `OWNER_EMAILS` env var for admin privileges
- **Data isolation:** Per-user UID namespacing at `/users/{uid}/booyah/`
- **In-memory fallback:** When Firebase is unconfigured, uses in-memory store

---

## 7. Auth & Permissions

- **Mandatory:** Google Sign-In via Firebase Auth
- **Subscription gate:** Users must have active subscription (or be owner) to access app
- **Share token:** Unique token for OBS overlay URLs (no auth needed)
- **6 roles:** Production Admin, Graphics Operator, Observer, Referee, Stream Producer, Data Inputer
- **Role enforcement:** `canAccessTab()` filters visible tabs per role
- **Owner override:** Owner emails always get admin role

---

## 8. Overlay System

- **Dimensions:** All overlays hardcoded to 1920×1080 (1080p)
- **Background:** Transparent (for OBS browser source layering)
- **Routes:** `/overlay/:screen` — 30+ screen routes
- **Polling:** 2s adaptive, reads from `getOverlayData` endpoint
- **No Framer Motion:** Overlays use CSS animations only (avoids opacity:0 bugs)
- **No escaped backticks:** Template literals must use clean syntax
- **Branding:** Full-scene overlays must persist tournament logo/name + sponsor info

---

## 9. Deployment

- **Platform:** Vercel
- **Framework preset:** Vite
- **Root directory:** `netlify-app/`
- **Node version:** 24.x
- **Timeout:** 30s
- **Git integration:** Auto-deploys on push to `main` branch
- **CLI deploys:** `npx vercel --prod --yes` (may get stuck in UNKNOWN — use git push instead)

---

## 10. Coding Standards

- Modify existing code instead of replacing wholesale
- Preserve naming conventions (camelCase for JS, kebab-case for CSS classes)
- Keep changes localized — one logical change at a time
- Prefer editing > simplifying > deleting > adding
- Reuse existing implementations — never duplicate
- No placeholder implementations or TODO stubs
- No escaped backticks in template literals
- All API endpoints return JSON even on error
- Zero build warnings, all chunks <500KB
