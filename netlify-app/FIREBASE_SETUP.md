# 🔥 Firebase Realtime Database Setup

The app now uses Firebase Realtime Database for persistent storage.
Follow these steps to connect your own Firebase project.

---

## Step 1 — Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project** → Name it `booyah-director`
3. Disable Google Analytics (optional) → **Create project**

---

## Step 2 — Enable Realtime Database

1. In your project, go to **Build → Realtime Database**
2. Click **Create Database**
3. Choose **Start in test mode** → **Enable**
4. Copy your **Database URL** (looks like `https://booyah-director-default-rtdb.firebaseio.com`)

---

## Step 3 — Get Service Account Credentials

1. Go to **Project Settings** (gear icon) → **Service Accounts**
2. Click **Generate New Private Key** → **Generate Key**
3. Download the JSON file
4. From the JSON, you need:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

---

## Step 4 — Add Environment Variables to Netlify

In **Netlify Dashboard → Site Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `FIREBASE_PROJECT_ID` | `booyah-director` (your project ID) |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxxxx@booyah-director.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | The full private key string from the JSON file (including `-----BEGIN...END-----`) |
| `FIREBASE_DATABASE_URL` | `https://booyah-director-default-rtdb.firebaseio.com` |

> ⚠️ For `FIREBASE_PRIVATE_KEY`: paste the key **exactly** as it appears in the JSON file.
> Netlify will handle the newline escaping automatically.

---

## Step 5 — Redeploy

After saving the environment variables:
1. Go to **Deploys** in Netlify
2. Click **Trigger deploy → Deploy site**

Your data will now persist permanently in Firebase! 🎉

---

## Database Structure

```
booyah/
  tournament: { id, name, total_matches, points_per_kill, ... }
  teams: [ { id, name, logo_url, total_tournament_points, ... } ]
  players: [ { id, team_id, name, is_alive, total_tournament_kills, ... } ]
  matches: [ ... ]
  current_match: { id, match_number, state, map_name, ... }
  kill_feed: [ { killer_name, killed_player_name, ... } ]
  eliminations: [ ... ]
  standings: [ ... ]
  overlay_state: { current_screen, mvp_player_name, champion_team_name, ... }
  design: { primary, secondary, accent, ... }
```
