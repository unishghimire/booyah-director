import {
  Map, Crosshair, AlertTriangle, Star, Trophy,
  Users, Mic2, Calendar, Gamepad2, Grid3x3, Zap,
  Clock, Crown, Info, Skull
} from 'lucide-react';

export const SCREENS = [
  { key: 'game-intro',        label: 'GAME INTRO',     icon: Gamepad2,     desc: 'Game intro banner with map + match number',  group: 'scene' },
  { key: 'maplabel',          label: 'MAP INTRO',      icon: Map,          desc: 'Map reveal + team list',                    group: 'scene' },
  { key: 'upcoming-map',      label: 'UPCOMING MAP',   icon: Clock,        desc: 'Next map preview card',                     group: 'scene' },
  { key: 'today-matches',     label: 'TODAY MATCHES',  icon: Calendar,     desc: 'Match schedule for today',                   group: 'scene' },
  { key: 'schedule',          label: 'MAP SCHEDULE',   icon: Grid3x3,      desc: 'Full match schedule grid',                  group: 'scene' },
  { key: 'teams',             label: 'TEAMS TODAY',    icon: Users,        desc: 'Point Rush standings',                      group: 'scene' },
  { key: 'team_roster',       label: 'TEAM ROSTER',    icon: Users,        desc: 'Full team + player roster, auto-slides',    group: 'scene' },
  { key: 'casters',           label: 'CASTERS',        icon: Mic2,         desc: 'Caster & analyst profiles',                 group: 'scene' },
  { key: 'mvp',               label: 'MVP',            icon: Star,         desc: 'MVP spotlight screen',                       group: 'scene' },
  { key: 'champions',         label: 'CHAMPIONS!',    icon: Crown,        desc: 'Champions reveal',                           group: 'scene' },
  { key: 'roadmap',           label: 'ROADMAP',        icon: Map,          desc: 'Tournament schedule — stages, days, matches',group: 'scene' },
  { key: 'event-details',     label: 'EVENT DETAILS', icon: Info,         desc: 'Tournament info — format, placement points', group: 'scene' },
  { key: 'ff-scoreboard',     label: 'FF SCOREBOARD',  icon: Zap,          desc: 'NexOverlays scoreboard + match info chip',  group: 'overlay' },
  { key: 'standings',         label: 'STANDINGS',      icon: Trophy,       desc: 'Full tournament standings',                  group: 'overlay' },
  { key: 'killfeed',          label: 'KILL FEED',      icon: Skull,        desc: 'Live kill feed — last 6 eliminations',       group: 'overlay' },
  { key: 'elim-alert',        label: 'ELIM ALERT',     icon: AlertTriangle, desc: 'Last elimination popup',                    group: 'overlay' },
];

export const GROUP_LABELS = {
  scene:   { label: 'FULL SCENES',   color: '#7C3AED' },
  overlay: { label: 'LIVE OVERLAYS',  color: '#3B82F6' },
};
