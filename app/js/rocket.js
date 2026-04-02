/**
 * rocket.js - Wallace & Gromit style rocket component
 * "A Grand Day Out" aesthetic:
 *   - Bulbous orange egg body with radial gradient (3D effect)
 *   - Diagonal geodesic panel seams (not a grid)
 *   - Dome-headed orange rivets at intersections (~50 total)
 *   - Thick oval submarine porthole with cross-wheel handle
 *   - Three large rounded stubby fins (like little feet)
 *   - Layered animated flames
 */

/**
 * Create mission screen rocket (large, detailed)
 */
export function createMissionRocket() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '-90 -132 180 305');
  svg.setAttribute('width', '140');

  // ═══════════════════════════════
  // DEFS: Gradients, symbols, clip paths
  // ═══════════════════════════════

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

  // Body shading: light from upper-left gives round 3D appearance
  const bodyGrad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
  bodyGrad.setAttribute('id', 'body-grad');
  bodyGrad.setAttribute('cx', '28%');
  bodyGrad.setAttribute('cy', '20%');
  bodyGrad.setAttribute('r', '75%');
  bodyGrad.innerHTML = `
    <stop offset="0%" stop-color="#f06030"/>
    <stop offset="55%" stop-color="#e04012"/>
    <stop offset="100%" stop-color="#a82606"/>
  `;
  defs.appendChild(bodyGrad);

  // Subtle rim highlight (second pass over body)
  const bodyRim = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
  bodyRim.setAttribute('id', 'body-rim');
  bodyRim.setAttribute('cx', '20%');
  bodyRim.setAttribute('cy', '16%');
  bodyRim.setAttribute('r', '68%');
  bodyRim.innerHTML = `
    <stop offset="0%" stop-color="rgba(255,180,120,0.32)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
  `;
  defs.appendChild(bodyRim);

  // Porthole frame gradient
  const portGrad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
  portGrad.setAttribute('id', 'port-grad');
  portGrad.setAttribute('cx', '35%');
  portGrad.setAttribute('cy', '28%');
  portGrad.setAttribute('r', '68%');
  portGrad.innerHTML = `
    <stop offset="0%" stop-color="#c83810"/>
    <stop offset="100%" stop-color="#8c1c04"/>
  `;
  defs.appendChild(portGrad);

  // Rivet dome gradient: 3D raised appearance
  const rvGrad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
  rvGrad.setAttribute('id', 'rv-grad');
  rvGrad.setAttribute('cx', '28%');
  rvGrad.setAttribute('cy', '24%');
  rvGrad.setAttribute('r', '68%');
  rvGrad.innerHTML = `
    <stop offset="0%" stop-color="#f07848"/>
    <stop offset="100%" stop-color="#8a1e04"/>
  `;
  defs.appendChild(rvGrad);

  // Body clip path — seam lines are clipped to this shape
  const bodyClip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
  bodyClip.setAttribute('id', 'body-clip');
  const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  clipPath.setAttribute('d', 'M0,-96 C46,-96 68,-44 68,8 C68,54 44,86 20,90 L-20,90 C-44,86 -68,54 -68,8 C-68,-44 -46,-96 0,-96 Z');
  bodyClip.appendChild(clipPath);
  defs.appendChild(bodyClip);

  // Reusable dome-headed rivet
  const rvSymbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
  rvSymbol.setAttribute('id', 'rv');
  rvSymbol.setAttribute('overflow', 'visible');
  const rvCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  rvCircle.setAttribute('r', '3.9');
  rvCircle.setAttribute('fill', 'url(#rv-grad)');
  rvCircle.setAttribute('stroke', '#7a1c04');
  rvCircle.setAttribute('stroke-width', '0.5');
  rvSymbol.appendChild(rvCircle);
  defs.appendChild(rvSymbol);

  svg.appendChild(defs);

  // ═══════════════════════════════
  // STEP 1: FINS (drawn behind body)
  // Three rounded, stubby fins — like little feet
  // ═══════════════════════════════

  // Left fin
  const finLeft = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  finLeft.setAttribute('d', 'M-44,60 C-74,68 -80,94 -62,105 C-48,112 -28,96 -26,74 Z');
  finLeft.setAttribute('fill', '#b82808');
  finLeft.setAttribute('stroke', '#882004');
  finLeft.setAttribute('stroke-width', '1.5');
  svg.appendChild(finLeft);

  // Right fin
  const finRight = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  finRight.setAttribute('d', 'M44,60 C74,68 80,94 62,105 C48,112 28,96 26,74 Z');
  finRight.setAttribute('fill', '#b82808');
  finRight.setAttribute('stroke', '#882004');
  finRight.setAttribute('stroke-width', '1.5');
  svg.appendChild(finRight);

  // Centre rear fin (slightly smaller)
  const finCenter = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  finCenter.setAttribute('d', 'M-17,78 C-14,96 0,108 17,96 C14,80 0,76 -17,78 Z');
  finCenter.setAttribute('fill', '#a02006');
  finCenter.setAttribute('stroke', '#882004');
  finCenter.setAttribute('stroke-width', '1.2');
  svg.appendChild(finCenter);

  // ═══════════════════════════════
  // STEP 2: MAIN BODY
  // Egg/bulb shape — wider in the middle, slightly flat at bottom
  // ═══════════════════════════════

  const body = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  body.setAttribute('d', 'M0,-96 C46,-96 68,-44 68,8 C68,54 44,86 20,90 L-20,90 C-44,86 -68,54 -68,8 C-68,-44 -46,-96 0,-96 Z');
  body.setAttribute('fill', 'url(#body-grad)');
  body.setAttribute('stroke', '#982808');
  body.setAttribute('stroke-width', '2');
  svg.appendChild(body);

  // ═══════════════════════════════
  // STEP 3: PANEL SEAM LINES
  // Diagonal / geodesic pattern — NOT a rectangular grid
  // ═══════════════════════════════

  const seamsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  seamsGroup.setAttribute('clip-path', 'url(#body-clip)');
  seamsGroup.setAttribute('fill', 'none');
  seamsGroup.setAttribute('stroke', '#982808');
  seamsGroup.setAttribute('stroke-width', '1.9');
  seamsGroup.setAttribute('opacity', '0.75');

  // Vertical centre spine
  const seam1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  seam1.setAttribute('x1', '0'); seam1.setAttribute('y1', '-96');
  seam1.setAttribute('x2', '0'); seam1.setAttribute('y2', '90');
  seamsGroup.appendChild(seam1);

  // Horizontal equator
  const seam2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  seam2.setAttribute('x1', '-68'); seam2.setAttribute('y1', '8');
  seam2.setAttribute('x2', '68'); seam2.setAttribute('y2', '8');
  seamsGroup.appendChild(seam2);

  // Upper diagonals: apex → equator sides
  const seam3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  seam3.setAttribute('x1', '0'); seam3.setAttribute('y1', '-96');
  seam3.setAttribute('x2', '-68'); seam3.setAttribute('y2', '8');
  seamsGroup.appendChild(seam3);

  const seam4 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  seam4.setAttribute('x1', '0'); seam4.setAttribute('y1', '-96');
  seam4.setAttribute('x2', '68'); seam4.setAttribute('y2', '8');
  seamsGroup.appendChild(seam4);

  // Lower diagonals: equator → base sides
  const seam5 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  seam5.setAttribute('x1', '-68'); seam5.setAttribute('y1', '8');
  seam5.setAttribute('x2', '-26'); seam5.setAttribute('y2', '90');
  seamsGroup.appendChild(seam5);

  const seam6 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  seam6.setAttribute('x1', '68'); seam6.setAttribute('y1', '8');
  seam6.setAttribute('x2', '26'); seam6.setAttribute('y2', '90');
  seamsGroup.appendChild(seam6);

  // Upper horizontal band
  const seam7 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  seam7.setAttribute('x1', '-55'); seam7.setAttribute('y1', '-40');
  seam7.setAttribute('x2', '55'); seam7.setAttribute('y2', '-40');
  seamsGroup.appendChild(seam7);

  // Cross seams
  const seam8 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  seam8.setAttribute('x1', '-55'); seam8.setAttribute('y1', '-40');
  seam8.setAttribute('x2', '26'); seam8.setAttribute('y2', '90');
  seamsGroup.appendChild(seam8);

  const seam9 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  seam9.setAttribute('x1', '55'); seam9.setAttribute('y1', '-40');
  seam9.setAttribute('x2', '-26'); seam9.setAttribute('y2', '90');
  seamsGroup.appendChild(seam9);

  svg.appendChild(seamsGroup);

  // ═══════════════════════════════
  // STEP 4: RIVETS
  // Dome-headed, orange, ~50 total
  // ═══════════════════════════════

  const rivetPositions = [
    // Along vertical centre seam
    [0, -76], [0, -54], [0, -28], [0, 50], [0, 74],
    // Along equator
    [-58, 8], [-38, 8], [18, 8], [38, 8], [58, 8],
    // Upper-left diagonal
    [-18, -62], [-54, -4],
    // Upper-right diagonal
    [18, -62], [54, -4],
    // Lower-left diagonal
    [-58, 28], [-36, 74],
    // Lower-right diagonal
    [58, 28], [36, 74],
    // Upper band (y = -40)
    [-46, -40], [-26, -40], [26, -40], [46, -40],
    // Cross seam: upper-left to lower-right
    [-36, -12], [4, 46], [20, 72],
    // Cross seam: upper-right to lower-left
    [36, -12], [-4, 46], [-20, 72],
    // Panel centre rivets
    [-28, -72], [28, -72], [-42, 52], [42, 52]
  ];

  rivetPositions.forEach(([x, y]) => {
    const rivet = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    rivet.setAttribute('href', '#rv');
    rivet.setAttribute('x', x);
    rivet.setAttribute('y', y);
    svg.appendChild(rivet);
  });

  // ═══════════════════════════════
  // STEP 5: PORTHOLE
  // Oval submarine-style with thick raised frame
  // ═══════════════════════════════

  // Raised outer frame
  const portholeFrame = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  portholeFrame.setAttribute('cx', '0');
  portholeFrame.setAttribute('cy', '-19');
  portholeFrame.setAttribute('rx', '26');
  portholeFrame.setAttribute('ry', '28');
  portholeFrame.setAttribute('fill', 'url(#port-grad)');
  portholeFrame.setAttribute('stroke', '#781604');
  portholeFrame.setAttribute('stroke-width', '2.5');
  svg.appendChild(portholeFrame);

  // Frame inner step
  const frameStep = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  frameStep.setAttribute('cx', '0');
  frameStep.setAttribute('cy', '-19');
  frameStep.setAttribute('rx', '22');
  frameStep.setAttribute('ry', '24');
  frameStep.setAttribute('fill', 'none');
  frameStep.setAttribute('stroke', '#b02606');
  frameStep.setAttribute('stroke-width', '1.2');
  svg.appendChild(frameStep);

  // Dark glass window
  const portholeGlass = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  portholeGlass.setAttribute('cx', '0');
  portholeGlass.setAttribute('cy', '-19');
  portholeGlass.setAttribute('rx', '16');
  portholeGlass.setAttribute('ry', '18');
  portholeGlass.setAttribute('fill', '#0c1220');
  svg.appendChild(portholeGlass);

  // Subtle space-reflection in glass
  const reflection = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  reflection.setAttribute('cx', '-6');
  reflection.setAttribute('cy', '-27');
  reflection.setAttribute('rx', '5.5');
  reflection.setAttribute('ry', '3.5');
  reflection.setAttribute('fill', '#1a2840');
  reflection.setAttribute('opacity', '0.65');
  svg.appendChild(reflection);

  // Cross-wheel handle (vertical bar)
  const handleV = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  handleV.setAttribute('x1', '0'); handleV.setAttribute('y1', '-39');
  handleV.setAttribute('x2', '0'); handleV.setAttribute('y2', '1');
  handleV.setAttribute('stroke', '#b0b090');
  handleV.setAttribute('stroke-width', '4.5');
  handleV.setAttribute('stroke-linecap', 'round');
  svg.appendChild(handleV);

  // Cross-wheel handle (horizontal bar)
  const handleH = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  handleH.setAttribute('x1', '-18'); handleH.setAttribute('y1', '-19');
  handleH.setAttribute('x2', '18'); handleH.setAttribute('y2', '-19');
  handleH.setAttribute('stroke', '#b0b090');
  handleH.setAttribute('stroke-width', '4.5');
  handleH.setAttribute('stroke-linecap', 'round');
  svg.appendChild(handleH);

  // Central hub (outer ring)
  const handleHub = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  handleHub.setAttribute('cx', '0');
  handleHub.setAttribute('cy', '-19');
  handleHub.setAttribute('r', '7');
  handleHub.setAttribute('fill', '#909072');
  handleHub.setAttribute('stroke', '#b0b090');
  handleHub.setAttribute('stroke-width', '2');
  svg.appendChild(handleHub);

  // Central hub (inner circle)
  const handleCenter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  handleCenter.setAttribute('cx', '0');
  handleCenter.setAttribute('cy', '-19');
  handleCenter.setAttribute('r', '3.5');
  handleCenter.setAttribute('fill', '#c8c8a8');
  svg.appendChild(handleCenter);

  // Six rivets ringing the porthole frame
  const portholeRivets = [
    [23, -19],   // right
    [12, -41],   // upper-right
    [-12, -41],  // upper-left
    [-23, -19],  // left
    [-12, 3],    // lower-left
    [12, 3]      // lower-right
  ];

  portholeRivets.forEach(([x, y]) => {
    const rivet = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    rivet.setAttribute('href', '#rv');
    rivet.setAttribute('x', x);
    rivet.setAttribute('y', y);
    svg.appendChild(rivet);
  });

  // ═══════════════════════════════
  // STEP 6: BODY HIGHLIGHT
  // Second radial gradient pass for 3D effect
  // ═══════════════════════════════

  const bodyHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  bodyHighlight.setAttribute('d', 'M0,-96 C46,-96 68,-44 68,8 C68,54 44,86 20,90 L-20,90 C-44,86 -68,54 -68,8 C-68,-44 -46,-96 0,-96 Z');
  bodyHighlight.setAttribute('fill', 'url(#body-rim)');
  bodyHighlight.setAttribute('clip-path', 'url(#body-clip)');
  svg.appendChild(bodyHighlight);

  // ═══════════════════════════════
  // STEP 7: NOZZLE COLLAR
  // Short collar at base with dark interior
  // ═══════════════════════════════

  const nozzleOuter = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  nozzleOuter.setAttribute('cx', '0');
  nozzleOuter.setAttribute('cy', '92');
  nozzleOuter.setAttribute('rx', '22');
  nozzleOuter.setAttribute('ry', '8');
  nozzleOuter.setAttribute('fill', '#8c1c04');
  nozzleOuter.setAttribute('stroke', '#601004');
  nozzleOuter.setAttribute('stroke-width', '1.5');
  svg.appendChild(nozzleOuter);

  const nozzleInner = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  nozzleInner.setAttribute('cx', '0');
  nozzleInner.setAttribute('cy', '92');
  nozzleInner.setAttribute('rx', '14');
  nozzleInner.setAttribute('ry', '5');
  nozzleInner.setAttribute('fill', '#0a0816');
  svg.appendChild(nozzleInner);

  // ═══════════════════════════════
  // STEP 8: EXHAUST FLAMES
  // Three layered animated paths
  // ═══════════════════════════════

  // Outer flame (orange)
  const flameOuter = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  flameOuter.setAttribute('fill', '#ff5e00');
  flameOuter.setAttribute('opacity', '0.9');

  const animOuter = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
  animOuter.setAttribute('attributeName', 'd');
  animOuter.setAttribute('values',
    'M-14,98 Q-5,132 0,145 Q5,132 14,98;' +
    'M-12,98 Q-4,126 0,138 Q4,126 12,98;' +
    'M-15,98 Q-6,138 0,152 Q6,138 15,98;' +
    'M-13,98 Q-5,130 0,143 Q5,130 13,98;' +
    'M-14,98 Q-5,132 0,145 Q5,132 14,98'
  );
  animOuter.setAttribute('dur', '0.28s');
  animOuter.setAttribute('repeatCount', 'indefinite');
  flameOuter.appendChild(animOuter);
  svg.appendChild(flameOuter);

  // Mid flame (amber)
  const flameMid = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  flameMid.setAttribute('fill', '#ff9200');
  flameMid.setAttribute('opacity', '0.92');

  const animMid = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
  animMid.setAttribute('attributeName', 'd');
  animMid.setAttribute('values',
    'M-9,98 Q-3,118 0,128 Q3,118 9,98;' +
    'M-8,98 Q-2,114 0,122 Q2,114 8,98;' +
    'M-10,98 Q-4,120 0,130 Q4,120 10,98;' +
    'M-9,98 Q-3,118 0,128 Q3,118 9,98'
  );
  animMid.setAttribute('dur', '0.19s');
  animMid.setAttribute('repeatCount', 'indefinite');
  flameMid.appendChild(animMid);
  svg.appendChild(flameMid);

  // Inner flame (bright yellow)
  const flameInner = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  flameInner.setAttribute('fill', '#ffe000');

  const animInner = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
  animInner.setAttribute('attributeName', 'd');
  animInner.setAttribute('values',
    'M-5,98 Q0,112 5,98;' +
    'M-4,98 Q0,108 4,98;' +
    'M-6,98 Q0,114 6,98;' +
    'M-5,98 Q0,112 5,98'
  );
  animInner.setAttribute('dur', '0.13s');
  animInner.setAttribute('repeatCount', 'indefinite');
  flameInner.appendChild(animInner);
  svg.appendChild(flameInner);

  return svg;
}

