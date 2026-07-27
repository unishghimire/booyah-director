# UI — Design Reference & Component Behaviour

> How the NexOverlays Director UI looks, behaves, and feels. Reference for every visible surface.

---

## 1. Global Shell

### Layout Structure
```
┌──────────────────────────────────────────────────┐
│  ConnectionStatusBar (OBS/Firebase status)       │
├──────────┬───────────────────────────────────────┤
│ Sidebar  │  TopHeader (brand + live screen + logout)│
│ (200px   ├───────────────────────────────────────┤
│ or 60px) │  Tab Bar (44px — 14 tab buttons)      │
│          ├───────────────────────────────────────┤
│          │  Active Tab Content (scrollable)      │
│          │                                       │
│          ├───────────────────────────────────────┤
│          │  BottomBar (mobile only — 2 links)     │
└──────────┴───────────────────────────────────────┘
```

### Sidebar (Desktop Only)
- Collapsible: 200px expanded / 60px collapsed
- Links: DIRECTOR (`/director`), OBS LINKS (`/overlay-links`)
- State persisted in `localStorage('sidebar_expanded')`
- Active link: `bg-[#7C3AED]/10 text-[#7C3AED]`
- Inactive: `text-white/40 hover:bg-white/5`

### TopHeader
- Left: NexOverlays logo (gradient purple→blue square + Zap icon)
- Center: Live screen status badge (pulsing purple dot + current screen name)
- Right: OBS SOURCE link button, LOGOUT button
- Bottom: 1px gradient line `from-[#7C3AED] via-transparent to-[#3B82F6]`

### ConnectionStatusBar
- Thin bar above header showing OBS WebSocket + Firebase connection status
- Green dot = connected, red dot = disconnected

---

## 2. Tab Bar (14 Tabs)

All tabs use Orbitron font, 11px, black weight, 0.15em tracking.

| Tab ID | Label | Icon | Roles |
|--------|-------|------|-------|
| dashboard | DASHBOARD | Activity | All |
| live | LIVE | Radio | Admin, Operator |
| overlay | OVERLAY | Monitor | Admin, Operator, Producer |
| match | MATCH | Map | Admin, Referee, DataInputer |
| standings | STANDINGS | Trophy | All |
| players | PLAYERS | Users | Admin, Referee, DataInputer |
| design | DESIGN | Paintbrush | Admin, Operator |
| theme | THEME | Palette | Admin, Operator |
| assets | ASSETS | Layers | Admin, Operator |
| sound | SOUND | Volume2 | Admin, Operator |
| animations | ANIM | Film | Admin, Operator |
| timeline | TIMELINE | Clock | Admin, Observer, Producer |
| setup | SETUP | Settings2 | Admin, Producer |

### Tab Behaviour
- Active: `color: #7C3AED`, `background: rgba(124,58,237,0.06)`, `textShadow: 0 0 8px rgba(124,58,237,0.4)`, 2px purple bottom bar
- Inactive: `color: rgba(255,255,255,0.4)`
- Filtered by role via `canAccessTab(userRole, tabId, isOwner)`
- Keyboard shortcuts: 1-9 for first 9 tabs, s=sound, a=animations, -=timeline, ==setup

---

## 3. Tab Content Behaviour

### DASHBOARD
- Broadcast dashboard overview
- Shows tournament status, current match, quick stats
- Visible to all roles

### LIVE (LiveControlPanel)
- Main match control surface
- Kill feed with add/remove kill buttons
- Alive counter
- Elimination tracker
- Player status grid (alive/eliminated)
- Quick scene switch buttons
- Keyboard shortcuts: numbers for scenes, s/a/r for actions

### OVERLAY (OverlayLinks + ScreenSwitcher)
- **Scene Control section:** Preview/Take workflow
  - Screen buttons grouped by category (FULL SCENES, LIVE OVERLAYS)
  - Click to preview (blue highlight), TAKE button to go live (purple pulse)
  - Live screen shown with green dot
