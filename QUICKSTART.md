# Quick Start Guide

Get Stella's Rescue Run running in 5 minutes!

## Prerequisites

- Python 3 (for local development server)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## Steps

### 1. Download Fonts

The game needs two font files. Download them using google-webfonts-helper:

**Visit**: https://gwfh.mranftl.com/fonts

**Download these fonts** (select "Modern Browsers" / woff2 only):

- **Baloo 2** → Regular (400) → Save as `app/assets/fonts/baloo-2-v23-latin-regular.woff2` (version may vary)
- **Nunito** → Regular (400) → Save as `app/assets/fonts/nunito-v32-latin-regular.woff2` (version may vary)

See [FONTS.md](FONTS.md) for detailed instructions.

### 2. Start Development Server

```bash
cd stella-tsp-game
make dev
```

Or manually:
```bash
cd stella-tsp-game/app
python3 -m http.server 8080
```

### 3. Open in Browser

Navigate to: **http://localhost:8080**

You should see the mission screen with Stella's rocket!

## What to Try

1. **Training Run** - Learn the basics with 3 planets
   - Click planets in any order
   - Watch how route length affects fuel
   - Try to get 5 stars!

2. **Fuel Warning** - Face a constraint with half tank
   - Some routes will fail!
   - Find the most efficient path

3. **Far Reaches** - Random planets each time
   - 5 planets to visit
   - Different layout every play

## Game Tips

- The **dashed yellow line** shows your planned route
- Watch the **fuel gauge** - it only moves during flight
- **Ghost trail** appears after completing a level (shows your previous route)
- On constrained levels, the fuel gauge opens at the limited amount (e.g., 50%)

## Common Issues

### Fonts don't load
- Check that .woff2 files are in `app/assets/fonts/`
- Check browser console for 404 errors
- Verify file names match exactly (case-sensitive)

### Service Worker issues
- Open in a new incognito/private window
- Or clear browser cache and reload

### Black screen / blank page
- Open browser DevTools console (F12)
- Look for JavaScript errors
- Check that you're using a modern browser

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [FONTS.md](FONTS.md) for font troubleshooting
- See `Makefile` for build and deployment commands

## Development

### Project Structure

```
app/
├── index.html          # Entry point
├── style.css           # All styling
├── sw.js               # Service Worker (offline support)
└── js/
    ├── main.js         # Initialization
    ├── game.js         # Game state machine
    ├── map.js          # SVG rendering and animation
    ├── rocket.js       # Rocket components
    ├── missions.js     # Level definitions
    └── scoring.js      # Fuel model
```

### Making Changes

1. Edit files in `app/` directory
2. Refresh browser (Ctrl+R / Cmd+R)
3. Changes appear immediately (no build step!)

### Adding New Levels

Edit `app/js/missions.js`:

```javascript
{
  name: 'My Level',
  fuelStart: 1.0,  // or 0.5 for constrained
  missionText: 'Custom mission text here',
  planets: [
    { x: 300, y: 200, name: 'ZOG', crew: 'Bob', template: 0 },
    // ... more planets
  ]
}
```

Planet templates: 0=ZOG (red), 1=BLORP (teal), 2=NOOT (yellow), 3=FIZZ (purple)

## Container Deployment

```bash
# Build
make build

# Run locally
make run

# Deploy to OpenShift
make deploy
```

See [README.md](README.md) for full deployment instructions.

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify fonts are downloaded correctly
3. Try in incognito/private mode
4. Check that you're serving via HTTP (not file://)

Enjoy helping Stella rescue her friends! 🚀✨
