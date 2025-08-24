# SPHINX Landing (Vite + React + Tailwind)

A production‑ready starter with:
- Fullscreen video background
- Transparent, blurred navbar (on scroll)
- Centered hero with SPHINX title
- Countdown timer (IST) to Nov 7, 2025
- Smooth section links and responsive layout

## Run locally
```bash
npm install
npm run dev
```
Open the URL that Vite prints (usually http://localhost:5173).

## Build & preview
```bash
npm run build
npm run preview
```

## Deploy
- Push to GitHub and deploy on Vercel or Netlify (both support Vite out of the box).
- Or host the `dist/` folder on any static host.

## Change the event date
Edit `src/components/Countdown.jsx` and update:
```js
const EVENT_ISO = '2025-11-07T00:00:00+05:30'
```

## Replace the video
Put your MP4 in `public/` and ensure the filename matches in `Landing.jsx`.