/**
 * Create map rocket (small, simplified for flight animation)
 * Scaled-down version keeping body, porthole, fins, flames
 */
export function createMapRocket() {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'map-rocket-group');

  // Simplified body (egg shape)
  const body = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  body.setAttribute('cx', '0');
  body.setAttribute('cy', '0');
  body.setAttribute('rx', '9');
  body.setAttribute('ry', '13');
  body.setAttribute('fill', '#e04012');
  body.setAttribute('stroke', '#982808');
  body.setAttribute('stroke-width', '1.2');
  g.appendChild(body);

  // Porthole
  const porthole = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  porthole.setAttribute('cx', '0');
  porthole.setAttribute('cy', '-3');
  porthole.setAttribute('rx', '3');
  porthole.setAttribute('ry', '3.5');
  porthole.setAttribute('fill', '#0c1220');
  porthole.setAttribute('stroke', '#781604');
  porthole.setAttribute('stroke-width', '1');
  g.appendChild(porthole);

  // Simplified fins (rounded stubs)
  const finLeft = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  finLeft.setAttribute('d', 'M-7,10 C-11,11 -12,14 -10,15 C-8,16 -6,14 -5,12 Z');
  finLeft.setAttribute('fill', '#b82808');
  g.appendChild(finLeft);

  const finRight = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  finRight.setAttribute('d', 'M7,10 C11,11 12,14 10,15 C8,16 6,14 5,12 Z');
  finRight.setAttribute('fill', '#b82808');
  g.appendChild(finRight);

  // Simplified flame
  const flame = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  flame.setAttribute('d', 'M-3,14 Q0,18 0,20 Q0,18 3,14 Z');
  flame.setAttribute('fill', '#ff9200');
  flame.setAttribute('opacity', '0.85');

  const animFlame = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
  animFlame.setAttribute('attributeName', 'd');
  animFlame.setAttribute('values',
    'M-3,14 Q0,18 0,20 Q0,18 3,14 Z;' +
    'M-3,14 Q0,19 0,22 Q0,19 3,14 Z;' +
    'M-3,14 Q0,18 0,20 Q0,18 3,14 Z'
  );
  animFlame.setAttribute('dur', '0.25s');
  animFlame.setAttribute('repeatCount', 'indefinite');
  flame.appendChild(animFlame);
  g.appendChild(flame);

  return g;
}
