/**
 * missions.js - Level definitions and planet generation
 */

// Planet and station templates - large pool for variety
export const PLANET_TEMPLATES = [
  // Rocky/cratered planets
  { name: 'ZOG', color: '#e74c3c', radius: 28, type: 'rocky' },
  { name: 'BUMBLE', color: '#c0392b', radius: 30, type: 'rocky' },
  { name: 'KRUNKO', color: '#e67e22', radius: 27, type: 'rocky' },

  // Ringed planets
  { name: 'BLORP', color: '#1abc9c', radius: 32, type: 'ringed' },
  { name: 'SWOOSH', color: '#16a085', radius: 34, type: 'ringed' },
  { name: 'WHIRLY', color: '#3498db', radius: 33, type: 'ringed' },

  // Gas giants
  { name: 'NOOT', color: '#f39c12', radius: 36, type: 'gas' },
  { name: 'PUFF', color: '#f1c40f', radius: 38, type: 'gas' },
  { name: 'BREEZY', color: '#e8daef', radius: 35, type: 'gas' },

  // Crystal planets
  { name: 'FIZZ', color: '#9b59b6', radius: 26, type: 'crystal' },
  { name: 'SPARKLE', color: '#8e44ad', radius: 28, type: 'crystal' },
  { name: 'GLIMMER', color: '#af7ac5', radius: 25, type: 'crystal' },

  // Space stations
  { name: 'OUTPOST SIGMA', color: '#95a5a6', radius: 24, type: 'station' },
  { name: 'STATION NOVA', color: '#7f8c8d', radius: 26, type: 'station' },
  { name: 'HUB ZENITH', color: '#bdc3c7', radius: 25, type: 'station' }
];

// Level definitions
const LEVELS = [
  // Level 0 - Training Run
  {
    name: 'Training Run',
    fuelStart: 1.0,
    missionText: 'Rescue the three stranded astronauts and bring them home safely. Click each planet to plan your route, then launch Stella. Try different routes and watch the fuel gauge - smart planning means safer missions!',
    planets: [
      { x: 700, y: 150, name: 'ZOG', crew: 'Bloop', template: 0 },
      { x: 500, y: 450, name: 'BLORP', crew: 'Zara', template: 1 },
      { x: 300, y: 100, name: 'NOOT', crew: 'Pip', template: 2 }
    ]
  },

  // Level 1 - Training with more planets
  {
    name: 'Practice Run',
    fuelStart: 1.0,
    missionText: 'Now for four planets! The order you visit them matters - shorter routes save fuel, and careful planning earns you top marks. Later missions will test your skills with limited fuel. Can you master route planning?',
    planets: [
      { x: 700, y: 480, name: 'ZOG', crew: 'Bloop', template: 0 },
      { x: 730, y: 120, name: 'BLORP', crew: 'Zara', template: 1 },
      { x: 420, y: 90, name: 'NOOT', crew: 'Pip', template: 2 },
      { x: 320, y: 450, name: 'FIZZ', crew: 'Fizzle', template: 3 }
    ]
  },

  // Level 2 - First constrained level (with safety)
  {
    name: 'Far Reaches',
    fuelStart: 0.9,
    missionText: 'Five astronauts scattered across space. Fuel is limited - plan carefully!',
    planets: 'random',
    planetCount: 5
  },

  // Level 3+ - Progressive Random Challenges
  {
    name: 'Scattered Stars',
    fuelStart: 0.9,
    missionText: 'The crew is spread thin across the galaxy. Fuel is limited!',
    planets: 'random',
    planetCount: 4
  },
  {
    name: 'Deep Space',
    fuelStart: 0.8,
    missionText: 'Six planets in the outer reaches. Every kilometer counts!',
    planets: 'random',
    planetCount: 6
  },
  {
    name: 'The Gauntlet',
    fuelStart: 0.7,
    missionText: 'Seven rescue missions on minimal fuel. Can you do it?',
    planets: 'random',
    planetCount: 7
  },
  {
    name: 'Final Frontier',
    fuelStart: 0.65,
    missionText: 'Eight stranded astronauts. Bad routes will fail - choose wisely!',
    planets: 'random',
    planetCount: 8,
    allowFuelFailure: true
  },
  {
    name: 'Station Sweep',
    fuelStart: 0.6,
    missionText: 'Five destinations including space stations. One mistake and you\'re stranded!',
    planets: 'random',
    planetCount: 5,
    allowFuelFailure: true
  },
  {
    name: 'Grand Tour',
    fuelStart: 0.55,
    missionText: 'Six locations across the sector. Only the best route will make it!',
    planets: 'random',
    planetCount: 6,
    allowFuelFailure: true
  },
  {
    name: 'Master Navigator',
    fuelStart: 0.5,
    missionText: 'Seven rescues on half a tank. Perfect planning required!',
    planets: 'random',
    planetCount: 7,
    allowFuelFailure: true
  }
];

