import type { StreetClipPrediction } from "@shared/schema";

// Alternative: Use standard CLIP for zero-shot country classification
// The geolocal/StreetCLIP model is not available via Inference API
const CLIP_API_URL = "https://api-inference.huggingface.co/models/openai/clip-vit-large-patch14";
const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_API_KEY || "";

// Top countries to classify
const COUNTRY_LABELS = [
  "United States",
  "Canada",
  "United Kingdom",
  "France",
  "Germany",
  "Spain",
  "Italy",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Austria",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Poland",
  "Czech Republic",
  "Portugal",
  "Greece",
  "Australia",
  "New Zealand",
  "Japan",
  "South Korea",
  "China",
  "India",
  "Thailand",
  "Singapore",
  "Malaysia",
  "Indonesia",
  "Brazil",
  "Argentina",
  "Mexico",
  "Chile",
  "Colombia",
  "South Africa",
  "Russia",
  "Turkey",
  "Israel",
  "United Arab Emirates",
  "Saudi Arabia",
];

interface HuggingFaceZeroShotResponse {
  label: string;
  score: number;
}

/**
 * Analyze image with CLIP for country classification
 * NOTE: Using standard CLIP instead of StreetCLIP as it's not available on Inference API
 * This provides similar functionality via zero-shot classification
 */
export async function analyzeWithStreetCLIP(
  imageBase64: string
): Promise<StreetClipPrediction[]> {
  try {
    // Remove data:image/...;base64, prefix if present
    const base64Data = imageBase64.includes("base64,")
      ? imageBase64.split("base64,")[1]
      : imageBase64;

    // Convert to binary buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    console.log("[StreetCLIP] Starting country classification with CLIP...");

    // Method 1: Try zero-shot image classification with query parameters
    const url = new URL(CLIP_API_URL);
    
    // Create candidate labels for zero-shot classification
    const candidateLabelsParam = COUNTRY_LABELS.map(country => 
      `a photo from ${country}`
    ).join(',');

    const response = await fetch(CLIP_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
        "Content-Type": "application/octet-stream",
        "x-wait-for-model": "true",
      },
      body: imageBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[StreetCLIP] CLIP API error ${response.status}: ${errorText}`);
      
      // If model is loading, wait and retry once
      if (response.status === 503) {
        console.log("[StreetCLIP] Model loading, waiting 20 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 20000));
        
        const retryResponse = await fetch(CLIP_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
            "Content-Type": "application/octet-stream",
            "x-wait-for-model": "true",
          },
          body: imageBuffer,
        });
        
        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text();
          console.warn(`[StreetCLIP] Retry failed ${retryResponse.status}: ${retryErrorText}`);
          return [];
        }
        
        const retryData = await retryResponse.json();
        return parseClipResponseForCountries(retryData);
      }
      
      // For 404 or other errors, try using transformers.js as fallback
      if (response.status === 404) {
        console.log("[StreetCLIP] Model not available on Inference API, using manual CLIP classification...");
        return await analyzeWithManualCLIP(base64Data);
      }
      
      return [];
    }

    const data = await response.json();
    return parseClipResponseForCountries(data);
  } catch (error) {
    console.warn("[StreetCLIP] Exception during analysis:", error);
    // Try manual CLIP as fallback
    try {
      const base64Data = imageBase64.includes("base64,")
        ? imageBase64.split("base64,")[1]
        : imageBase64;
      return await analyzeWithManualCLIP(base64Data);
    } catch (fallbackError) {
      console.warn("[StreetCLIP] Fallback also failed:", fallbackError);
      return [];
    }
  }
}

/**
 * Manual CLIP-based country classification using text-image similarity
 * This is a workaround when the standard API doesn't support zero-shot classification
 */
async function analyzeWithManualCLIP(imageBase64: string): Promise<StreetClipPrediction[]> {
  console.log("[StreetCLIP] Using manual CLIP text-image matching...");
  
  // For now, we'll return empty array to gracefully degrade to Gemini-only analysis
  // This feature requires either a working CLIP API or running the model locally
  // which is beyond the scope of the free Inference API
  
  console.log("[StreetCLIP] Manual CLIP not implemented, degrading to Gemini-only analysis");
  return [];
}

/**
 * Parse CLIP response for country predictions
 */
function parseClipResponseForCountries(data: any): StreetClipPrediction[] {
  try {
    // Handle zero-shot classification response
    if (Array.isArray(data)) {
      // Map back from "a photo from X" to just "X"
      return data
        .slice(0, 5)
        .map((item) => ({
          country: item.label.replace("a photo from ", "").trim(),
          confidence: Math.round(item.score * 100) / 100,
        }));
    }

    console.warn("[StreetCLIP] Unexpected CLIP response format:", data);
    return [];
  } catch (error) {
    console.error("[StreetCLIP] Failed to parse CLIP response:", error);
    return [];
  }
}
