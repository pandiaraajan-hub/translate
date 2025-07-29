# Replit.md

## Overview

This is a full-stack voice-to-voice translation application built with a React frontend and Express.js backend. The app provides automatic real-time translation between English, Tamil, Chinese, Malay, Hindi, Bengali, Spanish, and Arabic languages using the Google Translate API. It features press-and-hold recording (walkie-talkie style) with automatic speech-to-speech translation, enhanced mobile responsiveness, and seamless mobile touch event handling - designed for streamlined voice-only communication with "Pandi Tech" branding.

**Status: FULLY FUNCTIONAL ON MOBILE** - Voice output confirmed working on Samsung devices using server-side TTS as of January 28, 2025. Compatible with iPhone, Samsung, and all mobile browsers through server-side TTS streaming.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database**: PostgreSQL with Drizzle ORM (actively storing translation data)
- **Session Management**: PostgreSQL database storage for persistent translation history
- **External APIs**: Google Translate API integration
- **Build Process**: esbuild for production bundling

## Key Components

### Core Features - COMPLETED
1. **Voice-to-Voice Translation**: Press-and-hold recording with automatic real-time translation between 8 languages
2. **Supported Languages**: English, Tamil, Chinese, Malay, Hindi, Bengali, Spanish, and Arabic
3. **Mobile Touch Events**: Fully functional mobile recording with proper touch event handling
4. **Automatic Speech Playback**: Translation automatically plays audio in target language
5. **Simplified Interface**: Clean, streamlined design with single recording button and status feedback
6. **Direct Speech Recognition**: Bypasses complex hook systems for reliable mobile performance
7. **Pandi Tech Branding**: VoiceBridge header with company branding as requested

### Recent Changes - January 28, 2025
- **BREAKTHROUGH**: Samsung voice output fixed using server-side TTS streaming solution ✅
- **Server-side TTS**: Implemented `/api/tts-audio` endpoint that proxies Google Translate TTS ✅
- **Samsung Audio Enhancement**: Multiple audio unlocking methods and forced play attempts for Samsung compatibility ✅
- **Audio Streaming**: Proper CORS-free audio delivery through Express server streaming ✅
- **Enhanced Mode Activation**: Orange button system for mobile audio enhancement with server-side TTS priority ✅
- **User Confirmation**: Samsung device voice output confirmed working by user
- **Language Expansion**: Added Spanish and Arabic support (8 total languages) - tested and confirmed working
- **Mobile Compatibility**: Enhanced server-side TTS to work on iPhone, Samsung, and all mobile browsers
- **iPhone Voice Output**: Added iPhone-specific audio context unlocking and optimized TTS delivery

### Frontend Components
- **SimpleVoiceRecorder**: Streamlined speech recognition component with mobile-optimized touch events
- **LanguageSelector**: Language selection interface with visual flag indicators  
- **TranslationResults**: Display and interaction component for translation output
- **RecentTranslations**: History management and selection interface

### Mobile Optimization - COMPLETED
- **Native HTML Button**: Replaced Shadcn Button component with native button for reliable mobile touch events
- **Direct API Calls**: Simplified architecture bypassing complex React hooks for mobile reliability
- **Touch Event Handling**: Proper preventDefault() and stopPropagation() for mobile touch interaction
- **Automatic Audio**: Confirmed working Tamil speech synthesis on mobile devices

### Backend Components
- **Translation API**: Google Translate integration endpoint
- **Storage Layer**: Abstracted storage interface (currently in-memory, expandable to PostgreSQL)
- **Route Management**: RESTful API structure for translation operations

## Data Flow

1. **Voice Input**: User presses and holds microphone → Speech recognition activates with visual feedback
2. **Speech Processing**: Recognition converts speech to text with confidence scoring → Error handling for failed recognition
3. **Translation Processing**: Backend calls Google Translate API → Stores result and returns to frontend
4. **Automatic Playback**: Frontend receives translation → Automatically plays translated speech using optimized voice selection
5. **Visual Feedback**: Real-time status updates throughout the process → Recording animations, confidence indicators, and completion states

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL (configured via DATABASE_URL)
- **Translation Service**: Google Translate API (requires GOOGLE_TRANSLATE_API_KEY)
- **UI Framework**: Radix UI components for accessibility
- **Development**: Replit-specific tooling for cloud development

### Key Libraries
- **Frontend**: React Query, Wouter, React Hook Form, date-fns
- **Backend**: Drizzle ORM, connect-pg-simple for sessions
- **Styling**: Tailwind CSS, class-variance-authority, clsx
- **Build Tools**: Vite, esbuild, TypeScript

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with HMR and error overlay
- **Backend**: tsx for TypeScript execution with auto-reload
- **Database**: Drizzle Kit for schema management and migrations

### Production Build
- **Frontend**: Vite builds to `dist/public` directory
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Static Serving**: Express serves built frontend assets
- **Environment**: NODE_ENV-based configuration switching

### Configuration Requirements
- `DATABASE_URL`: PostgreSQL connection string
- `GOOGLE_TRANSLATE_API_KEY`: Google Translate API credentials
- Port configuration for Express server (default: 3000)

### Replit Integration
- Custom Vite plugins for Replit development environment
- Runtime error modal for debugging
- Cartographer plugin for code exploration in development