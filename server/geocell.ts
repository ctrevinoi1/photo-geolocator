/**
 * Hierarchical Geocell Clustering Service
 * 
 * Uses geohash to encode locations at multiple hierarchical levels,
 * enabling progressive refinement from continent → country → city → building.
 * 
 * Based on ECCV 2018 research: "Geolocation Estimation of Photos using 
 * a Hierarchical Model and Scene Classification"
 */

import geohash from 'ngeohash';

/**
 * Geohash precision levels and their approximate accuracy
 */
export const GEOCELL_LEVELS = {
  CONTINENT: 1,      // ±2,500 km
  COUNTRY: 3,        // ±156 km
  REGION: 4,         // ±39 km
  CITY: 5,           // ±4.9 km
  NEIGHBORHOOD: 6,   // ±1.2 km
  STREET: 7,         // ±153 m
  BUILDING: 8,       // ±38 m
  ROOM: 9           // ±4.8 m
} as const;

/**
 * Hierarchical geocell representation
 */
export interface HierarchicalGeoCell {
  continent: string;       // Level 1
  country: string;         // Level 3
  region: string;          // Level 4
  city: string;            // Level 5
  neighborhood: string;    // Level 6
  street: string;          // Level 7
  building: string;        // Level 8
  room: string;            // Level 9
  
  // For validation and confidence scoring
  allLevels: {
    level: number;
    precision: string;
    geohash: string;
    approximateAccuracy: string;
  }[];
}

/**
 * Encode coordinates into hierarchical geocells at all levels
 */
export function encodeHierarchical(
  latitude: number,
  longitude: number
): HierarchicalGeoCell {
  const levels = Object.values(GEOCELL_LEVELS);
  const accuracies = [
    '±2,500 km',
    '±156 km',
    '±39 km',
    '±4.9 km',
    '±1.2 km',
    '±153 m',
    '±38 m',
    '±4.8 m'
  ];
  
  return {
    continent: geohash.encode(latitude, longitude, GEOCELL_LEVELS.CONTINENT),
    country: geohash.encode(latitude, longitude, GEOCELL_LEVELS.COUNTRY),
    region: geohash.encode(latitude, longitude, GEOCELL_LEVELS.REGION),
    city: geohash.encode(latitude, longitude, GEOCELL_LEVELS.CITY),
    neighborhood: geohash.encode(latitude, longitude, GEOCELL_LEVELS.NEIGHBORHOOD),
    street: geohash.encode(latitude, longitude, GEOCELL_LEVELS.STREET),
    building: geohash.encode(latitude, longitude, GEOCELL_LEVELS.BUILDING),
    room: geohash.encode(latitude, longitude, GEOCELL_LEVELS.ROOM),
    
    allLevels: levels.map((level, index) => ({
      level,
      precision: getLevelName(level),
      geohash: geohash.encode(latitude, longitude, level),
      approximateAccuracy: accuracies[index]
    }))
  };
}

/**
 * Decode a geohash to latitude/longitude
 */
export function decodeGeohash(hash: string): { latitude: number; longitude: number } {
  return geohash.decode(hash);
}

/**
 * Get the bounding box for a geocell
 */
export function getGeocellBounds(hash: string): {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
} {
  const [minLat, minLon, maxLat, maxLon] = geohash.decode_bbox(hash);
  return { minLat, minLon, maxLat, maxLon };
}

/**
 * Get all 8 neighboring geocells (for proximity search)
 */
export function getNeighbors(hash: string): string[] {
  const neighbors = geohash.neighbors(hash);
  return Object.values(neighbors);
}

/**
 * Validate if two locations are in the same geocell at a given level
 */
export function areInSameGeocell(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  level: number
): boolean {
  const hash1 = geohash.encode(lat1, lon1, level);
  const hash2 = geohash.encode(lat2, lon2, level);
  return hash1 === hash2;
}

/**
 * Calculate geocell-based confidence score
 * Higher levels of agreement increase confidence
 */
export function calculateGeocellConfidence(
  predictedLat: number,
  predictedLon: number,
  actualLat: number,
  actualLon: number
): {
  matchingLevels: number;
  matchedPrecisions: string[];
  confidenceBoost: number;
} {
  const levels = [1, 3, 4, 5, 6, 7, 8, 9];
  const precisions = ['continent', 'country', 'region', 'city', 'neighborhood', 'street', 'building', 'room'];
  
  let matchingLevels = 0;
  const matchedPrecisions: string[] = [];
  
  for (let i = 0; i < levels.length; i++) {
    if (areInSameGeocell(predictedLat, predictedLon, actualLat, actualLon, levels[i])) {
      matchingLevels++;
      matchedPrecisions.push(precisions[i]);
    } else {
      // Stop at first mismatch (hierarchical validation)
      break;
    }
  }
  
  // Confidence boost: +1% per matching level (up to +8%)
  const confidenceBoost = matchingLevels * 0.01;
  
  return {
    matchingLevels,
    matchedPrecisions,
    confidenceBoost
  };
}

/**
 * Get human-readable name for geocell level
 */
function getLevelName(level: number): string {
  switch (level) {
    case 1: return 'continent';
    case 3: return 'country';
    case 4: return 'region';
    case 5: return 'city';
    case 6: return 'neighborhood';
    case 7: return 'street';
    case 8: return 'building';
    case 9: return 'room';
    default: return `level-${level}`;
  }
}

/**
 * Format geocell hierarchy for display
 */
export function formatHierarchy(geocells: HierarchicalGeoCell): string {
  return [
    `Continent: ${geocells.continent}`,
    `Country: ${geocells.country}`,
    `Region: ${geocells.region}`,
    `City: ${geocells.city}`,
    `Neighborhood: ${geocells.neighborhood}`,
    `Street: ${geocells.street}`,
    `Building: ${geocells.building}`,
    `Room: ${geocells.room}`
  ].join('\n');
}
