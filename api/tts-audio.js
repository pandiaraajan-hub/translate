// Vercel serverless function for TTS audio
// Helper function to map language codes to Google TTS
function mapLanguageToGoogleTTS(langCode) {
  const mapping = {
    'en-US': 'en',
    'ta-IN': 'ta',
    'zh-CN': 'zh-cn',
    'ms-MY': 'ms',
    'hi-IN': 'hi',
    'bn-IN': 'bn',
    'es-ES': 'es',
    'ar-SA': 'ar'
  };
  return mapping[langCode] || langCode.split('-')[0];
}

// TTS request deduplication to prevent audio echo
const activeTTSRequests = new Map();

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, lang } = req.query;
    
    if (!text || !lang) {
      return res.status(400).json({ error: "Missing text or language" });
    }

    // Create a unique key for deduplication
    const requestKey = `${text}_${lang}`;
    
    // If there's already an active request for this text+lang, block it
    if (activeTTSRequests.has(requestKey)) {
      console.log('🎵 Duplicate TTS request detected, blocking to prevent echo');
      return res.status(429).json({ error: "Audio request already in progress" });
    }

    // Generate Google TTS URL
    const encodedText = encodeURIComponent(text.substring(0, 200));
    const langCode = mapLanguageToGoogleTTS(lang);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodedText}&tl=${langCode}&ttsspeed=0.8`;
    
    console.log('🎵 Serving TTS audio for Vercel:', { text, lang, ttsUrl });
    
    // Create and track the request promise
    const audioPromise = fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });
    
    activeTTSRequests.set(requestKey, audioPromise);
    
    const response = await audioPromise;

    if (!response.ok) {
      throw new Error(`TTS API returned ${response.status}`);
    }

    // Set appropriate headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Get the audio buffer and send it
    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);
    
    // Clean up the request from active requests
    activeTTSRequests.delete(requestKey);
    
    res.send(buffer);
    
  } catch (error) {
    console.error("TTS proxy error:", error);
    // Clean up the request from active requests
    const requestKey = `${req.query.text}_${req.query.lang}`;
    activeTTSRequests.delete(requestKey);
    res.status(500).json({ error: "TTS generation failed" });
  }
};