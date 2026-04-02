/**
 * map.js - Star map SVG rendering, interaction, and flight animation
 */

import { createMapRocket } from './rocket.js';
import { calculateCurrentFuel } from './scoring.js';

// Constants
const HOME_X = 100;
const HOME_Y = 300;
const ROCKET_SPEED = 200; // pixels per second
const PAUSE_DURATION = 650; // ms at each planet
const MIN_HIT_RADIUS = 44; // minimum touch target
const PLAY_AREA_WIDTH = 800; // Core play area width
const PLAY_AREA_HEIGHT = 600; // Core play area height

// ViewBox state (updated dynamically based on screen size)
let viewBoxX = 0;
let viewBoxY = 0;
let viewBoxWidth = 800;
let viewBoxHeight = 600;

// State
let currentLevel = null;
let plannedRoute = [];
let ghostTrail = null;
let callbacks = {};
let fuelCostPerPixel = 0;
let fuelStart = 1.0;

// Animation state
let animationState = null;
let animationFrameId = null;

// DOM elements
const svg = document.getElementById('star-map');
const backgroundLayer = document.getElementById('background-layer');
const objectsLayer = document.getElementById('objects-layer');
const plannedRouteLine = document.getElementById('planned-route');
const traveledPathLine = document.getElementById('traveled-path');
const ghostTrailLine = document.getElementById('ghost-trail');
const mapRocketGroup = document.getElementById('map-rocket');
const effectsLayer = document.getElementById('effects-layer');
const undoBtn = document.getElementById('undo-btn');
const clearBtn = document.getElementById('clear-btn');
const launchBtn = document.getElementById('launch-btn');
const fuelGaugeFill = document.getElementById('fuel-gauge-fill');
const fuelStatus = document.getElementById('fuel-status');

/**
 * Update viewBox to match container aspect ratio
 */
