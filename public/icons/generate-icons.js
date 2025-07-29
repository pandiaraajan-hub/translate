// This script generates app icons from SVG
// Run with: node generate-icons.js

const fs = require('fs');

// Create SVG icon for VoiceBridge
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" rx="80" fill="url(#bg)"/>
  
  <!-- Microphone -->
  <rect x="216" y="180" width="80" height="120" rx="40" fill="white" opacity="0.9"/>
  <rect x="236" y="320" width="40" height="60" fill="white" opacity="0.9"/>
  <path d="M 180 340 Q 180 380 256 380 Q 332 380 332 340" stroke="white" stroke-width="12" fill="none" opacity="0.9"/>
  
  <!-- Sound waves -->
  <path d="M 350 256 Q 380 256 380 256" stroke="white" stroke-width="8" fill="none" opacity="0.7"/>
  <path d="M 360 236 Q 400 236 400 276 Q 400 276 360 276" stroke="white" stroke-width="6" fill="none" opacity="0.6"/>
  <path d="M 370 216 Q 420 216 420 296 Q 420 296 370 296" stroke="white" stroke-width="4" fill="none" opacity="0.5"/>
  
  <!-- Translation arrows -->
  <path d="M 120 200 L 160 200 L 140 180 M 140 220 L 160 200" stroke="white" stroke-width="6" fill="none" opacity="0.8"/>
  <path d="M 120 300 L 160 300 L 140 320 M 140 280 L 160 300" stroke="white" stroke-width="6" fill="none" opacity="0.8"/>
  
  <!-- Globe/Language indicator -->
  <circle cx="140" cy="250" r="30" stroke="white" stroke-width="4" fill="none" opacity="0.7"/>
  <path d="M 120 250 Q 140 230 160 250 Q 140 270 120 250" stroke="white" stroke-width="3" fill="none" opacity="0.7"/>
  <path d="M 120 240 L 160 240 M 120 260 L 160 260" stroke="white" stroke-width="2" opacity="0.7"/>
</svg>
`;

// Save the SVG
fs.writeFileSync('icon.svg', svgIcon.trim());

console.log('Generated icon.svg - use an online converter to create PNG icons in different sizes');
console.log('Required sizes: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512');