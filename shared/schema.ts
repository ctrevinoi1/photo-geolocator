import { z } from "zod";

// Geolocation Analysis Schema
export const visualFeatureSchema = z.object({
  category: z.enum(['architecture', 'vegetation', 'infrastructure', 'signage', 'environment']),
  description: z.string(),
  confidence: z.number().min(0).max(1),
});

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// StreetCLIP prediction schema
export const streetClipPredictionSchema = z.object({
  country: z.string(),
  confidence: z.number().min(0).max(1),
});

// Mapillary VPR match schema
export const mapillaryMatchSchema = z.object({
  imageId: z.string(),
  matchedCoordinates: coordinatesSchema,
  similarityScore: z.number().min(0).max(1),
  distanceMeters: z.number(),
  imageUrl: z.string(),
});

// Nominatim address schema
export const nominatimAddressSchema = z.object({
  houseNumber: z.string().optional(),
  road: z.string().optional(),
  neighbourhood: z.string().optional(),
  suburb: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
});

export const reverseGeocodingSchema = z.object({
  displayName: z.string(),
  address: nominatimAddressSchema,
  isValid: z.boolean(),
  validationNotes: z.string().optional(),
});

// Hierarchical geocell schema
export const hierarchicalPredictionSchema = z.object({
  level: z.string(), // 'continent', 'country', 'region', 'city', etc.
  prediction: z.string(),
  confidence: z.number().min(0).max(1),
  geohash: z.string(),
});

export const geocellDataSchema = z.object({
  hierarchicalPredictions: z.array(hierarchicalPredictionSchema),
  primaryGeohash: z.string(), // Most precise level
  confidenceBoost: z.number().optional(), // Boost from hierarchical validation
});

export const geolocationAnalysisSchema = z.object({
  id: z.string(),
  coordinates: coordinatesSchema,
  confidence: z.number().min(0).max(1),
  locationName: z.string(),
  country: z.string().optional(),
  region: z.string().optional(),
  reasoning: z.array(z.string()),
  visualFeatures: z.array(visualFeatureSchema),
  streetClipPredictions: z.array(streetClipPredictionSchema).optional(),
  mapillaryMatch: mapillaryMatchSchema.optional(),
  reverseGeocoding: reverseGeocodingSchema.optional(),
  geocellData: geocellDataSchema.optional(),
  timestamp: z.string(),
});

// Analysis request schema
export const analyzeImageSchema = z.object({
  image: z.string(), // base64 encoded image
});

export type VisualFeature = z.infer<typeof visualFeatureSchema>;
export type Coordinates = z.infer<typeof coordinatesSchema>;
export type StreetClipPrediction = z.infer<typeof streetClipPredictionSchema>;
export type MapillaryMatch = z.infer<typeof mapillaryMatchSchema>;
export type NominatimAddress = z.infer<typeof nominatimAddressSchema>;
export type ReverseGeocoding = z.infer<typeof reverseGeocodingSchema>;
export type HierarchicalPrediction = z.infer<typeof hierarchicalPredictionSchema>;
export type GeocellData = z.infer<typeof geocellDataSchema>;
export type GeolocationAnalysis = z.infer<typeof geolocationAnalysisSchema>;
export type AnalyzeImageRequest = z.infer<typeof analyzeImageSchema>;
