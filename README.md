# School Air Response

A multi-source environmental monitoring and decision-support system for
Indian schools. Fuses regional fire activity, outdoor pollution, modeled
indoor air quality, weather, and exposure indicators into explainable
protective actions and bilingual parent communications.

**The one-sentence pitch:** Every recommendation carries its own evidence
— that's the difference between a dashboard and a decision system.

## What it does
- Live outdoor PM2.5, PM10, NO2, O3, CO for three schools
  (Delhi, Mumbai, Bengaluru) via Open-Meteo Air Quality
- Live weather: temperature, humidity, wind speed and direction
- Regional fire events (Punjab/Haryana stubble burning, forest fires)
- Modeled indoor PM2.5 using a single-zone mass-balance model with a
  user-controlled HEPA filtration slider
- Five explainable risk rules aligned to India's CPCB PM2.5 scale
- Tiered protective actions (green / yellow / orange / red)
- Bilingual parent comms kit (English + Hindi), one-click copy
- Historical replay scrubber — watch a week of data in 26 seconds

## What makes it different
1. **Source attribution** — stubble burning vs traffic vs dust. Each has
   a different action.
2. **Indoor/outdoor ratio** — does the building actually protect kids?
3. **Explainable rules** — every action carries its own evidence trail.
   Not "risk elevated" but "PM2.5 is 81 µg/m³, 1.4× the CPCB threshold."
4. **Bilingual by default** — English and Hindi carry equal weight.
5. **Historical replay** — turns a static dashboard into a narrative.

## Run locally
    npm install
    npm run dev
    # open http://localhost:5173

## Deploy
See `DEPLOY.md`. Hackathon requires AWS; the target architecture is
S3 + CloudFront for the frontend and Lambda + API Gateway for the fire
feed.

## Project structure
    src/
      data/       API fetchers + normalization (Open-Meteo, EONET)
      model/      Indoor PM2.5 mass-balance model
      rules/      Rule engine + tier logic + bilingual templates
      components/ UI components (cards, chart, sliders, comms kit)
      App.jsx     Orchestration

## Non-goals
- Real indoor hardware (indoor PM2.5 is modeled, not measured)
- ML models (rules, not ML)
- SMS delivery (render only)
- User accounts, persistence, multi-tenant admin

## Reference programs
- CPCB (Central Pollution Control Board) — India's national AQI scale
- SAFAR (System of Air Quality and Weather Forecasting And Research)
- GRAP (Graded Response Action Plan) — Delhi-NCR emergency measures

## Status
Hackathon build — October 2026.