/**
 * Get all levels (generating random ones if needed)
 */
export function getLevels() {
  return LEVELS;
}

/**
 * Get a specific level by index
 * @param {number} index - Level index
 * @param {Array} existingPlanets - Optional pre-generated planets (for replay)
 */
export function getLevel(index, existingPlanets = null) {
  const levelDef = LEVELS[index];
  if (!levelDef) return null;

  // If planets are random, generate them (or reuse existing)
  if (levelDef.planets === 'random') {
    const planets = existingPlanets || generateRandomPlanets(levelDef.planetCount, levelDef.fuelStart);
    return {
      ...levelDef,
      planets,
      wasGenerated: true // Flag to indicate this was a random generation
    };
  }

  // Add template data to planets
  const planets = levelDef.planets.map(p => ({
    ...p,
    ...PLANET_TEMPLATES[p.template],
    color: PLANET_TEMPLATES[p.template].color
  }));

  return {
    ...levelDef,
    planets,
    wasGenerated: false
  };
}

/**
 * Generate random planet positions with achievability check
 */
function generateRandomPlanets(count, fuelStart) {
  const MAP_WIDTH = 800;
  const MAP_HEIGHT = 600;
  const PADDING = 80;
  const MIN_SEPARATION = 180; // Increased to prevent label overlap
  const HOME_X = 100;
  const HOME_Y = 300;
  const MAX_ATTEMPTS = 200;

  // Crew pool - same size as destination pool (planets + stations)
  const allCrewNames = [
    'Bloop', 'Zara', 'Pip', 'Fizzle',
    'Ziggy', 'Nova', 'Cosmo', 'Luna',
    'Orbit', 'Dash', 'Twinkle', 'Rocket',
    'Astro', 'Comet', 'Galaxy'
  ];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const planets = [];
    let valid = true;

    // Randomly select unique planet templates for this level
    const availableTemplates = [...PLANET_TEMPLATES];
    const selectedTemplates = [];
    for (let i = 0; i < Math.min(count, availableTemplates.length); i++) {
      const randomIndex = Math.floor(Math.random() * availableTemplates.length);
      selectedTemplates.push(availableTemplates.splice(randomIndex, 1)[0]);
    }

    // Randomly select unique crew names for this level
    const availableCrew = [...allCrewNames];
    const selectedCrew = [];
    for (let i = 0; i < Math.min(count, availableCrew.length); i++) {
      const randomIndex = Math.floor(Math.random() * availableCrew.length);
      selectedCrew.push(availableCrew.splice(randomIndex, 1)[0]);
    }

    // Try to place all planets
    for (let i = 0; i < count; i++) {
      let placed = false;

      for (let tries = 0; tries < 100; tries++) {
        const x = PADDING + Math.random() * (MAP_WIDTH - 2 * PADDING);
        const y = PADDING + Math.random() * (MAP_HEIGHT - 2 * PADDING);

        // Check distance from home
        const distFromHome = Math.hypot(x - HOME_X, y - HOME_Y);
        if (distFromHome < MIN_SEPARATION) continue;

        // Check distance from other planets
        let tooClose = false;
        for (const other of planets) {
          const dist = Math.hypot(x - other.x, y - other.y);
          if (dist < MIN_SEPARATION) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;

        // Valid position - use pre-selected unique template and crew
        const template = selectedTemplates[i];
        const templateIndex = PLANET_TEMPLATES.indexOf(template);

        planets.push({
          x,
          y,
          name: template.name,
          crew: selectedCrew[i],
          template: templateIndex,
          ...template,
          color: template.color
        });
        placed = true;
        break;
      }

      if (!placed) {
        valid = false;
        break;
      }
    }

    if (!valid) continue;

    // Check achievability
    if (checkAchievability(planets, fuelStart, HOME_X, HOME_Y)) {
      return planets;
    }
  }

  // Fallback to hardcoded layout with unique planets
  console.warn('Could not generate valid random layout, using fallback');
  return [
    { x: 650, y: 150, name: 'ZOG', crew: 'Bloop', template: 0, ...PLANET_TEMPLATES[0] },
    { x: 700, y: 450, name: 'BLORP', crew: 'Zara', template: 3, ...PLANET_TEMPLATES[3] },
    { x: 400, y: 100, name: 'NOOT', crew: 'Pip', template: 6, ...PLANET_TEMPLATES[6] },
    { x: 200, y: 200, name: 'FIZZ', crew: 'Fizzle', template: 9, ...PLANET_TEMPLATES[9] },
    { x: 300, y: 500, name: 'PUFF', crew: 'Ziggy', template: 7, ...PLANET_TEMPLATES[7] }
  ];
}

