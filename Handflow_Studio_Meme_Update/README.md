# Handflow — AI Hand Tracking Studio

Handflow is a browser based hand tracking studio with a dark purple dashboard, live webcam preview, 21 point hand skeleton overlay, gesture recognition, and local fullscreen meme reactions.

## Run the website

1. Extract the ZIP file.
2. Open the project folder in VS Code.
3. Start a local web server (for example, VS Code Live Server) and open `index.html` through `localhost`.
4. Allow camera access in the browser and select **Start camera**.

The page loads MediaPipe Hands from jsDelivr, so an internet connection is required. Camera access works on `localhost` or HTTPS. Webcam video is processed in your browser.

## Meme images

The ten meme images supplied for this project are stored in `memes/assets/`. The manifest maps each individual finger and combination to the closest available image. The local image is loaded first and displayed fullscreen for 500 ms. The free CUB SOFTWARE Meme API is used only if a local image cannot be loaded.

## Recognized gestures

Handflow tracks thumb, index, middle, ring, and pinky, and recognizes all five individually plus combinations. Common poses also have friendly categories: `open`, `fist`, `peace`, `point`, `thumb`, `pinch`, and `ok`. Middle finger alone maps to `middle/`. Gesture detection supports up to two hands; meme reaction uses the first detected hand.

## Project files

- `index.html`, `styles.css`, `app.js` — website and hand tracking application.
- `memes/` — separate local image library, category folders, and manifest.
- `figma-dashboard.svg` — editable vector dashboard concept for importing into Figma.

## Figma

Open Figma and drag `figma-dashboard.svg` onto a design canvas. Ungroup the imported vector to edit its elements. This is an SVG design asset, not a Figma cloud document.

## Online meme API

Handflow can fetch fresh, SFW reaction memes from the free, no-key CUB SOFTWARE Meme API. No API secret or Vercel environment variable is required. On Vercel, `api/meme.js` proxies the request and supplies the descriptive User-Agent required by the API. The online source is available when deployed to Vercel; on a static-only local server the app uses local meme images or the gesture label. Each finger and combination maps to a nearby humor category because the API does not provide finger-specific categories. The app caches each category response for the current page session and falls back to your local `memes/` images or gesture label when the API is unavailable. The first request may take longer than the 500 ms reaction window; later gestures can reuse the cached result. API content is loaded from its original URL and is not bundled in the ZIP.

API documentation: https://cubsoftware.site/developer/meme