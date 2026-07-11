# Firebase Setup — nexoverlays project

## ✅ Already Done (auto-configured)

Your Firebase project `nexoverlays` has been detected and configured.
All environment variables are baked into the code as fallbacks.

| Config Value | Status |
|---|---|
| API Key | ✅ `AIzaSyBekqzqZv_iWvgAn9UCnpBGIw2675wr1gc` |
| Auth Domain | ✅ `nexoverlays.firebaseapp.com` |
| App ID | ✅ `1:231677184637:web:2ce67f7777413fe021bf14` |
| Storage Bucket | ✅ `nexoverlays.firebasestorage.app` |
| Database URL | ✅ `https://nexoverlays-default-rtdb.firebaseio.com` |

---

## ⚠️ 2 Manual Steps Required (5 minutes total)

### STEP 1 — Enable Realtime Database

The Realtime Database needs to be created once in the Firebase Console:

1. Go to: https://console.firebase.google.com/project/nexoverlays/database
2. Click **"Create Database"**
3. Choose location: **United States (us-central1)**
4. Start in **"Test mode"** (we'll secure it after)
5. Click **"Enable"**

### STEP 2 — Get Database Secret

1. Go to: https://console.firebase.google.com/project/nexoverlays/settings/serviceaccounts/adminsdk
2. Click the **"Database secrets"** tab (near bottom of page)
3. Click **"Show"** → copy the secret token
4. Add it to your **Netlify environment variables** as:
   ```
   FIREBASE_DATABASE_SECRET = <paste your secret here>
   ```
   Do this for BOTH Netlify sites (main app + admin panel).

### STEP 3 — Enable Email/Password Auth

1. Go to: https://console.firebase.google.com/project/nexoverlays/authentication/providers
2. Click **Email/Password**
3. Toggle **Enable** → Save

### STEP 4 — Set Database Security Rules

In Firebase Console → Realtime Database → Rules, paste:

```json
{
  "rules": {
    "booyah_admin": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "$other": {
      ".read": true,
      ".write": true
    }
  }
}
```

---

## Netlify Environment Variables

Set these in BOTH Netlify sites (Site Settings → Environment Variables):

```
FIREBASE_DATABASE_URL      = https://nexoverlays-default-rtdb.firebaseio.com
FIREBASE_DATABASE_SECRET   = <from Step 2>
FIREBASE_WEB_API_KEY       = AIzaSyBekqzqZv_iWvgAn9UCnpBGIw2675wr1gc
VITE_FIREBASE_API_KEY      = AIzaSyBekqzqZv_iWvgAn9UCnpBGIw2675wr1gc
VITE_FIREBASE_AUTH_DOMAIN  = nexoverlays.firebaseapp.com
VITE_FIREBASE_DATABASE_URL = https://nexoverlays-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID   = nexoverlays
VITE_FIREBASE_STORAGE_BUCKET = nexoverlays.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 231677184637
VITE_FIREBASE_APP_ID       = 1:231677184637:web:2ce67f7777413fe021bf14
```

---

## First Admin Account Setup

After deploying the admin panel:
1. Go to your admin panel URL and **register** with your email
2. Go to Firebase Console → Authentication → Users → copy your **UID**
3. In Firebase Realtime Database, manually add:
   ```
   /booyah_admin/admins/<YOUR_UID>
     enabled: true
     email: "your@email.com"
   ```
4. Now log in to the admin panel — you'll have full access

---

## Image Storage (Free Firebase Storage)

Firebase Storage is already configured. Free tier gives you **5 GB storage** and **1 GB/day download**.
- Upload team logos via the team management in the Director panel
- Storage bucket: `nexoverlays.firebasestorage.app`
