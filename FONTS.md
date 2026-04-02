# Font Setup Instructions

This game uses self-hosted fonts to ensure it works completely offline. You need to download the font files manually.

## Required Fonts

1. **Baloo 2** - Used for headings and labels
   - Weight: Regular (400) - browser will fake-bold when needed
   - Format: woff2

2. **Nunito** - Used for body text
   - Weight: Regular (400) - browser will fake-bold when needed
   - Format: woff2

## Download Instructions

### Option 1: Using google-webfonts-helper (Recommended)

1. Visit [google-webfonts-helper](https://gwfh.mranftl.com/fonts)

2. For **Baloo 2**:
   - Search for "Baloo 2"
   - Select charset: `latin`
   - Select style: `regular` (400)
   - Choose "Modern Browsers" (woff2 only)
   - Click "Download files"
   - Extract `baloo-2-vXX-latin-regular.woff2` (version number may vary)
   - Save as-is to `app/assets/fonts/`
   - Expected filename: `baloo-2-v23-latin-regular.woff2` (or similar)

3. For **Nunito**:
   - Search for "Nunito"
   - Select charset: `latin`
   - Select style: `regular` (400)
   - Choose "Modern Browsers" (woff2 only)
   - Click "Download files"
   - Extract `nunito-vXX-latin-regular.woff2` (version number may vary)
   - Save as-is to `app/assets/fonts/`
   - Expected filename: `nunito-v32-latin-regular.woff2` (or similar)

### Option 2: Using Google Fonts Directly

1. Visit [Google Fonts](https://fonts.google.com/)

2. Download **Baloo 2**:
   - Search and select "Baloo 2"
   - Click "Get font" → "Download all"
   - Extract ZIP and find the `static/Baloo2-Regular.ttf` file
   - Convert to woff2 using a tool like [CloudConvert](https://cloudconvert.com/ttf-to-woff2)
   - Rename to match google-webfonts-helper format: `baloo-2-v23-latin-regular.woff2`
   - Save in `app/assets/fonts/`

3. Download **Nunito**:
   - Search and select "Nunito"
   - Click "Get font" → "Download all"
   - Extract ZIP and find `static/Nunito-Regular.ttf`
   - Convert to woff2
   - Rename to match google-webfonts-helper format: `nunito-v32-latin-regular.woff2`
   - Save in `app/assets/fonts/`

## Verify Installation

After downloading, your `app/assets/fonts/` directory should contain:

```
app/assets/fonts/
├── baloo-2-v23-latin-regular.woff2  (or similar version)
└── nunito-v32-latin-regular.woff2   (or similar version)
```

**Note:** Version numbers (v23, v32) may differ depending on when you download. The important part is the `latin-regular.woff2` suffix.

## Testing

1. Start the development server:
   ```bash
   make dev
   ```

2. Open http://localhost:8080 in your browser

3. Open browser DevTools → Network tab

4. Look for font requests - they should:
   - Load successfully (200 status)
   - Come from local server (not external CDN)
   - Show correct MIME type: `font/woff2`

## Fallback Behavior

If fonts fail to load, the game will fall back to system fonts:
- Headings: System sans-serif
- Body: System sans-serif

The game will still be playable but won't look as polished.

## Licence

Both Baloo 2 and Nunito are licensed under the SIL Open Font Licence 1.1, which allows for free use including commercial projects.
