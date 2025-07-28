import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTranslationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add CORS headers for production deployment
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  // Translation endpoint
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, from, to } = req.body;
      
      if (!text || !from || !to) {
        console.error('❌ Missing required fields:', { text: !!text, from: !!from, to: !!to });
        return res.status(400).json({ error: "Missing required fields: text, from, to" });
      }
      
      // Validate language codes
      const validCodes = ['en', 'ta', 'zh', 'zh-cn', 'hi', 'ms', 'bn', 'es', 'ar', 'en-US', 'ta-IN', 'zh-CN', 'hi-IN', 'ms-MY', 'bn-IN', 'es-ES', 'ar-SA'];
      if (!validCodes.includes(from) && !validCodes.includes(from.split('-')[0])) {
        console.error('❌ Invalid source language code:', from);
        return res.status(400).json({ error: `Invalid source language: ${from}` });
      }
      if (!validCodes.includes(to) && !validCodes.includes(to.split('-')[0])) {
        console.error('❌ Invalid target language code:', to);
        return res.status(400).json({ error: `Invalid target language: ${to}` });
      }

      // Use Google Translate API
      const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY || process.env.VITE_GOOGLE_TRANSLATE_API_KEY;
      if (!apiKey) {
        console.error('❌ Google Translate API key not found in environment');
        return res.status(500).json({ error: "Google Translate API key not configured" });
      }
      
      console.log('🔍 Translation request:', { text: text.substring(0, 50), from, to });

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
        console.error('❌ Google Translate API error:', response.status, error);
        return res.status(response.status).json({ error: `Translation API error: ${error}` });
      }

      const data = await response.json();
      const translatedText = data.data.translations[0].translatedText;
      const confidence = data.data.translations[0].confidence || "unknown";
      
      console.log('✅ Translation successful:', { translatedText: translatedText.substring(0, 50), confidence });

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

  // Server-side TTS for Samsung compatibility
  app.get("/api/tts-audio", async (req, res) => {
    try {
      const { text, lang } = req.query;
      
      if (!text || !lang) {
        return res.status(400).json({ error: "Missing text or language" });
      }

      // Generate Google TTS URL
      const encodedText = encodeURIComponent((text as string).substring(0, 200));
      const langCode = mapLanguageToGoogleTTS(lang as string);
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodedText}&tl=${langCode}&ttsspeed=0.8`;
      
      console.log('🎵 Serving TTS audio for Samsung:', { text, lang, ttsUrl });
      
      // Fetch the audio from Google and stream it
      const response = await fetch(ttsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://translate.google.com/'
        }
      });

      if (!response.ok) {
        throw new Error(`TTS API returned ${response.status}`);
      }

      // Optimized headers for faster audio streaming
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=7200'); // Longer cache
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Connection', 'keep-alive');
      
      // Stream the audio directly to the client
      if (response.body) {
        const reader = response.body.getReader();
        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
            res.end();
          } catch (error) {
            console.error('TTS streaming error:', error);
            res.end();
          }
        };
        pump();
      } else {
        res.status(500).json({ error: 'No audio data received' });
      }
    } catch (error) {
      console.error("TTS proxy error:", error);
      res.status(500).json({ error: "TTS generation failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to map language codes to Google TTS
function mapLanguageToGoogleTTS(lang: string): string {
  const mapping: { [key: string]: string } = {
    'ta': 'ta',
    'ta-IN': 'ta',
    'en': 'en',
    'en-US': 'en',
    'en-GB': 'en',
    'zh': 'zh',
    'zh-CN': 'zh-cn',
    'hi': 'hi',
    'hi-IN': 'hi',
    'ms': 'ms',
    'ms-MY': 'ms',
    'bn': 'bn',
    'bn-IN': 'bn',
    'es': 'es',
    'es-ES': 'es',
    'ar': 'ar',
    'ar-SA': 'ar'
  };
  
  return mapping[lang] || 'en';
}
