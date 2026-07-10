<!-- build-plan:begin -->
## Active build plan — booyah_director
Work through every step, and confirm each is satisfied before telling the user the agent is ready.

- [ ] 1. Create entities: Tournament, Team, Player, Match, MatchStanding, KillEvent, EliminationEvent, OverlayState. Set up relationships (Team → Players, Team → MatchStandings, Match → KillEvents/EliminationEvents).
- [ ] 2. Create the OverlayState singleton record with current_screen = 'setup_blank'.
- [ ] 3. Write backend functions: initialize_tournament, add_team, add_kill, eliminate_player, set_team_placement, switch_overlay_screen, calculate_match_mvp, declare_champions, get_overlay_data, get_control_panel_data, reset_match, start_next_match, update_point_system. Each function should validate inputs and return structured responses.
- [ ] 4. Build the control panel page (/control-panel): tournament setup form, team/player management, match state controls (screen switch buttons, kill buttons per player, eliminate buttons, placement input), live standings table, MVP/champions reveal buttons. Responsive for desktop and tablet.
- [ ] 5. Build the overlay page (/overlay): a single browser-source-optimized page that polls get_overlay_data every 500ms and renders the current screen layer (pre_match_map, scoreboard, kill_feed, elimination_alert, mvp, champions) with Free Fire aesthetic (dark theme, orange/red accents, bold typography, BOOYAH celebration animation for champions). All screens are layers in one page — show/hide via CSS based on OverlayState.current_screen.
- [ ] 6. Write operating rules to .agents/rules/operating_rules.md — these become the agent's behavioral guardrails injected into every conversation.
- [ ] 7. Configure the agent persona, skills, and in-app chat channel.
- [ ] 8. Test the full flow: create tournament → add 12 teams × 4 players → start match 1 → add kills → eliminate players → set placements → reveal MVP → start match 2 → repeat → declare champions → show BOOYAH screen. Verify overlay updates within 500ms of each control panel action.
- [ ] 9. Add the overlay URL instructions for the operator: 'In OBS, add a Browser Source with URL <your-app>/overlay, width 1920, height 1080. Keep it always visible — the app handles screen switching internally.'
<!-- build-plan:end -->