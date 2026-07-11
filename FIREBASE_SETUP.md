# Firebase Setup Instructions

## 1. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Create new project: "booyah-director"
3. Enable Realtime Database (Start in test mode)
4. Copy your Database URL (looks like: https://booyah-director-default-rtdb.firebaseio.com)

## 2. Get Service Account Credentials
1. Project Settings → Service Accounts
2. Generate New Private Key → Download JSON
3. From the JSON file, copy:
   - project_id → FIREBASE_PROJECT_ID
   - client_email → FIREBASE_CLIENT_EMAIL  
   - private_key → FIREBASE_PRIVATE_KEY (the full key including -----BEGIN...-----END-----)

## 3. Add to Netlify Environment Variables
In Netlify Dashboard → Site Settings → Environment Variables, add:
- FIREBASE_PROJECT_ID = your-project-id
- FIREBASE_CLIENT_EMAIL = firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
- FIREBASE_PRIVATE_KEY = -----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----
- FIREBASE_DATABASE_URL = https://your-project-default-rtdb.firebaseio.com

## 4. Redeploy
After adding env vars, trigger a new deploy in Netlify.
