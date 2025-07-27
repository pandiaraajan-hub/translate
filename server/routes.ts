import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTranslationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Translation endpoint
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, from, to } = req.body;
      
      if (!text || !from || !to) {
        return res.status(400).json({ error: "Missing required fields: text, from, to" });
      }

      // Use Google Translate API
      const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || process.env.VITE_GOOGLE_TRANSLATE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Google Translate API key not configured" });
      }

      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: text,
            source: from,
            target: to,
            format: "text",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        return res.status(response.status).json({ error: `Translation API error: ${error}` });
      }

      const data = await response.json();
      const translatedText = data.data.translations[0].translatedText;
      const confidence = data.data.translations[0].confidence || "unknown";

      // Save translation to storage
      const translation = await storage.createTranslation({
        sourceLanguage: from,
        targetLanguage: to,
        sourceText: text,
        translatedText,
        confidence: confidence.toString(),
      });

      res.json({
        translatedText,
        confidence,
        translation,
      });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get recent translations
  app.get("/api/translations", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const translations = await storage.getRecentTranslations(limit);
      res.json(translations);
    } catch (error) {
      console.error("Error fetching translations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Clear translation history
  app.delete("/api/translations", async (req, res) => {
    try {
      await storage.clearTranslations();
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing translations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
