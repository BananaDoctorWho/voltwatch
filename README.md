# ⚡ VoltWatch — eBike Price Intelligence

## Deploy to Vercel (5 minutes)

### Step 1 — Push to GitHub
1. Create a new repo at github.com (name it `voltwatch`, set Public)
2. Upload ALL files keeping the same folder structure:
   ```
   voltwatch/
   ├── vercel.json
   ├── package.json
   ├── api/
   │   ├── claude.js
   │   └── alert.js
   └── public/
       └── index.html
   ```

### Step 2 — Import to Vercel
1. Go to vercel.com → "Add New Project"
2. Click "Continue with GitHub" → select your `voltwatch` repo
3. Click **Deploy** (no build settings needed)

### Step 3 — Add Environment Variables
In Vercel → your project → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `GROQ_API_KEY` | Your FREE key from console.groq.com |
| `GMAIL_USER` | your.email@gmail.com |
| `GMAIL_APP_PASSWORD` | Your Gmail App Password (see below) |

### Step 4 — Get a Gmail App Password
1. Go to myaccount.google.com → Security
2. Enable **2-Step Verification** (required)
3. Search for "App passwords" → create one named "VoltWatch"
4. Copy the 16-character password → paste as `GMAIL_APP_PASSWORD`

### Step 5 — Redeploy
In Vercel → Deployments → click **Redeploy** to pick up the env variables.

Your site is live at: `https://voltwatch.vercel.app` 🎉

---

## How It Works
- **Scan button** → calls `/api/claude` (proxies to Anthropic API securely)
- **Email alerts** → calls `/api/alert` (sends via Gmail/nodemailer)
- Prices are currently hardcoded — to make them truly live, connect a scraping service like ScraperAPI or Oxylabs
