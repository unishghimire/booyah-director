# 📊 Google Sheets Team/Player Import Setup

Import your tournament roster directly from a Google Spreadsheet.

---

## Step 1 — Create Google Cloud Service Account

1. Go to https://console.cloud.google.com
2. Create or select a project
3. Go to **APIs & Services → Library** → Search **Google Sheets API** → Enable it
4. Go to **IAM & Admin → Service Accounts**
5. Click **Create Service Account** → Name: `booyah-sheets-reader`
6. Role: **Viewer** → Done
7. Click the account → **Keys tab** → **Add Key → Create new key → JSON** → Download

---

## Step 2 — Share Your Google Sheet

1. Open your Google Sheet
2. Click **Share**
3. Paste the `client_email` from the downloaded JSON (e.g. `booyah-sheets-reader@project.iam.gserviceaccount.com`)
4. Give **Viewer** permission → Send

---

## Step 3 — Add to Netlify Environment Variables

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_EMAIL` | `booyah-sheets-reader@your-project.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | The full `private_key` from the JSON file |

---

## Step 4 — Sheet Format

Create a Google Sheet with **exactly these two sheet tabs**:

### Sheet tab: `Teams`
| Column A | Column B | Column C |
|---|---|---|
| Team Name | Logo URL (optional) | Color hex (optional) |
| GODLIKE ESPORTS | https://... | #FF6B00 |
| NOVA ESPORTS | | #00D4FF |

### Sheet tab: `Players`  
| Column A | Column B | Column C |
|---|---|---|
| Player Name | Team Name | Role (optional) |
| VIPER_X | GODLIKE ESPORTS | Fragger |
| SHADOW | GODLIKE ESPORTS | IGL |

> Row 1 is the header row (skipped). Data starts from Row 2.

---

## Step 5 — Import in the App

1. Go to **Data Inputer** panel (`/inputer`)
2. Find the **Google Sheets Import** section
3. Paste your Google Sheet URL
4. Click **IMPORT** — teams and players are added instantly!
