# Deployment Handoff — School Air Response

## What this is
A React + Vite single-page app that shows live air-quality data for three
Indian schools (Delhi, Mumbai, Bengaluru), models indoor PM2.5 with a
physics-based mass-balance model, and produces explainable protective
actions + bilingual parent communications (English + Hindi).

## Stack
- Vite + React (JavaScript, no TypeScript)
- Tailwind v4 via `@tailwindcss/vite`
- Recharts
- No backend, no database, no auth
- Data sources: Open-Meteo Air Quality + Forecast (CORS-enabled, no keys)

## Build
    npm install
    npm run build
    # output: dist/

## Deploy target — AWS (required by the hackathon)
Two moves:

### 1. Static frontend → S3 + CloudFront
- Create S3 bucket: `school-air-response`
- Upload contents of `dist/` (not the folder itself)
- Enable static website hosting
- Create CloudFront distribution pointing at the bucket
- Enable HTTPS via the default CloudFront certificate
- Note the CloudFront URL — this is the live demo URL

### 2. Fire feed → Lambda + API Gateway
NASA EONET is CORS-blocked from the browser. Lambda proxies it.

Lambda (Node.js 20):
    export const handler = async () => {
      const res = await fetch(
        'https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open'
      );
      const json = await res.json();
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(json),
      };
    };

API Gateway: create HTTP API, attach to Lambda, enable CORS, get invoke URL.

Wire it in: in `src/data/fetchFires.js`, replace `MOCK_FIRES` with a fetch
to the API Gateway URL. Rebuild, re-upload to S3, invalidate CloudFront.

## Environment variables
None. All APIs are keyless.

## Known limitations
- Fires currently use a static mock list (Punjab/Haryana stubble burning,
  Uttarakhand forest fires, Karnataka forest fire). The Lambda replaces it
  with live data.
- Indoor PM2.5 is MODELED, not measured. Single-zone mass-balance model
  runs in the browser.

## Verify after deploy
1. Open the CloudFront URL
2. Three cards appear: Delhi, Mumbai, Bengaluru
3. Delhi should show ORANGE or RED in October (stubble-burning season)
4. Click Delhi. The "Why this action?" panel shows a fired rule with a
   real number (e.g. "PM2.5 is 81 µg/m³")
5. Drag the HEPA slider. The indoor line on the chart drops.
6. Click Play on the scrubber. The tier badge changes over time.
7. Toggle EN | हिन्दी. Hindi renders in Devanagari script.

## Demo URL
Paste the CloudFront URL here: ____________________

## Contact
Nikhil Mykana