- **OBS Setup instructions:** Step-by-step for adding browser source
- **Share Token:** Unique token for authenticating OBS overlay URLs
- **Transparent Overlays grid:** Cards with icon, label, URL, copy/open/test buttons
- **Full Scene Overlays grid:** Same card layout for solid backgrounds
- **28 total overlay links** covering all screen routes

### MATCH
- Tournament setup form (name, points config, matches count)
- Match state controls (start, pause, end)
- Map selection (7 Free Fire maps)
- Team placement grid
- MVP calculation trigger
- Danger zone: reset match, reset database

### STANDINGS
- Full tournament standings table
- Sorted by total tournament points (descending)
- Columns: Rank, Team, Kills, Total Points
- Gold highlight for #1

### PLAYERS (PlayerManager)
- Player grid: name, team, kills, alive status
- Add/edit/delete players
- CSV import with fuzzy team matching
- Revive eliminated players
- Toggle alive status

### DESIGN (DesignStudio)
- Color pickers: primary, secondary, background, card, accent
- Branding: tournament logo upload, tournament name, sponsor logo, sponsor label
- Day label, match info chip configuration
- Clip path selector
- Glow intensity slider
- Live preview

### THEME (ThemeManager)
- Preset theme cards (NexPlay, Midnight, Solar, Custom)
- Click to apply — saves to design tokens
- Purple/blue accent variants

### ASSETS (AssetManager)
- Image grid with upload
- Categories: logos, banners, team logos, sponsor logos
- Delete assets
- Copy URL button

### SOUND (SoundManager)
- Sound effect library
- Trigger sounds (first blood, elimination, victory, etc.)
- Volume control
- Test play button

### ANIMATIONS (AnimationLibrary)
- Animation preset gallery
- Trigger animations on overlay
- Categories: entrance, exit, emphasis, celebration

### TIMELINE (EventTimeline)
- Chronological event log
- Shows kills, eliminations, match state changes
- Color-coded by event type
- Scrollable list

### SETUP
- Tournament configuration
- Role management (owner only can change roles)
- Export/import database (JSON backup/restore)
- Danger zone: reset match, reset database (with confirmation)

---

## 4. Overlay Screens (30+ routes at `/overlay/:screen`)

### Transparent Overlays (layer over gameplay)
| Screen | Component | Behaviour |
|--------|-----------|-----------|
| ff-scoreboard | FFBoardV2 + MatchInfoChip | Main scoreboard — 12 teams, 38-40px rows, green alive bars, auto-eliminated banner on team wipe |
| standings | FullStandings | Full tournament points table |
| killfeed | KillFeedScreen | Last 6 kills, animated entries |
| elim-alert | EliminationAlert | Latest elimination popup, auto-fades after 5s |
| event-first_blood | EventBanner | First blood banner |
| event-double_kill | EventBanner | Double kill announcement |
| event-triple_kill | EventBanner | Triple kill announcement |
| event-quadra_kill | EventBanner | Quadra kill announcement |
| event-penta_kill | EventBanner | Penta kill announcement |
| event-team_wipe | EventBanner | Team wipe announcement |
| event-airdrop | EventBanner | Airdrop alert |
| event-final_circle | EventBanner | Final zone alert |
| event-safe_zone | EventBanner | Safe zone shrinking |
| event-match_point | EventBanner | Match point triggered |
| event-winner | EventBanner | Winner banner |
| event-mvp | EventBanner | MVP event banner |

