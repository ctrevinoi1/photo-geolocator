import { GoogleGenAI } from "@google/genai";
import type { GeolocationAnalysis, VisualFeature, Coordinates, StreetClipPrediction, MapillaryMatch, ReverseGeocoding, GeocellData, HierarchicalPrediction } from "@shared/schema";
import { analyzeWithStreetCLIP } from "./streetclip";
import { refineLocationWithVPR, blendCoordinates } from "./mapillary-vpr";
import { rateLimitedValidateAndEnrich } from "./nominatim";
import { encodeHierarchical } from "./geocell";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface GeminiGeolocationResponse {
  coordinates: Coordinates;
  confidence: number;
  locationName: string;
  country?: string;
  region?: string;
  reasoning: string[];
  visualFeatures: VisualFeature[];
  hierarchicalPredictions?: {
    continent: { name: string; confidence: number };
    country: { name: string; confidence: number };
    region: { name: string; confidence: number };
    city: { name: string; confidence: number };
  };
}

export async function analyzeImageGeolocation(
  imageBase64: string
): Promise<GeolocationAnalysis> {
  try {
    // Start StreetCLIP analysis but don't await it yet (parallel execution)
    const streetClipPromise = analyzeWithStreetCLIP(imageBase64);

    // Remove data:image/...;base64, prefix if present
    const base64Data = imageBase64.includes("base64,")
      ? imageBase64.split("base64,")[1]
      : imageBase64;

    // Determine MIME type from data URL or default to jpeg
    let mimeType = "image/jpeg";
    if (imageBase64.startsWith("data:image/png")) {
      mimeType = "image/png";
    } else if (imageBase64.startsWith("data:image/bmp")) {
      mimeType = "image/bmp";
    }

    // Build system prompt WITHOUT waiting for StreetCLIP (Gemini starts immediately)
    // We'll add StreetCLIP context to reasoning chain if it completes in time

    // Comprehensive prompt for geolocation analysis using chain-of-thought reasoning
    const systemPrompt = `You are an expert geolocation analyst with deep knowledge of global geography, architecture, vegetation, infrastructure, and cultural markers. Your task is to analyze images and determine their most likely geographic location.

HIERARCHICAL ANALYSIS APPROACH:
Use progressive refinement from broad regions to specific locations:
1. Start with CONTINENT-level clues (climate zones, general architectural styles)
2. Narrow to COUNTRY (language, cultural markers, infrastructure standards)
3. Refine to REGION/STATE (regional architecture, vegetation patterns)
4. Pinpoint CITY/LOCATION (specific landmarks, urban patterns)

Analyze the following visual features systematically:
1. ARCHITECTURE: Building styles, construction materials, roof types, window designs, architectural periods
2. VEGETATION: Plant species, tree types, agricultural patterns, climate indicators
3. INFRASTRUCTURE: Road signs, traffic lights, utility poles, fire hydrants, road markings, street furniture
4. SIGNAGE: Language, script, commercial branding, street names, warning signs
5. ENVIRONMENT: Sky color, lighting, weather patterns, terrain, soil type
6. SHADOWS & LIGHTING: Critical clues for hemisphere and latitude estimation

SHADOW & SUN ANALYSIS (Advanced Geolocation Technique):
If shadows are visible in the image, use these proven techniques:

**Hemisphere Determination:**
- Shadows pointing NORTH → Northern Hemisphere (sun is south)
- Shadows pointing SOUTH → Southern Hemisphere (sun is north)
- Use image orientation and compass directions to determine shadow direction

**Latitude Estimation via Shadow-to-Height Ratios:**
- Measure the ratio of shadow length to object height (e.g., car, pole, person)
- Short shadows (height > shadow) → Lower latitudes near equator, or midday
- Medium shadows (height ≈ shadow) → Mid-latitudes (30-50°)
- Long shadows (shadow > height) → High latitudes (>50°), or early/late in day

**Reference Shadow Ratios:**
- Height:Shadow ratio of 1:1 suggests ~45° latitude (at equinox midday)
- Height:Shadow ratio of 2:1 suggests ~60-70° latitude or lower latitude at morning/evening
- Height:Shadow ratio of 1:2 suggests ~20-30° latitude at midday

**Practical Measurements:**
- Sedan cars are typically 1.4-1.5m tall
- Standard utility poles are 9-12m tall
- Street signs are usually 2-2.5m from ground
- Average human height is 1.6-1.8m

**Important Considerations:**
- Cannot determine exact latitude without knowing the time of day and season
- Use shadow clues to VALIDATE other geographic indicators
- Long shadows could indicate high latitude OR early/late day at lower latitude
- Cross-reference shadow analysis with vegetation, architecture, and climate

**Integration with Other Clues:**
- If shadows suggest Northern Hemisphere + tropical vegetation → likely 0-30°N
- If shadows suggest Southern Hemisphere + European architecture → likely Australia, NZ, South America
- Short shadows + Mediterranean architecture → likely 30-45° latitude regions
- No shadows visible → overcast day, nighttime, or indoor image (use other clues only)

Use chain-of-thought reasoning to build confidence in your prediction. Consider:
- Regional architectural styles (Mediterranean, Nordic, Asian, etc.)
- Vegetation zones and climate patterns
- Infrastructure standards (left/right driving, sign styles)
- Language and cultural markers
- Environmental conditions and shadow/lighting clues

Provide your analysis in JSON format with these exact fields:
{
  "coordinates": { "latitude": number, "longitude": number },
  "confidence": number (0.0 to 1.0),
  "locationName": "City or Area Name",
  "country": "Country Name",
  "region": "State/Province/Region",
  "reasoning": ["step 1 observation", "step 2 deduction", ...],
  "visualFeatures": [
    {
      "category": "architecture" | "vegetation" | "infrastructure" | "signage" | "environment",
      "description": "detailed observation",
      "confidence": number (0.0 to 1.0)
    }
  ],
  "hierarchicalPredictions": {
    "continent": { "name": "Continent name", "confidence": number (0.0-1.0) },
    "country": { "name": "Country name", "confidence": number (0.0-1.0) },
    "region": { "name": "Region/State name", "confidence": number (0.0-1.0) },
    "city": { "name": "City name", "confidence": number (0.0-1.0) }
  }
}

Be specific and detailed in your reasoning. Provide at least 5-8 reasoning steps showing your analytical process. Include at least 5-7 visual features you identified. Use hierarchical predictions to show your confidence at each geographic level.`;

    const userPrompt = `Analyze this image and determine its geographic location. Provide detailed chain-of-thought reasoning explaining how you arrived at your conclusion. Consider architecture, vegetation, infrastructure, signage, and environmental clues.`;

    const contents = [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: userPrompt,
          },
        ],
      },
    ];

    console.log("[Gemini] Starting geolocation analysis...");

    // Start Gemini analysis (runs in parallel with StreetCLIP)
    const geminiPromise = ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            coordinates: {
              type: "object",
              properties: {
                latitude: { type: "number" },
                longitude: { type: "number" },
              },
              required: ["latitude", "longitude"],
            },
            confidence: { type: "number" },
            locationName: { type: "string" },
            country: { type: "string" },
            region: { type: "string" },
            reasoning: {
              type: "array",
              items: { type: "string" },
            },
            visualFeatures: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  description: { type: "string" },
                  confidence: { type: "number" },
                },
                required: ["category", "description", "confidence"],
              },
            },
            hierarchicalPredictions: {
              type: "object",
              properties: {
                continent: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    confidence: { type: "number" },
                  },
                  required: ["name", "confidence"],
                },
                country: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    confidence: { type: "number" },
                  },
                  required: ["name", "confidence"],
                },
                region: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    confidence: { type: "number" },
                  },
                  required: ["name", "confidence"],
                },
                city: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    confidence: { type: "number" },
                  },
                  required: ["name", "confidence"],
                },
              },
            },
          },
          required: [
            "coordinates",
            "confidence",
            "locationName",
            "reasoning",
            "visualFeatures",
          ],
        },
      },
    });

    // Wait for both models to complete (or StreetCLIP to timeout/fail gracefully)
    const [geminiResult, streetClipPredictions] = await Promise.allSettled([
      geminiPromise,
      streetClipPromise,
    ]);

    // Handle Gemini result
    if (geminiResult.status === "rejected") {
      console.error("[Gemini] Analysis failed:", geminiResult.reason);
      throw new Error(`Gemini analysis failed: ${geminiResult.reason}`);
    }

    const response = geminiResult.value;
    const rawJson = response.text;

    if (!rawJson) {
      throw new Error("Empty response from Gemini model");
    }

    console.log("[Gemini] Analysis complete");

    const data: GeminiGeolocationResponse = JSON.parse(rawJson);

    // Extract StreetCLIP predictions if available
    const streetClipResults: StreetClipPrediction[] =
      streetClipPredictions.status === "fulfilled" && streetClipPredictions.value.length > 0
        ? streetClipPredictions.value
        : [];

    if (streetClipResults.length > 0) {
      console.log(`[StreetCLIP] Predictions available: ${streetClipResults.length} countries`);
    } else if (streetClipPredictions.status === "rejected") {
      console.warn("[StreetCLIP] Failed:", streetClipPredictions.reason);
    } else {
      console.log("[StreetCLIP] No predictions returned");
    }

    // Prepare initial coordinates from Gemini
    const initialCoordinates: Coordinates = {
      latitude: clamp(data.coordinates.latitude, -90, 90),
      longitude: clamp(data.coordinates.longitude, -180, 180),
    };

    // Try to refine location using Mapillary VPR
    let mapillaryMatch: MapillaryMatch | undefined;
    let finalCoordinates = initialCoordinates;

    try {
      console.log("[Mapillary VPR] Attempting refinement...");
      // Use 1.5km radius (max safe value for Mapillary bbox limit of 0.001 square degrees)
      const vprMatch = await refineLocationWithVPR(imageBase64, initialCoordinates, 1.5);

      if (vprMatch) {
        mapillaryMatch = vprMatch;
        // Blend coordinates based on similarity confidence
        finalCoordinates = blendCoordinates(initialCoordinates, vprMatch, 0.8);
        console.log(
          `[Mapillary VPR] ✓ Refined location: (${finalCoordinates.latitude.toFixed(6)}, ${finalCoordinates.longitude.toFixed(6)})`
        );
      } else {
        console.log("[Mapillary VPR] No refinement applied");
      }
    } catch (error) {
      console.warn("[Mapillary VPR] Refinement failed, using original coordinates:", error);
    }

    // Validate and enrich location with Nominatim reverse geocoding
    let reverseGeocoding: ReverseGeocoding | undefined;

    try {
      console.log("[Nominatim] Validating and enriching location...");
      const geocodingResult = await rateLimitedValidateAndEnrich(
        finalCoordinates.latitude,
        finalCoordinates.longitude,
        data.country
      );

      if (geocodingResult) {
        reverseGeocoding = geocodingResult;
        console.log(`[Nominatim] ✓ Address resolved: ${geocodingResult.displayName}`);
        
        // Log validation results
        if (!geocodingResult.isValid && geocodingResult.validationNotes) {
          console.warn(`[Nominatim] ⚠ Validation warning: ${geocodingResult.validationNotes}`);
        }
      } else {
        console.log("[Nominatim] No geocoding results available");
      }
    } catch (error) {
      console.warn("[Nominatim] Reverse geocoding failed:", error);
    }

    // Calculate final confidence score incorporating validation results
    let finalConfidence = clamp(data.confidence, 0, 1);

    // Adjust confidence based on validation results
    if (reverseGeocoding) {
      if (reverseGeocoding.isValid) {
        // Valid location increases confidence slightly
        finalConfidence = Math.min(1.0, finalConfidence * 1.05);
        console.log("[Confidence] Validation passed: confidence boosted");
      } else {
        // Invalid location (e.g., in water, country mismatch) reduces confidence
        finalConfidence = finalConfidence * 0.85;
        console.log("[Confidence] Validation warnings detected: confidence reduced");
      }
    }

    // VPR match with high similarity boosts confidence
    if (mapillaryMatch && mapillaryMatch.similarityScore > 0.7) {
      const vprBoost = mapillaryMatch.similarityScore * 0.15; // Up to 15% boost
      finalConfidence = Math.min(1.0, finalConfidence + vprBoost);
      console.log(`[Confidence] VPR match (${(mapillaryMatch.similarityScore * 100).toFixed(1)}% similarity): confidence boosted`);
    }

    console.log(`[Confidence] Final confidence score: ${(finalConfidence * 100).toFixed(1)}%`);

    // Generate hierarchical geocells from final coordinates
    let geocellData: GeocellData | undefined;
    try {
      console.log("[Geocell] Generating hierarchical geocells...");
      const hierarchicalGeocells = encodeHierarchical(
        finalCoordinates.latitude,
        finalCoordinates.longitude
      );
      
      // Convert Gemini's hierarchical predictions to our geocell format
      const hierarchicalPredictions: HierarchicalPrediction[] = [];
      
      if (data.hierarchicalPredictions) {
        hierarchicalPredictions.push(
          {
            level: "continent",
            prediction: data.hierarchicalPredictions.continent.name,
            confidence: data.hierarchicalPredictions.continent.confidence,
            geohash: hierarchicalGeocells.continent,
          },
          {
            level: "country",
            prediction: data.hierarchicalPredictions.country.name,
            confidence: data.hierarchicalPredictions.country.confidence,
            geohash: hierarchicalGeocells.country,
          },
          {
            level: "region",
            prediction: data.hierarchicalPredictions.region.name,
            confidence: data.hierarchicalPredictions.region.confidence,
            geohash: hierarchicalGeocells.region,
          },
          {
            level: "city",
            prediction: data.hierarchicalPredictions.city.name,
            confidence: data.hierarchicalPredictions.city.confidence,
            geohash: hierarchicalGeocells.city,
          }
        );
        
        geocellData = {
          hierarchicalPredictions,
          primaryGeohash: hierarchicalGeocells.street,
          confidenceBoost: 0,
        };
        
        console.log(`[Geocell] ✓ Generated geocells at ${hierarchicalPredictions.length} levels`);
      } else {
        console.log("[Geocell] No hierarchical predictions returned by Gemini, skipping geocell generation");
      }
    } catch (error) {
      console.warn("[Geocell] Failed to generate geocells:", error);
    }

    // Validate and sanitize the response
    const analysis: GeolocationAnalysis = {
      id: generateId(),
      coordinates: finalCoordinates,
      confidence: finalConfidence,
      locationName: data.locationName || "Unknown Location",
      country: data.country,
      region: data.region,
      reasoning: data.reasoning || [],
      visualFeatures: data.visualFeatures.map((f) => ({
        category: normalizeCategory(f.category),
        description: f.description,
        confidence: clamp(f.confidence, 0, 1),
      })),
      streetClipPredictions: streetClipResults.length > 0 ? streetClipResults : undefined,
      mapillaryMatch,
      reverseGeocoding,
      geocellData,
      timestamp: new Date().toISOString(),
    };

    return analysis;
  } catch (error) {
    console.error("Gemini geolocation analysis error:", error);
    throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

function generateId(): string {
  return `geo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeCategory(
  category: string
): "architecture" | "vegetation" | "infrastructure" | "signage" | "environment" {
  const normalized = category.toLowerCase();
  const validCategories = [
    "architecture",
    "vegetation",
    "infrastructure",
    "signage",
    "environment",
  ];

  if (validCategories.includes(normalized)) {
    return normalized as any;
  }

  // Default fallback
  return "environment";
}