/**
 * Check if a random planet layout is achievable
 */
function checkAchievability(planets, fuelStart, homeX, homeY) {
  // Compute best and worst distances
  const { bestDist, worstDist } = computeRouteDistances(planets, homeX, homeY);

  // Check variation
  if (worstDist / bestDist < 1.25) return false;

  // Check best route completion
  let fuelCostPerPixel;
  if (fuelStart === 1.0) {
    fuelCostPerPixel = (fuelStart * 0.95) / worstDist;
  } else {
    fuelCostPerPixel = (fuelStart * 0.75) / bestDist;
  }

  const bestFuelUsed = bestDist * fuelCostPerPixel;
  const bestRemaining = fuelStart - bestFuelUsed;

  return bestRemaining >= 0.1 * fuelStart;
}

/**
 * Compute best and worst route distances (brute force for small N)
 */
function computeRouteDistances(planets, homeX, homeY) {
  const n = planets.length;
  if (n > 8) {
    // For larger N, use heuristic
    return { bestDist: 1000, worstDist: 2000 };
  }

  const permutations = generatePermutations(planets.length);
  let bestDist = Infinity;
  let worstDist = 0;

  for (const perm of permutations) {
    let dist = 0;
    let prevX = homeX;
    let prevY = homeY;

    // Visit each planet in order
    for (const idx of perm) {
      const planet = planets[idx];
      dist += Math.hypot(planet.x - prevX, planet.y - prevY);
      prevX = planet.x;
      prevY = planet.y;
    }

    // Return home
    dist += Math.hypot(homeX - prevX, homeY - prevY);

    bestDist = Math.min(bestDist, dist);
    worstDist = Math.max(worstDist, dist);
  }

  return { bestDist, worstDist };
}

/**
 * Generate all permutations of indices 0..n-1
 */
function generatePermutations(n) {
  const result = [];
  const arr = Array.from({ length: n }, (_, i) => i);

  function permute(arr, m = []) {
    if (arr.length === 0) {
      result.push(m);
    } else {
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice();
        const next = curr.splice(i, 1);
        permute(curr.slice(), m.concat(next));
      }
    }
  }

  permute(arr);
  return result;
}

/**
 * Export distance computation for scoring module
 */
export function computeBestWorstDistances(planets, homeX = 100, homeY = 300) {
  return computeRouteDistances(planets, homeX, homeY);
}
