# Frontend Deployment Guide — AWS Amplify

This guide covers deploying the PaisaWaala React frontend to AWS Amplify.

---

## Prerequisites

- AWS account with Amplify access
- Your backend deployed and accessible (e.g., `https://api.paisawaala.com`)
- Git repository (GitHub, GitLab, Bitbucket, or CodeCommit)

---

## Step 1: Push Code to Git

Amplify deploys from a Git repository. Push your codebase to GitHub (or similar).

---

## Step 2: Create Amplify App

1. Go to **AWS Amplify Console** → **New app** → **Host web app**
2. Connect your Git provider and select your repository
3. Select the branch to deploy (e.g., `main`)

---

## Step 3: Configure Build Settings

Amplify will auto-detect Vite. Override the build settings with:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist/public
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

**Important:** The build output goes to `dist/public` (not just `dist`), because Vite is configured to output there via the existing `vite.config.ts`.

---

## Step 4: Set Environment Variables

In Amplify Console → **App settings** → **Environment variables**, add:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_BASE_URL` | `https://api.paisawaala.com` | Your EC2 backend URL (no trailing slash) |

**Note:** Vite requires the `VITE_` prefix for frontend-accessible env vars. This value gets baked into the build at compile time.

---

## Step 5: Add Rewrites/Redirects for SPA

The app uses client-side routing. Add this rewrite rule in **Amplify Console** → **Rewrites and redirects**:

| Source | Target | Type |
|--------|--------|------|
| `</^[^.]+$\|\.(?!(css\|gif\|ico\|jpg\|js\|png\|txt\|svg\|woff\|woff2\|ttf\|map\|json\|webp)$)([^.]+$)/>` | `/index.html` | 200 (Rewrite) |

This ensures all routes (e.g., `/offers`, `/eligibility`) serve `index.html` and let React handle routing.

---

## Step 6: Custom Domain (Optional)

1. Go to **Domain management** in Amplify Console
2. Add your custom domain (e.g., `app.paisawaala.com`)
3. Amplify will provision an SSL certificate automatically
4. Update your DNS records as instructed by Amplify

---

## Step 7: Verify Deployment

After deployment completes:

1. Open the Amplify URL (e.g., `https://main.d1234abc.amplifyapp.com`)
2. Verify the form loads correctly
3. Open browser DevTools → Network tab → confirm API calls go to your backend URL
4. Test an OTP flow end-to-end

---

## Embed Scripts for External Sites (Webflow, etc.)

The embeddable form scripts need the backend URL passed via a `data-api-url` attribute:

```html
<script
  src="https://app.paisawaala.com/embed/form.js"
  data-api-url="https://api.paisawaala.com"
  data-container="pw-form"
></script>
<div id="pw-form"></div>
```

**For Amplify-hosted embeds:** You'll need to build the embed bundles separately using esbuild. The embed entry points are in `client/src/embed/`. See `paisawalla/WEBFLOW_QUICK_EMBED.txt` for embed reference.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API calls fail with CORS error | Make sure your Amplify domain is added to `CORS_ORIGIN` in the backend `.env` |
| Blank page after deploy | Check that `baseDirectory` is set to `dist/public` in build settings |
| Routes return 404 | Add the SPA rewrite rule from Step 5 |
| API calls go to wrong URL | Verify `VITE_API_BASE_URL` is set in Amplify environment variables, then redeploy |
| Build fails | Make sure `npm ci` runs before `npm run build` (preBuild phase) |

---

## Build Locally (Test Before Deploy)

```bash
# Set the API URL
export VITE_API_BASE_URL=https://api.paisawaala.com

# Build
npm run build

# Preview locally
npx serve dist/public
```
