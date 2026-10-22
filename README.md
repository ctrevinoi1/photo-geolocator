# photo-geolocator

A web app that estimates where a photo was taken. Upload an image and the server returns JSON with predicted coordinates, a confidence score, and the visual features and reasoning behind the estimate. The client draws the result on a Leaflet map.

## How it works

The client sends the image as base64 to `POST /api/analyze`. The server then runs:

1. **Vision model analysis.** Google Gemini (`gemini-2.5-pro`) is prompted to look at architecture, vegetation, infrastructure, signage, environment, and shadows and lighting. It returns coordinates, a confidence score, step-by-step reasoning, visual features (each tagged architecture, vegetation, infrastructure, signage or environment) and, when it provides them, hierarchical predictions (continent, country, region, city) with confidence scores.
2. **Country classification (parallel with step 1, currently not working).** The image is posted to `openai/clip-vit-large-patch14` on the Hugging Face Inference API. A list of 40 candidate countries is defined in `server/streetclip.ts` but is not sent with the request, so this stage currently returns no usable country predictions.
3. **Street-level refinement.** Fetches up to 30 Mapillary images within about 1.5 km of the initial estimate, compares image embeddings (Jina `jina-clip-v2`, with the same Hugging Face CLIP endpoint as a fallback) and blends the coordinates toward the best match above a similarity threshold. A match also raises the confidence score.
4. **Reverse geocoding.** OpenStreetMap Nominatim adds address details, cross-checks the predicted country and flags coordinates that resolve to a water body, adjusting confidence. Requests are limited to one per second.
5. **Geohash encoding.** The final coordinates are encoded as geohashes and paired with Gemini's continent, country, region and city predictions, plus a street-level geohash. This step is skipped when Gemini returns no hierarchical predictions.

Each stage after the first is optional: if a key is missing or an API call fails, the pipeline continues with what it has.

## Stack

- Client: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix UI), TanStack Query, wouter, Leaflet with OpenStreetMap tiles
- Server: Express (TypeScript, ESM), `@google/genai`, `ngeohash`
- Shared: Zod request and response schemas in `shared/schema.ts`
- Storage: none. `server/storage.ts` is an unused template stub, and the Drizzle config (`drizzle.config.ts`, `npm run db:push`) is present but unused.

## Running locally

Developed against Node.js 20.

```bash
npm install
export GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
export JINA_API_KEY=YOUR_JINA_API_KEY_HERE
export HUGGINGFACE_API_KEY=YOUR_HUGGINGFACE_API_KEY_HERE
export MAPILLARY_TOKEN=YOUR_MAPILLARY_TOKEN_HERE
npm run dev
```

The app and API are served on http://localhost:5000.

Production build:

```bash
npm run build
npm start
```

## Environment variables

| Variable | Required | Used for |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Gemini image analysis |
| `MAPILLARY_TOKEN` | No | Street-level image search for refinement |
| `JINA_API_KEY` | No | Image embeddings for refinement |
| `HUGGINGFACE_API_KEY` | No | Fallback image embeddings for refinement, and the CLIP country request (see step 2) |
| `PORT` | No | Server port, default `5000` |

Nominatim and OpenStreetMap tiles need no key.

## License

No license has been chosen yet; all rights reserved.
