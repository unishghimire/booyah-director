# Vercel Environment Variables — Booyah Director

Paste these in Vercel → Project → Settings → Environment Variables → Production.

---

## ✅ BOTH projects (booyah-director AND booyah-admin)

| Variable | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyBekqzqZv_iWvgAn9UCnpBGIw2675wr1gc` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `nexoverlays.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | `https://nexoverlays-default-rtdb.asia-southeast1.firebasedatabase.app` |
| `VITE_FIREBASE_PROJECT_ID` | `nexoverlays` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `nexoverlays.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `231677184637` |
| `VITE_FIREBASE_APP_ID` | `1:231677184637:web:2ce67f7777413fe021bf14` |
| `FIREBASE_DATABASE_URL` | `https://nexoverlays-default-rtdb.asia-southeast1.firebasedatabase.app` |
| `FIREBASE_WEB_API_KEY` | `AIzaSyBekqzqZv_iWvgAn9UCnpBGIw2675wr1gc` |
| `FIREBASE_DATABASE_SECRET` | `[your 40-char database secret from Firebase Console]` |

---

## ✅ booyah-director ONLY

| Variable | Value |
|---|---|
| `VITE_IMGBB_API_KEY` | `ced24d28...914e` ← your key is saved, paste the full value from your Security settings |
| `OWNER_EMAILS` | `nex.unishghimire@gmail.com,unishghimire2@gmail.com` |
| `VITE_OWNER_EMAILS` | `nex.unishghimire@gmail.com,unishghimire2@gmail.com` |
| `ALLOWED_ORIGIN` | `*` |

---

## ✅ booyah-admin ONLY

| Variable | Value |
|---|---|
| `FIREBASE_PROJECT_ID` | `nexoverlays` |
| `ADMIN_EMAIL` | `admin@booyah.gg` |
| `SUPER_ADMIN_SECRET` | `[choose a strong secret, e.g. BD-SUPER-2026-SECRET]` |
| `VITE_ADMIN_ACCESS_CODE` | `BD-ADMIN-2026` |

---

## 🖼️ Image Hosting — ImgBB (Free, no credit card)

1. Go to **https://api.imgbb.com/**
2. Sign up free → My Account → API
3. Copy your API key
4. Add as `VITE_IMGBB_API_KEY` in Vercel → redeploy

Images are stored on ImgBB's free CDN permanently. No Firebase Storage needed.

---

## 🔥 Firebase Console — Realtime DB Rules

Go to: Firebase Console → Realtime Database → Rules → paste from /app/FIREBASE_RTDB_RULES.json → Publish

---

## 🎬 OBS Browser Source Setup

| Setting | Value |
|---|---|
| Width | `1920` |
| Height | `1080` |
| Custom CSS | `body { background: transparent !important; }` |
| Shutdown when not visible | ❌ OFF |

Each overlay has its own permanent URL:
`https://your-domain.vercel.app/overlay/{screen}?token={your-share-token}`

Screens: `scoreboard` · `killfeed` · `standings` · `mvp` · `champions` · `casters` · `blank` · `maplabel` · `teams`

---

## 💰 Subscription Plans (pre-configured)

| Plan | Price | Duration |
|---|---|---|
| Weekly | NPR 299 | 7 days |
| Monthly | NPR 599 | 30 days |
| Yearly | NPR 2,999 | 365 days |

## 🎟️ Promo Codes (pre-seeded in DB)

| Code | Discount | Status |
|---|---|---|
| `BOOYAH50` | 50% off any plan | Active |
| `LAUNCH25` | 25% off monthly/yearly | Active |
| `FREEMONTH` | 100% off monthly | Disabled (enable in admin panel) |
