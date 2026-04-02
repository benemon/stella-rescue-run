# Stella's Rescue Run

A browser-based route optimization game for children aged 7–10. Help Stella the rocket pilot rescue stranded astronauts by plotting efficient routes through space!

## Features

- **Educational gameplay**: Teaches route optimization through intuitive play
- **Offline-first**: Fully playable offline after first load via Service Worker
- **No dependencies**: Pure vanilla JavaScript, no frameworks or build tools
- **Containerized**: Ready for deployment to OpenShift with unprivileged nginx

## Stack

- Vanilla JavaScript (ES modules)
- SVG for all game graphics
- CSS for layout and styling
- Service Worker for offline support
- nginx (unprivileged) for serving static files
- OpenShift-ready Kubernetes manifests

## Project Structure

```
stella-tsp-game/
├── Containerfile              # Container build configuration
├── nginx.conf                 # nginx configuration with proper MIME types
├── k8s/                       # Kubernetes/OpenShift manifests
│   ├── deployment.yaml        # Deployment configuration
│   ├── service.yaml           # Service definition
│   └── route.yaml             # OpenShift Route (TLS edge termination)
└── app/                       # Application files
    ├── index.html             # Entry point
    ├── style.css              # All styles
    ├── sw.js                  # Service Worker
    ├── js/                    # JavaScript modules
    │   ├── main.js            # Entry point, SW registration
    │   ├── game.js            # State machine
    │   ├── map.js             # SVG rendering and animation
    │   ├── rocket.js          # Rocket SVG components
    │   ├── missions.js        # Level definitions
    │   └── scoring.js         # Fuel model and rating
    └── assets/
        └── fonts/             # Self-hosted fonts
```

## Game Mechanics

### Fuel Model

The core mechanic is **absolute fuel consumption** based on distance:

- **Training levels** (full tank): Even the worst possible route barely completes
- **Constrained levels** (partial tank): Only efficient routes complete successfully

Fuel drains in real-time during flight. Poor route planning results in running out of fuel mid-mission.

### Levels

1. **Training Run**: 3 planets, full tank, always completable
2. **Fuel Warning**: 4 planets, half tank, requires planning
3. **Far Reaches**: 5 random planets, full tank, regenerated each play

### Star Rating

Based on fuel remaining at mission end:
- 5 stars: >22% remaining
- 4 stars: >14% remaining
- 3 stars: >8% remaining
- 2 stars: >6% remaining
- 1 star: Mission complete but low fuel

## Development

### Prerequisites

- Modern web browser with ES module support
- Web server for local development (python, nginx, or any static file server)

### Local Development

1. **Download font files**:
   ```bash
   # Use google-webfonts-helper to download Baloo 2 and Nunito
   # Save .woff2 files to app/assets/fonts/
   ```

2. **Run local server**:
   ```bash
   cd app
   python3 -m http.server 8080
   ```

3. **Open browser**:
   ```
   http://localhost:8080
   ```

### Font Setup

The game requires self-hosted fonts (no CDN dependencies):

**Baloo 2**:

- Regular (400): `baloo-2-v23-latin-regular.woff2` (version may vary)

**Nunito**:

- Regular (400): `nunito-v32-latin-regular.woff2` (version may vary)

Download from [google-webfonts-helper](https://gwfh.mranftl.com/fonts) and place in `app/assets/fonts/`.

See [FONTS.md](FONTS.md) for detailed download instructions.

## Building and Deployment

### Build Container

```bash
# Build the container image
podman build -t stella-rescue:latest -f Containerfile .

# Or with Docker
docker build -t stella-rescue:latest -f Containerfile .
```

### Run Locally with Container

```bash
podman run -p 8080:8080 stella-rescue:latest
```

Open http://localhost:8080

### Deploy to OpenShift

1. **Tag and push image**:
   ```bash
   podman tag stella-rescue:latest your-registry/stella-rescue:latest
   podman push your-registry/stella-rescue:latest
   ```

2. **Update deployment.yaml**:
   Replace `your-registry/stella-rescue:latest` with your actual image URL

3. **Apply manifests**:
   ```bash
   oc apply -f k8s/deployment.yaml
   oc apply -f k8s/service.yaml
   oc apply -f k8s/route.yaml
   ```

4. **Get route URL**:
   ```bash
   oc get route stella-rescue
   ```

## Implementation Notes

### Rocket Design

The rocket is a bespoke SVG matching the *Wallace and Gromit: A Grand Day Out* aesthetic:
- Bulbous egg-shaped body (not cylindrical)
- Bright orange-red color throughout
- Geodesic panel seams with dome-headed rivets
- Oval submarine-style porthole with cross handle
- Stubby rounded fins
- Animated flames

Two versions exist:
1. **Mission screen**: Large detailed rocket with full animation
2. **Map rocket**: Simplified 22px version for flight animation

### Flight Rotation

The rocket rotates to face its direction of travel using:

```javascript
const angle = Math.atan2(dx, -dy) * (180 / Math.PI);
```

This is the correct formula for SVG coordinate space where the rocket's nose points upward (negative Y) by default.

### Fuel Calibration

Fuel cost per pixel is calibrated per-level:

```javascript
// Training (full tank): worst route → 5% remaining
fuelCostPerPixel = (fuelStart * 0.95) / worstDist;

// Constrained (partial tank): best route → 25% remaining
fuelCostPerPixel = (fuelStart * 0.75) / bestDist;
```

### Achievability Check

Random planet layouts (Level 2) are validated:
- Best route leaves ≥10% fuel
- Route variation ratio ≥1.25 (worst/best distances)
- Falls back to hardcoded layout after 200 failed attempts

## Performance

- All rendering is SVG-based (hardware accelerated)
- Animation uses `requestAnimationFrame`
- Service Worker provides instant offline loading
- Minimal resource usage (~50MB memory, <50m CPU)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14.1+

Requires:
- ES modules support
- SVG 1.1
- Service Worker API
- `requestAnimationFrame`

## License

Assets: CC0 (Kenney.nl space assets)
Code: [Your License]

## Credits

- Game design and implementation: [Your Name]
- Font: Baloo 2 and Nunito from Google Fonts
- Space assets: Kenney.nl (CC0)
- Inspired by *Wallace and Gromit: A Grand Day Out*
