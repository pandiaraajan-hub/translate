// Vercel serverless function for translations history
// Simple in-memory storage for serverless (resets on each deploy)
let translations = [];

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get recent translations
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const recentTranslations = translations
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
      
      res.json(recentTranslations);
    } else if (req.method === 'DELETE') {
      // Clear translation history
      translations = [];
      res.json({ message: "Translation history cleared" });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error("Error handling translations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}