import type { Coordinates, MapillaryMatch } from "@shared/schema";
import { getImageEmbedding, computeImageSimilarityFromEmbedding } from "./clip-similarity";

const MAPILLARY_API_BASE = "https://graph.mapillary.com";
const MAPILLARY_TOKEN = process.env.MAPILLARY_TOKEN || "";

// Minimum similarity threshold for VPR refinement
const SIMILARITY_THRESHOLD = 0.7;

// Maximum number of candidate images to evaluate
const MAX_CANDIDATES = 30;

interface MapillaryImage {
  id: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  thumb_1024_url: string;
}

interface MapillaryImagesResponse {
  data: MapillaryImage[];
}

interface CandidateMatch {
  imageId: string;
  lat: number;
  lon: number;
  similarity: number;
  imageUrl: string;
}

/**
 * Fetch nearby Mapillary images within a radius
 * @param lat - Center latitude
 * @param lon - Center longitude
 * @param radiusKm - Search radius in kilometers (default 1.5km, max to avoid Mapillary bbox limit)
 * @returns Array of nearby images with metadata
 */
async function fetchNearbyImages(
  lat: number,
  lon: number,
  radiusKm: number = 1.5
): Promise<MapillaryImage[]> {
  try {
    // Convert radius from km to degrees (approximately)
    // 1 degree latitude ≈ 111 km
    // CRITICAL: Mapillary enforces bbox area < 0.001 square degrees
    // To ensure (2*radiusDeg)^2 < 0.001, radiusDeg must be < 0.0158 degrees ≈ 1.75km
    // Using 1.5km as safe default
    const radiusDeg = Math.min(radiusKm / 111, 0.014); // Cap at 1.55km to be safe

    // Create bounding box
    const bbox = [
      lon - radiusDeg, // min longitude
      lat - radiusDeg, // min latitude
      lon + radiusDeg, // max longitude
      lat + radiusDeg, // max latitude
    ].join(",");

    const url = `${MAPILLARY_API_BASE}/images?bbox=${bbox}&limit=${MAX_CANDIDATES}&fields=id,geometry,thumb_1024_url`;

    console.log(`[Mapillary VPR] Fetching images near (${lat}, ${lon}) within ${radiusKm}km...`);

    const response = await fetch(url, {
      headers: {
        Authorization: `OAuth ${MAPILLARY_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Mapillary VPR] API error ${response.status}: ${errorText}`);
      return [];
    }

    const data: MapillaryImagesResponse = await response.json();
    console.log(`[Mapillary VPR] Found ${data.data.length} candidate images`);
    
    return data.data;
  } catch (error) {
    console.error("[Mapillary VPR] Failed to fetch nearby images:", error);
    return [];
  }
}

/**
 * Calculate distance between two coordinates in meters using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Refine location prediction using Mapillary Visual Place Recognition
 * @param queryImageBase64 - Base64 encoded query image
 * @param roughCoordinates - Initial predicted coordinates
 * @param radiusKm - Search radius in kilometers (default 1.5km, max 1.5km due to Mapillary bbox limits)
 * @returns Refined match or null if no good match found
 */
export async function refineLocationWithVPR(
  queryImageBase64: string,
  roughCoordinates: Coordinates,
  radiusKm: number = 1.5
): Promise<MapillaryMatch | null> {
  try {
    console.log("[Mapillary VPR] Starting visual place recognition...");

    // Fetch nearby Mapillary images
    const nearbyImages = await fetchNearbyImages(
      roughCoordinates.latitude,
      roughCoordinates.longitude,
      radiusKm
    );

    if (nearbyImages.length === 0) {
      console.log("[Mapillary VPR] No nearby images found, skipping refinement");
      return null;
    }

    // CRITICAL: Compute query embedding ONCE (not per candidate) to avoid rate limit exhaustion
    console.log("[Mapillary VPR] Computing query image embedding...");
    let queryEmbedding: number[];
    try {
      queryEmbedding = await getImageEmbedding(queryImageBase64);
      console.log(`[Mapillary VPR] ✓ Query embedding computed successfully (${queryEmbedding.length} dimensions)`);
    } catch (embeddingError) {
      console.warn("[Mapillary VPR] Failed to compute query embedding, VPR disabled:", embeddingError);
      console.log("[Mapillary VPR] Tip: Set JINA_API_KEY or HUGGINGFACE_API_KEY to enable VPR feature");
      return null;
    }

    // Compute similarity for each candidate (limit to avoid rate limits)
    const candidates: CandidateMatch[] = [];
    const imagesToProcess = nearbyImages.slice(0, Math.min(MAX_CANDIDATES, nearbyImages.length));

    console.log(`[Mapillary VPR] Computing similarity for ${imagesToProcess.length} candidates...`);

    // Process candidates in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < imagesToProcess.length; i += batchSize) {
      const batch = imagesToProcess.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (img) => {
          const [lon, lat] = img.geometry.coordinates;
          // Use pre-computed query embedding instead of recomputing for each candidate
          const similarity = await computeImageSimilarityFromEmbedding(queryEmbedding, img.thumb_1024_url);
          
          return {
            imageId: img.id,
            lat,
            lon,
            similarity,
            imageUrl: img.thumb_1024_url,
          };
        })
      );

      // Collect successful results
      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          candidates.push(result.value);
        }
      }

      // Small delay between batches to be respectful to the API
      if (i + batchSize < imagesToProcess.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    if (candidates.length === 0) {
      console.log("[Mapillary VPR] No valid candidates processed");
      return null;
    }

    // Sort by similarity score (highest first)
    candidates.sort((a, b) => b.similarity - a.similarity);
    const bestMatch = candidates[0];

    console.log(`[Mapillary VPR] Best match similarity: ${bestMatch.similarity.toFixed(3)}`);

    // Only refine if similarity is above threshold
    if (bestMatch.similarity < SIMILARITY_THRESHOLD) {
      console.log(`[Mapillary VPR] Best match below threshold (${SIMILARITY_THRESHOLD}), skipping refinement`);
      return null;
    }

    // Calculate distance from original prediction
    const distanceMeters = calculateDistance(
      roughCoordinates.latitude,
      roughCoordinates.longitude,
      bestMatch.lat,
      bestMatch.lon
    );

    console.log(
      `[Mapillary VPR] ✓ Match found! Similarity: ${bestMatch.similarity.toFixed(3)}, Distance: ${Math.round(distanceMeters)}m`
    );

    // Return the match with all metadata
    const match: MapillaryMatch = {
      imageId: bestMatch.imageId,
      matchedCoordinates: {
        latitude: bestMatch.lat,
        longitude: bestMatch.lon,
      },
      similarityScore: bestMatch.similarity,
      distanceMeters: Math.round(distanceMeters),
      imageUrl: `https://www.mapillary.com/app/?pKey=${bestMatch.imageId}`,
    };

    return match;
  } catch (error) {
    console.error("[Mapillary VPR] Refinement failed:", error);
    return null;
  }
}

/**
 * Blend original coordinates with VPR match based on confidence
 * @param original - Original predicted coordinates
 * @param match - Mapillary VPR match
 * @param blendWeight - Weight for VPR match (0 to 1, default 0.8 for high confidence)
 * @returns Blended coordinates
 */
export function blendCoordinates(
  original: Coordinates,
  match: MapillaryMatch,
  blendWeight: number = 0.8
): Coordinates {
  // Use similarity score to adjust blend weight
  const adjustedWeight = blendWeight * match.similarityScore;

  return {
    latitude: original.latitude * (1 - adjustedWeight) + match.matchedCoordinates.latitude * adjustedWeight,
    longitude: original.longitude * (1 - adjustedWeight) + match.matchedCoordinates.longitude * adjustedWeight,
  };
}
