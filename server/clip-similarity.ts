// CLIP embeddings using Jina AI (primary) with HuggingFace fallback
const JINA_API_URL = "https://api.jina.ai/v1/embeddings";
const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/openai/clip-vit-large-patch14";
const JINA_TOKEN = process.env.JINA_API_KEY || "";
const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_API_KEY || "";

interface CLIPEmbedding {
  embedding: number[];
}

/**
 * Compute CLIP embedding for an image
 * Uses Jina AI as primary provider (free, reliable) with HuggingFace as fallback
 * @param imageBase64 - Base64 encoded image (with or without data URL prefix)
 * @returns Embedding vector
 */
export async function getImageEmbedding(imageBase64: string): Promise<number[]> {
  // Remove data:image/...;base64, prefix if present
  const base64Data = imageBase64.includes("base64,")
    ? imageBase64.split("base64,")[1]
    : imageBase64;

  // Strategy: Use Jina AI if available (more reliable), otherwise try HuggingFace
  if (JINA_TOKEN) {
    console.log("[CLIP] Using Jina AI for embeddings");
    try {
      return await getImageEmbeddingJina(base64Data);
    } catch (error) {
      console.warn("[CLIP] Jina AI failed, trying HuggingFace fallback:", error);
      // Fall through to HuggingFace attempt below
    }
  }

  // Try HuggingFace if Jina isn't available or failed
  if (HUGGINGFACE_TOKEN) {
    console.log("[CLIP] Using HuggingFace for embeddings");
    try {
      return await getImageEmbeddingHuggingFace(base64Data);
    } catch (error) {
      console.error("[CLIP] HuggingFace also failed:", error);
      throw new Error("CLIP embeddings unavailable - both Jina AI and HuggingFace failed");
    }
  }

  // No API keys available
  throw new Error("CLIP embeddings unavailable - please set JINA_API_KEY or HUGGINGFACE_API_KEY");
}

/**
 * Get image embeddings using Jina AI CLIP v2
 * More reliable than HuggingFace Inference API
 */
async function getImageEmbeddingJina(base64Data: string): Promise<number[]> {
  try {
    // Jina accepts base64 with data URI
    const dataUri = `data:image/jpeg;base64,${base64Data}`;
    
    const response = await fetch(JINA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${JINA_TOKEN}`,
      },
      body: JSON.stringify({
        input: [dataUri],
        model: "jina-clip-v2",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jina API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.data && Array.isArray(data.data) && data.data[0]?.embedding) {
      console.log(`[CLIP] Jina AI returned embedding with ${data.data[0].embedding.length} dimensions`);
      return data.data[0].embedding;
    }
    
    throw new Error("Unexpected Jina API response format");
  } catch (error) {
    console.error("[CLIP] Jina AI request failed:", error);
    throw error;
  }
}

/**
 * Get image embeddings using HuggingFace Inference API
 * Less reliable - may return 404 if model not available
 */
async function getImageEmbeddingHuggingFace(base64Data: string): Promise<number[]> {
  try {
    // Convert base64 to binary buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Send as binary data
    const response = await fetch(HUGGINGFACE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HuggingFace API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Try to extract the embedding from various response formats
    if (Array.isArray(data)) {
      if (data.length > 0 && Array.isArray(data[0])) {
        console.log(`[CLIP] HuggingFace returned embedding with ${data[0].length} dimensions`);
        return data[0];
      }
      return data;
    } else if (data.embedding && Array.isArray(data.embedding)) {
      return data.embedding;
    } else if (data.embeddings && Array.isArray(data.embeddings)) {
      return data.embeddings[0];
    } else {
      throw new Error("Unexpected HuggingFace response format");
    }
  } catch (error) {
    console.error("[CLIP] HuggingFace request failed:", error);
    throw error;
  }
}

/**
 * Compute cosine similarity between two embedding vectors
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns Similarity score (0 to 1)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Embedding vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  // Cosine similarity ranges from -1 to 1, normalize to 0 to 1
  const similarity = dotProduct / (normA * normB);
  return (similarity + 1) / 2;
}

/**
 * Compute similarity between query embedding and candidate image
 * @param queryEmbedding - Pre-computed CLIP embedding for query image
 * @param candidateImageUrl - URL of candidate image
 * @returns Similarity score (0 to 1)
 */
export async function computeImageSimilarityFromEmbedding(
  queryEmbedding: number[],
  candidateImageUrl: string
): Promise<number> {
  try {
    // Download candidate image
    const candidateResponse = await fetch(candidateImageUrl);
    if (!candidateResponse.ok) {
      throw new Error(`Failed to download candidate image: ${candidateResponse.status}`);
    }

    const candidateBuffer = await candidateResponse.arrayBuffer();
    const candidateBase64 = Buffer.from(candidateBuffer).toString("base64");

    // Get embedding for candidate image only (query embedding already computed)
    const candidateEmbedding = await getImageEmbedding(candidateBase64);

    // Compute cosine similarity
    const similarity = cosineSimilarity(queryEmbedding, candidateEmbedding);
    return similarity;
  } catch (error) {
    console.error("[CLIP] Failed to compute similarity:", error);
    // Return 0 similarity on error to allow the candidate to be skipped
    return 0;
  }
}
