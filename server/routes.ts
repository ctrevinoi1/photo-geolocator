import type { Express } from "express";
import { createServer, type Server } from "http";
import { analyzeImageGeolocation } from "./gemini";
import { analyzeImageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Image geolocation analysis endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      // Validate request body
      const validation = analyzeImageSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: validation.error.errors,
        });
      }

      const { image } = validation.data;

      // Analyze image using Gemini Vision
      const analysis = await analyzeImageGeolocation(image);

      res.json(analysis);
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({
        error: "Failed to analyze image",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