function updateViewBox() {
  const container = svg.parentElement;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  if (containerWidth === 0 || containerHeight === 0) {
    // Container not visible yet, use defaults
    return;
  }

  const containerAspect = containerWidth / containerHeight;
  const playAreaAspect = PLAY_AREA_WIDTH / PLAY_AREA_HEIGHT;

  if (containerAspect > playAreaAspect) {
    // Container is wider than play area - expand width
    viewBoxWidth = PLAY_AREA_HEIGHT * containerAspect;
    viewBoxHeight = PLAY_AREA_HEIGHT;
    viewBoxX = -(viewBoxWidth - PLAY_AREA_WIDTH) / 2;
    viewBoxY = 0;
  } else {
    // Container is taller than play area - expand height
    viewBoxWidth = PLAY_AREA_WIDTH;
    viewBoxHeight = PLAY_AREA_WIDTH / containerAspect;
    viewBoxX = 0;
    viewBoxY = -(viewBoxHeight - PLAY_AREA_HEIGHT) / 2;
  }

  svg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
  console.log(`[Map] ViewBox updated: ${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
}

/**
 * Initialize the map for a level
 */
export function initMap(level, options = {}) {
  console.log('[Map] Initializing map for level:', level.name);
  console.log('[Map] Planets:', level.planets);
  currentLevel = level;
  plannedRoute = [];
  ghostTrail = options.ghostTrail || null;
  callbacks = {
    onPlanetClick: options.onPlanetClick || (() => {}),
    onUndo: options.onUndo || (() => {}),
    onClear: options.onClear || (() => {})
  };
  fuelStart = options.fuelStart || 1.0;

  // Update viewBox to match screen size
  updateViewBox();

  // Clear previous content
  clearMap();

  // Render background
  renderBackground();

  // Render home station
  renderHomeStation();

  // Render planets
  level.planets.forEach((planet, index) => {
    renderPlanet(planet, index);
  });

  // Render ghost trail if available
  if (ghostTrail && ghostTrail.length > 0) {
    renderGhostTrail(ghostTrail);
  }

  // Setup controls
  setupControls();

  // Initialize fuel gauge (always relative to full tank = 1.0)
  updateFuelDisplay(fuelStart, 1.0, false);
}

/**
 * Clear all map content
 */
export function clearMap() {
  backgroundLayer.innerHTML = '';
  objectsLayer.innerHTML = '';
  effectsLayer.innerHTML = '';
  plannedRouteLine.setAttribute('points', '');
  traveledPathLine.setAttribute('points', '');
  ghostTrailLine.setAttribute('points', '');
  mapRocketGroup.innerHTML = '';
  mapRocketGroup.classList.add('hidden');

  // Stop any animation
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

/**
 * Render starfield background
 */
function renderBackground() {
  // Nebula clouds
  const nebulae = [
    { cx: 200, cy: 150, rx: 180, ry: 140, color: '#4a148c' },
    { cx: 600, cy: 400, rx: 200, ry: 150, color: '#1a237e' },
    { cx: 700, cy: 100, rx: 140, ry: 120, color: '#b71c1c' }
  ];

  nebulae.forEach((neb, i) => {
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', neb.cx);
    ellipse.setAttribute('cy', neb.cy);
    ellipse.setAttribute('rx', neb.rx);
    ellipse.setAttribute('ry', neb.ry);
    ellipse.setAttribute('fill', neb.color);
    ellipse.setAttribute('opacity', '0.15');
    ellipse.setAttribute('filter', 'blur(40px)');
    backgroundLayer.appendChild(ellipse);
  });

  // Starfield (3 depth layers)
  const starCounts = [80, 50, 30]; // far, mid, near
  const starSizes = [0.8, 1.2, 1.8];
  const starOpacities = [0.4, 0.6, 0.9];

  starCounts.forEach((count, layer) => {
    for (let i = 0; i < count; i++) {
      const x = viewBoxX + Math.random() * viewBoxWidth;
      const y = viewBoxY + Math.random() * viewBoxHeight;
      const size = starSizes[layer] * (0.8 + Math.random() * 0.4);

      const star = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      star.setAttribute('cx', x);
      star.setAttribute('cy', y);
      star.setAttribute('r', size);
      star.setAttribute('fill', '#ffffff');
      star.setAttribute('opacity', starOpacities[layer]);

      // Some stars twinkle
      if (layer === 2 && Math.random() < 0.3) {
        const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        anim.setAttribute('attributeName', 'opacity');
        anim.setAttribute('values', `${starOpacities[layer]}; ${starOpacities[layer] * 0.4}; ${starOpacities[layer]}`);
        anim.setAttribute('dur', `${2 + Math.random() * 2}s`);
        anim.setAttribute('repeatCount', 'indefinite');
        star.appendChild(anim);
      }

      // Some stars have color
      if (Math.random() < 0.1) {
        const colors = ['#ffebee', '#e3f2fd', '#fff3e0'];
        star.setAttribute('fill', colors[Math.floor(Math.random() * colors.length)]);
      }

      backgroundLayer.appendChild(star);
    }
  });
}

/**
 * Render home station
 */
function renderHomeStation() {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'home-station');
  g.setAttribute('transform', `translate(${HOME_X}, ${HOME_Y})`);

  // Glow
  const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  glow.setAttribute('cx', '0');
  glow.setAttribute('cy', '0');
  glow.setAttribute('r', '35');
  glow.setAttribute('fill', '#64a0ff');
  glow.setAttribute('opacity', '0.15');
  glow.setAttribute('filter', 'blur(8px)');
  g.appendChild(glow);

  // Main structure
  const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  body.setAttribute('x', '-15');
  body.setAttribute('y', '-12');
  body.setAttribute('width', '30');
  body.setAttribute('height', '24');
  body.setAttribute('rx', '4');
  body.setAttribute('fill', '#5a7a9a');
  body.setAttribute('stroke', '#7a9aba');
  body.setAttribute('stroke-width', '1.5');
  g.appendChild(body);

  // Solar panels
  const panelLeft = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  panelLeft.setAttribute('x', '-35');
  panelLeft.setAttribute('y', '-8');
  panelLeft.setAttribute('width', '18');
  panelLeft.setAttribute('height', '16');
  panelLeft.setAttribute('fill', '#1e3a5f');
  panelLeft.setAttribute('stroke', '#3a5a7f');
  panelLeft.setAttribute('stroke-width', '1');
  g.appendChild(panelLeft);

  const panelRight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  panelRight.setAttribute('x', '17');
  panelRight.setAttribute('y', '-8');
  panelRight.setAttribute('width', '18');
  panelRight.setAttribute('height', '16');
  panelRight.setAttribute('fill', '#1e3a5f');
  panelRight.setAttribute('stroke', '#3a5a7f');
  panelRight.setAttribute('stroke-width', '1');
  g.appendChild(panelRight);

  // Docking port glow
  const dockingGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dockingGlow.setAttribute('cx', '0');
  dockingGlow.setAttribute('cy', '0');
  dockingGlow.setAttribute('r', '6');
  dockingGlow.setAttribute('fill', '#4ade80');
  dockingGlow.setAttribute('opacity', '0.6');

  const pulseAnim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
  pulseAnim.setAttribute('attributeName', 'opacity');
  pulseAnim.setAttribute('values', '0.6; 0.3; 0.6');
  pulseAnim.setAttribute('dur', '2s');
  pulseAnim.setAttribute('repeatCount', 'indefinite');
  dockingGlow.appendChild(pulseAnim);
  g.appendChild(dockingGlow);

  // Label
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', '0');
  label.setAttribute('y', '-25');
  label.setAttribute('text-anchor', 'middle');
  label.setAttribute('fill', '#ffffff');
  label.setAttribute('font-size', '11');
  label.setAttribute('font-weight', '700');
  label.setAttribute('class', 'planet-label');
  label.textContent = 'HOME';
  g.appendChild(label);

  objectsLayer.appendChild(g);
}

/**
 * Render a planet
 */
function renderPlanet(planet, index) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'planet');
  g.setAttribute('data-index', index);
  g.setAttribute('transform', `translate(${planet.x}, ${planet.y})`);

  // Hit zone (invisible, larger for touch)
  const hitRadius = Math.max(planet.radius + 10, MIN_HIT_RADIUS / 2);
  const hitZone = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  hitZone.setAttribute('cx', '0');
  hitZone.setAttribute('cy', '0');
  hitZone.setAttribute('r', hitRadius);
  hitZone.setAttribute('fill', 'transparent');
  hitZone.setAttribute('cursor', 'pointer');
  hitZone.addEventListener('click', () => handlePlanetClick(index));
  hitZone.addEventListener('touchend', (e) => {
    e.preventDefault();
    handlePlanetClick(index);
  });
  g.appendChild(hitZone);

  // Atmosphere glow
  const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  glow.setAttribute('cx', '0');
  glow.setAttribute('cy', '0');
  glow.setAttribute('r', planet.radius + 8);
  glow.setAttribute('fill', planet.color);
  glow.setAttribute('opacity', '0.2');
  glow.setAttribute('filter', 'blur(6px)');
  glow.setAttribute('pointer-events', 'none');
  g.appendChild(glow);

  // Planet body
  const body = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  body.setAttribute('class', 'planet-body');
  body.setAttribute('cx', '0');
  body.setAttribute('cy', '0');
  body.setAttribute('r', planet.radius);
  body.setAttribute('fill', planet.color);
  body.setAttribute('pointer-events', 'none');
  g.appendChild(body);

  // Type-specific details
  if (planet.type === 'rocky') {
    // Craters
    const craters = [[4, -6, 5], [-8, 3, 6], [6, 8, 4]];
    craters.forEach(([cx, cy, r]) => {
      const crater = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      crater.setAttribute('cx', cx);
      crater.setAttribute('cy', cy);
      crater.setAttribute('r', r);
      crater.setAttribute('fill', '#000');
      crater.setAttribute('opacity', '0.2');
      crater.setAttribute('pointer-events', 'none');
      g.appendChild(crater);
    });
  } else if (planet.type === 'ringed') {
    // Rings
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ring.setAttribute('cx', '0');
    ring.setAttribute('cy', '0');
    ring.setAttribute('rx', planet.radius + 12);
    ring.setAttribute('ry', '6');
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', planet.color);
    ring.setAttribute('stroke-width', '3');
    ring.setAttribute('opacity', '0.6');
    ring.setAttribute('pointer-events', 'none');
    g.appendChild(ring);
  } else if (planet.type === 'gas') {
    // Gas bands
    const bands = [-8, 0, 8];
    bands.forEach(y => {
      const band = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      band.setAttribute('cx', '0');
      band.setAttribute('cy', y);
      band.setAttribute('rx', planet.radius - 4);
      band.setAttribute('ry', '4');
      band.setAttribute('fill', '#000');
      band.setAttribute('opacity', '0.15');
      band.setAttribute('pointer-events', 'none');
      g.appendChild(band);
    });
    // Great spot
    const spot = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    spot.setAttribute('cx', '10');
    spot.setAttribute('cy', '5');
    spot.setAttribute('rx', '8');
    spot.setAttribute('ry', '6');
    spot.setAttribute('fill', '#d35400');
    spot.setAttribute('opacity', '0.6');
    spot.setAttribute('pointer-events', 'none');
    g.appendChild(spot);
  } else if (planet.type === 'crystal') {
    // Crystal formations
    const crystals = [
      'M -6 -10 L -2 -18 L 2 -10 Z',
      'M 8 -4 L 14 -6 L 12 0 Z',
      'M 6 10 L 10 16 L 4 14 Z'
    ];
    crystals.forEach(d => {
      const crystal = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      crystal.setAttribute('d', d);
      crystal.setAttribute('fill', '#fff');
      crystal.setAttribute('opacity', '0.4');
      crystal.setAttribute('pointer-events', 'none');
      g.appendChild(crystal);
    });
  } else if (planet.type === 'station') {
    // Space station - hexagonal structure
    const hexagon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const hexPoints = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 30) * Math.PI / 180;
      const x = Math.cos(angle) * planet.radius * 0.8;
      const y = Math.sin(angle) * planet.radius * 0.8;
      hexPoints.push(`${x},${y}`);
    }
    hexagon.setAttribute('points', hexPoints.join(' '));
    hexagon.setAttribute('fill', '#34495e');
    hexagon.setAttribute('stroke', planet.color);
    hexagon.setAttribute('stroke-width', '2');
    hexagon.setAttribute('pointer-events', 'none');
    g.appendChild(hexagon);

    // Solar panels
    const panelLeft = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    panelLeft.setAttribute('x', -planet.radius - 8);
    panelLeft.setAttribute('y', -6);
    panelLeft.setAttribute('width', '8');
    panelLeft.setAttribute('height', '12');
    panelLeft.setAttribute('fill', '#1e3a5f');
    panelLeft.setAttribute('stroke', '#3a5a7f');
    panelLeft.setAttribute('stroke-width', '1');
    panelLeft.setAttribute('pointer-events', 'none');
    g.appendChild(panelLeft);

    const panelRight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    panelRight.setAttribute('x', planet.radius);
    panelRight.setAttribute('y', -6);
    panelRight.setAttribute('width', '8');
    panelRight.setAttribute('height', '12');
    panelRight.setAttribute('fill', '#1e3a5f');
    panelRight.setAttribute('stroke', '#3a5a7f');
    panelRight.setAttribute('stroke-width', '1');
    panelRight.setAttribute('pointer-events', 'none');
    g.appendChild(panelRight);

    // Antenna
    const antenna = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    antenna.setAttribute('x1', '0');
    antenna.setAttribute('y1', -planet.radius * 0.8);
    antenna.setAttribute('x2', '0');
    antenna.setAttribute('y2', -planet.radius * 1.3);
    antenna.setAttribute('stroke', planet.color);
    antenna.setAttribute('stroke-width', '2');
    antenna.setAttribute('pointer-events', 'none');
    g.appendChild(antenna);

    const antennaTop = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    antennaTop.setAttribute('cx', '0');
    antennaTop.setAttribute('cy', -planet.radius * 1.3);
    antennaTop.setAttribute('r', '3');
    antennaTop.setAttribute('fill', '#e74c3c');
    antennaTop.setAttribute('pointer-events', 'none');
    g.appendChild(antennaTop);
  }

  // Lighting highlight (only for planets, not stations)
  if (planet.type !== 'station') {
    const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    highlight.setAttribute('cx', -planet.radius * 0.25);
    highlight.setAttribute('cy', -planet.radius * 0.25);
    highlight.setAttribute('r', planet.radius * 0.4);
    highlight.setAttribute('fill', '#ffffff');
    highlight.setAttribute('opacity', '0.25');
    highlight.setAttribute('pointer-events', 'none');
    g.appendChild(highlight);
  }

  // Labels
  const nameLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  nameLabel.setAttribute('x', '0');
  nameLabel.setAttribute('y', planet.radius + 18);
  nameLabel.setAttribute('text-anchor', 'middle');
  nameLabel.setAttribute('fill', '#ffffff');
  nameLabel.setAttribute('font-size', '11');
  nameLabel.setAttribute('font-weight', '700');
  nameLabel.setAttribute('class', 'planet-label');
  nameLabel.setAttribute('pointer-events', 'none');
  nameLabel.textContent = planet.name;
  g.appendChild(nameLabel);

  const crewLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  crewLabel.setAttribute('x', '0');
  crewLabel.setAttribute('y', planet.radius + 30);
  crewLabel.setAttribute('text-anchor', 'middle');
  crewLabel.setAttribute('pointer-events', 'none');
  crewLabel.setAttribute('fill', 'rgba(255,255,255,0.7)');
  crewLabel.setAttribute('font-size', '9');
  crewLabel.setAttribute('class', 'planet-label crew-status-label');
  crewLabel.setAttribute('data-planet-index', index);
  crewLabel.textContent = `${planet.crew} is here!`;
  g.appendChild(crewLabel);

  objectsLayer.appendChild(g);
}

/**
 * Handle planet click
 */
function handlePlanetClick(index) {
  console.log('[Map] handlePlanetClick called with index:', index);
  // Check if already in route
  if (plannedRoute.includes(index)) {
    console.log('[Map] Planet already in route');
    return;
  }

  plannedRoute.push(index);
  console.log('[Map] Updated route:', plannedRoute);
  callbacks.onPlanetClick(index);

  updatePlannedRoute();
  updateControls();
}

/**
 * Update planned route polyline
 */
function updatePlannedRoute() {
  const points = [HOME_X, HOME_Y];

  plannedRoute.forEach(index => {
    const planet = currentLevel.planets[index];
    points.push(planet.x, planet.y);
  });

  // Return home if route complete
  if (plannedRoute.length === currentLevel.planets.length) {
    points.push(HOME_X, HOME_Y);
  }

  plannedRouteLine.setAttribute('points', points.join(','));

  // Update order badges
  updateOrderBadges();
}

/**
 * Update order badges on planets
 */
function updateOrderBadges() {
  // Remove existing badges
  document.querySelectorAll('.order-badge').forEach(el => el.remove());

  // Add badges for planets in route
  plannedRoute.forEach((planetIndex, order) => {
    const planet = currentLevel.planets[planetIndex];
    const badge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    badge.setAttribute('class', 'order-badge');
    badge.setAttribute('transform', `translate(${planet.x}, ${planet.y - planet.radius - 8})`);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', '10');
    circle.setAttribute('fill', '#ffd700');
    circle.setAttribute('stroke', '#b8860b');
    circle.setAttribute('stroke-width', '2');
    badge.appendChild(circle);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '0');
    text.setAttribute('dy', '4');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#000');
    text.setAttribute('font-size', '11');
    text.setAttribute('font-weight', '700');
    text.textContent = order + 1;
    badge.appendChild(text);

    objectsLayer.appendChild(badge);
  });
}

/**
 * Update control button states
 */
function updateControls() {
  undoBtn.disabled = plannedRoute.length === 0;
  clearBtn.disabled = plannedRoute.length === 0;
  launchBtn.disabled = plannedRoute.length !== currentLevel.planets.length;
}

/**
 * Setup control button event listeners
 */
function setupControls() {
  undoBtn.addEventListener('click', handleUndo);
  clearBtn.addEventListener('click', handleClear);
}

/**
 * Handle undo
 */
function handleUndo() {
  if (plannedRoute.length === 0) return;

  plannedRoute.pop();
  callbacks.onUndo();

  updatePlannedRoute();
  updateControls();
}

/**
 * Handle clear
 */
function handleClear() {
  if (plannedRoute.length === 0) return;

  plannedRoute = [];
  callbacks.onClear();

  updatePlannedRoute();
  updateControls();
}

/**
 * Render ghost trail from previous route
 */
function renderGhostTrail(routeIndices) {
  const points = [HOME_X, HOME_Y];

  routeIndices.forEach(index => {
    const planet = currentLevel.planets[index];
    points.push(planet.x, planet.y);
  });

  points.push(HOME_X, HOME_Y);

  ghostTrailLine.setAttribute('points', points.join(','));
}

/**
 * Set planning mode
 */
export function setPlanningMode() {
  svg.style.cursor = 'crosshair';
  document.querySelectorAll('.planet').forEach(el => {
    el.style.pointerEvents = 'auto';
  });
}

/**
 * Set launch mode and start animation
 */
export function setLaunchMode(route, options = {}) {
  plannedRoute = route;
  fuelCostPerPixel = options.fuelCostPerPixel || 0;
  fuelStart = options.fuelStart || 1.0;

  // Lock controls
  svg.style.cursor = 'default';
  document.querySelectorAll('.planet').forEach(el => {
    el.style.pointerEvents = 'none';
  });
  undoBtn.disabled = true;
  clearBtn.disabled = true;
  launchBtn.disabled = true;

  // Fade planned route
  plannedRouteLine.setAttribute('opacity', '0.25');

  // Build waypoints
  const waypoints = [{ x: HOME_X, y: HOME_Y, type: 'home' }];
  route.forEach(index => {
    const planet = currentLevel.planets[index];
    waypoints.push({ x: planet.x, y: planet.y, type: 'planet', index });
  });
  waypoints.push({ x: HOME_X, y: HOME_Y, type: 'home' });

  // Build timeline
  const timeline = buildTimeline(waypoints);

  // Create map rocket
  mapRocketGroup.innerHTML = '';
  const rocket = createMapRocket();
  mapRocketGroup.appendChild(rocket);
  mapRocketGroup.classList.remove('hidden');

  // Start animation
  animationState = {
    timeline,
    waypoints,
    startTime: performance.now(),
    lastAngle: -90, // rocket points up by default
    firedBursts: new Set(),
    distanceTraveled: 0,
    onComplete: options.onComplete || (() => {}),
    onFuelFailure: options.onFuelFailure || (() => {})
  };

  animateRocket();
}

/**
 * Build flight timeline
 */
function buildTimeline(waypoints) {
  const events = [];
  let currentTime = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];

    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const flyDuration = (dist / ROCKET_SPEED) * 1000; // ms

    events.push({
      type: 'fly',
      from,
      to,
      start: currentTime,
      end: currentTime + flyDuration,
      distance: dist
    });

    currentTime += flyDuration;

    // Add pause at planets (not at final home)
    if (i < waypoints.length - 2) {
      events.push({
        type: 'pause',
        at: to,
        planetIndex: to.index,
        start: currentTime,
        end: currentTime + PAUSE_DURATION
      });

      currentTime += PAUSE_DURATION;
    }
  }

  return events;
}

/**
 * Rocket animation loop
 */
function animateRocket() {
  const elapsed = performance.now() - animationState.startTime;
  const timeline = animationState.timeline;

  // Find current event
  const currentEvent = timeline.find(e => elapsed >= e.start && elapsed < e.end);

  if (!currentEvent) {
    // Animation complete
    finishAnimation();
    return;
  }

  if (currentEvent.type === 'fly') {
    // Calculate position
    const progress = (elapsed - currentEvent.start) / (currentEvent.end - currentEvent.start);
    const x = currentEvent.from.x + (currentEvent.to.x - currentEvent.from.x) * progress;
    const y = currentEvent.from.y + (currentEvent.to.y - currentEvent.from.y) * progress;

    // Calculate rotation
    const dx = currentEvent.to.x - currentEvent.from.x;
    const dy = currentEvent.to.y - currentEvent.from.y;
    const angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    animationState.lastAngle = angle;

    // Update rocket position
    mapRocketGroup.setAttribute('transform', `translate(${x},${y}) rotate(${angle})`);

    // Update traveled path
    const traveledDist = animationState.distanceTraveled + currentEvent.distance * progress;
    updateTraveledPath(traveledDist);

    // Update fuel (always relative to full tank = 1.0)
    const currentFuel = calculateCurrentFuel(fuelStart, traveledDist, fuelCostPerPixel);
    updateFuelDisplay(currentFuel, 1.0, true);

    // Check fuel failure
    if (currentFuel <= 0) {
      handleFuelFailure();
      return;
    }
  } else if (currentEvent.type === 'pause') {
    // Hold position and rotation
    const x = currentEvent.at.x;
    const y = currentEvent.at.y;
    mapRocketGroup.setAttribute('transform', `translate(${x},${y}) rotate(${animationState.lastAngle})`);

    // Fire burst once and update distance traveled once
    if (!animationState.firedBursts.has(currentEvent.planetIndex)) {
      fireBurst(x, y, currentLevel.planets[currentEvent.planetIndex].color);
      updateCrewLabel(currentEvent.planetIndex, true);
      animationState.firedBursts.add(currentEvent.planetIndex);

      // Add the previous fly segment's distance (only once)
      const prevEvent = timeline[timeline.indexOf(currentEvent) - 1];
      if (prevEvent && prevEvent.type === 'fly') {
        animationState.distanceTraveled += prevEvent.distance;
      }
    }
  }

  animationFrameId = requestAnimationFrame(() => animateRocket());
}

/**
 * Update traveled path polyline
 */
function updateTraveledPath(totalDistance) {
  const points = [HOME_X, HOME_Y];
  let remainingDist = totalDistance;

  for (let i = 0; i < plannedRoute.length + 1; i++) {
    let from = i === 0 ? { x: HOME_X, y: HOME_Y } : currentLevel.planets[plannedRoute[i - 1]];
    let to = i < plannedRoute.length ? currentLevel.planets[plannedRoute[i]] : { x: HOME_X, y: HOME_Y };

    const segmentDist = Math.hypot(to.x - from.x, to.y - from.y);

    if (remainingDist >= segmentDist) {
      points.push(to.x, to.y);
      remainingDist -= segmentDist;
    } else {
      // Partial segment
      const ratio = remainingDist / segmentDist;
      const partialX = from.x + (to.x - from.x) * ratio;
      const partialY = from.y + (to.y - from.y) * ratio;
      points.push(partialX, partialY);
      break;
    }
  }

  traveledPathLine.setAttribute('points', points.join(','));
}

/**
 * Update crew label when planet is reached
 */
function updateCrewLabel(planetIndex, rescued) {
  const crewLabel = document.querySelector(`.crew-status-label[data-planet-index="${planetIndex}"]`);
  if (!crewLabel) return;

  const planet = currentLevel.planets[planetIndex];
  crewLabel.textContent = rescued ? `${planet.crew} rescued!` : `${planet.crew} is here!`;

  // Update color when rescued
  if (rescued) {
    crewLabel.setAttribute('fill', '#4ade80');
  }
}

/**
 * Fire burst effect at planet
 */
function fireBurst(x, y, color) {
  // Create multiple rings for a more dramatic effect
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const burst = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      burst.setAttribute('cx', x);
      burst.setAttribute('cy', y);
      burst.setAttribute('r', '15');
      burst.setAttribute('fill', 'none');
      burst.setAttribute('stroke', color);
      burst.setAttribute('stroke-width', '4');
      burst.setAttribute('opacity', '1');
      burst.setAttribute('class', 'burst-ring');

      effectsLayer.appendChild(burst);

      // Animate using JavaScript for better browser compatibility
      let startTime = null;
      const duration = 800;

      function animate(currentTime) {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Expand radius
        const radius = 15 + progress * 50;
        burst.setAttribute('r', radius);

        // Fade out
        const opacity = 1 - progress;
        burst.setAttribute('opacity', opacity);

        // Fade stroke width
        const strokeWidth = 4 * (1 - progress * 0.5);
        burst.setAttribute('stroke-width', strokeWidth);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          burst.remove();
        }
      }

      requestAnimationFrame(animate);
    }, i * 100); // Stagger each ring by 100ms
  }
}

/**
 * Update fuel display
 */
function updateFuelDisplay(currentFuel, maxFuel, isFlying) {
  const percentage = (currentFuel / maxFuel) * 100;
  fuelGaugeFill.style.height = `${percentage}%`;

  // Danger zone animation
  if (percentage <= 18) {
    fuelGaugeFill.classList.add('danger');
    fuelStatus.textContent = '⚠ Low fuel!';
    fuelStatus.classList.add('warning');
  } else {
    fuelGaugeFill.classList.remove('danger');
    if (isFlying) {
      fuelStatus.textContent = `${Math.round(percentage)}%`;
    } else {
      fuelStatus.textContent = percentage === 100 ? 'Full tank' : `${Math.round(percentage)}%`;
    }
    fuelStatus.classList.remove('warning');
  }
}

/**
 * Handle fuel failure during flight
 */
function handleFuelFailure() {
  // Stop animation
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  // Disable controls
  undoBtn.disabled = true;
  clearBtn.disabled = true;
  launchBtn.disabled = true;

  // Fade out rocket
  mapRocketGroup.style.transition = 'opacity 1.2s ease';
  mapRocketGroup.style.opacity = '0';

  // Show failure overlay after fade
  setTimeout(() => {
    const planetsReached = Array.from(animationState.firedBursts);
    animationState.onFuelFailure(planetsReached);
  }, 1800);
}

/**
 * Finish animation (success)
 */
function finishAnimation() {
  // Fire final burst at home
  fireBurst(HOME_X, HOME_Y, '#4ade80');

  // Calculate final fuel
  const totalDist = animationState.timeline
    .filter(e => e.type === 'fly')
    .reduce((sum, e) => sum + e.distance, 0);
  const finalFuel = calculateCurrentFuel(fuelStart, totalDist, fuelCostPerPixel);

  // Call completion callback after brief pause
  setTimeout(() => {
    animationState.onComplete(finalFuel);
  }, 800);
}

/**
 * Handle window resize - update viewBox to match new dimensions
 */
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (currentLevel) {
      updateViewBox();
      // Regenerate background to fill new viewBox
      backgroundLayer.innerHTML = '';
      renderBackground();
    }
  }, 150);
});