### Full-Scene Overlays (solid background, replace entire screen)
| Screen | Component | Behaviour |
|--------|-----------|-----------|
| game-intro | GameIntroBanner | Map + match number intro animation |
| maplabel | PreMatchMap | Map name + teams list pre-match |
| upcoming-map | UpcomingMap | Next map preview card |
| today-matches | TodaysMatches | Today's match schedule |
| schedule | MatchScheduleGrid | Full match schedule grid |
| teams | PointRushStandings | Point rush standings, dual column |
| team_roster | TeamRosterScreen | Team + player photos, auto-slides every 6s |
| casters | CastersScreen | Caster & analyst profiles |
| mvp | MVPScreen | MVP player full-screen reveal |
| champions | ChampionsScreen | Tournament winner celebration |
| booyah | ChampionsScreen | Booyah celebration (alias) |
| roadmap | RoadmapOverlay | Tournament schedule — stages, days, matches with live progress |
| event-details | EventDetailsOverlay | Tournament info card — format, placement points, stats |

### Overlay Rendering Rules
- Root container: `1920×1080`, `position: relative`, `overflow: hidden`, `background: transparent`
- No Framer Motion (causes opacity:0 bugs) — CSS animations only
- Dynamic theming via `design` prop (colors read from design tokens)
- Polling: 2s adaptive, reads `getOverlayData` endpoint
- Share token auth: `?token=xxx` query param for OBS browser sources

---

## 5. Card / Panel Style

All content panels follow this pattern:
```
rounded-xl border border-[#7C3AED]/20 bg-white/[0.02] backdrop-blur-xl p-4 shadow-xl
```
- Border: subtle purple tint (20% opacity)
- Background: very subtle white (2% opacity) with blur
- Shadow: extra large
- Rounded: xl (12px)
- Padding: 4 (16px)

### Section Headers
```jsx
<div className="flex items-center gap-2">
  <div className="h-1.5 w-1.5 bg-[#7C3AED] rounded-full animate-pulse" />
  <span className="font-orbitron text-[10px] font-black text-[#7C3AED] tracking-widest">
    SECTION NAME
  </span>
</div>
```

### Stat Tiles
```
rounded-lg border bg-card text-card-foreground p-6
```
- Large number: `text-2xl font-semibold`
- Label: `text-sm font-medium text-muted-foreground`

---

## 6. Button Styles

| Type | Style |
|------|-------|
| Primary | `bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white` |
| Secondary | `border border-white/10 bg-white/5 text-gray-400 hover:text-white` |
| Active/Live | `bg-[#7C3AED]/22 border-[#7C3AED]/88` with glow |
| Preview | `bg-[#3B82F6]/10 border-[#3B82F6]/60` with glow |
| Danger | `border-red-500/30 bg-red-500/10 text-red-400` |
| Disabled | `opacity-30 cursor-not-allowed` |

All buttons: `font-orbitron text-[10px] font-black tracking-widest` rounded-lg or rounded-md

---

## 7. Toast Notifications

- Library: `react-hot-toast`
- Success: green toast with message
- Error: red toast with error message
- Auto-dismiss: 3s default
- Positioned: bottom-center on mobile, bottom-right on desktop

---

## 8. Animations

- Tab content transitions: CSS transitions on opacity/transform
- Pulsing dots: `animate-pulse` (Tailwind built-in)
- Spinner: `animate-spin` with border ring
- Overlay animations: CSS keyframes defined in `index.css` (no Framer Motion in overlays)
- Take button: `animate-pulse` when preview is selected

---

## 9. Responsive Behaviour

- Desktop: Full sidebar + tab bar + content
- Mobile: No sidebar, bottom bar with 2 links (DIRECTOR, OBS LINKS)
- Tab bar: Horizontal scroll on small screens
- Grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` — 1 column mobile, 2 tablet, 3 desktop
- Hidden on mobile: Sidebar, OBS SOURCE label, LOGOUT label (icons only)

---

## 10. Error Handling

- `ErrorBoundary` wraps the entire app
- `SectionBoundary` wraps each tab section — catches render errors per-tab
- `PanelBoundary` wraps major panels — prevents full app crash
- Crash fallback: Purple spinner on dark background
- API errors: Toast notification with error message
- All API endpoints return JSON even on error
