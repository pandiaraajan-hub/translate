// Vercel serverless function for translation
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Create a simple translation object (no database in serverless)
    const translation = {
      id: Date.now().toString(),
      sourceLanguage: from,
      targetLanguage: to,
      sourceText: text,
      translatedText,
      confidence: confidence.toString(),
      createdAt: new Date().toISOString(),
    };

    res.json({
      translatedText,
      confidence,
      translation,
    });
  } catch (error) {
    console.error("Translation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}