# Booyah Director — Admin Panel Setup Guide

This is the secure, standalone administration dashboard for Booyah Director. Built with React 18, Vite, Tailwind CSS, and Netlify serverless functions, it interfaces directly with your Firebase Realtime Database.

## Features Built
1. **Dashboard Overview**: Key metrics including total users, active subscriptions, total revenue (NPR), and current promo codes.
2. **User Management**: Search, toggle user accounts (`active`, `suspended`, `banned`), manually assign or edit premium subscriptions with discount parameters.
3. **Subscription Status Tracking**: Real-time filters showing active, expiring-soon, and expired premium plans.
4. **Promo Codes Control Center**: Create flat or percent-off promo codes, restrict codes to specific premium tiers, customize expiration times, set usage limits, and toggle promo states.
5. **Global Settings**: Configure platform name, support email, maintenance mode toggles, and new registration toggles.

---

## 1. Required Netlify Environment Variables
You must set the following environment variables in your Netlify admin dashboard (**Site Settings > Environment variables**) to configure both client-side and secure serverless backend layers:

### A. Serverless Backend Secure Variables (For Netlify Functions)
* `FIREBASE_DATABASE_URL`: The Realtime Database URL (e.g., `https://your-project-default-rtdb.firebaseio.com/`).
* `FIREBASE_DATABASE_SECRET`: Your Firebase RTDB Database Secret (found in Firebase Console > Project Settings > Service Accounts > Database Secrets).
* `FIREBASE_PROJECT_ID`: Your Firebase project ID (e.g., `booyah-director-123`).
* `FIREBASE_WEB_API_KEY`: Your Firebase Web API Key (found in Firebase Console > Project Settings > General).

### B. Client-side Environment Variables (Vite Prefix)
* `VITE_FIREBASE_API_KEY`
* `VITE_FIREBASE_AUTH_DOMAIN`
* `VITE_FIREBASE_DATABASE_URL`
* `VITE_FIREBASE_PROJECT_ID`
* `VITE_FIREBASE_STORAGE_BUCKET`
* `VITE_FIREBASE_MESSAGING_SENDER_ID`
* `VITE_FIREBASE_APP_ID`

---

## 2. Firebase Database Structure Requirements
To prevent unauthorized users from gaining access, the serverless endpoint expects administrator IDs to be explicitly whitelisted.

Add an admin whitelist entry directly under `/booyah_admin/admins` in your Realtime Database:
```json
{
  "booyah_admin": {
    "admins": {
      "YOUR_ADMIN_USER_UID": {
        "enabled": true,
        "email": "admin@booyah.gg"
      }
    }
  }
}
```

Replace `YOUR_ADMIN_USER_UID` with the specific Firebase Authentication User UID of your admin user. Only authenticated users listed in this database path with `"enabled": true` will pass the secure token validation.

---

## 3. Deployment Command
The codebase is structured to be instantly ready to build and publish. Run the following to build locally or verify dependencies:
```bash
cd booyah-admin
npm install
npm run build
```
The output target will compile into the `/dist/` folder, ready for direct Netlify CDN deployment.
