# Replit.md

## Overview

This is a full-stack voice-to-voice translation application built with a React frontend and Express.js backend. The app provides automatic real-time translation between Chinese, English, and Tamil languages using the Google Translate API. It features press-and-hold recording (walkie-talkie style) with automatic speech-to-speech translation, enhanced mobile responsiveness, and seamless mobile touch event handling - designed for streamlined voice-only communication with "Pandi Tech" branding.

**Status: FULLY FUNCTIONAL ON MOBILE** - Main recording button successfully working on mobile devices as of January 27, 2025.

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
1. **Voice-to-Voice Translation**: Press-and-hold recording with automatic real-time translation between English and Tamil
2. **Mobile Touch Events**: Fully functional mobile recording with proper touch event handling (resolved January 27, 2025)
3. **Automatic Speech Playback**: Translation automatically plays Tamil audio after English speech recognition
4. **Simplified Interface**: Clean, streamlined design with single recording button and status feedback
5. **Direct Speech Recognition**: Bypasses complex hook systems for reliable mobile performance
6. **Pandi Tech Branding**: VoiceBridge header with company branding as requested

### Recent Changes - January 27, 2025
- **BREAKTHROUGH**: Fixed mobile recording button functionality by creating SimpleVoiceRecorder component
- **Mobile Touch Events**: Replaced complex Shadcn Button with native HTML button for proper mobile touch handling
- **Direct Speech Recognition**: Bypassed hook-based systems, using direct speechUtils calls for reliability
- **API Integration**: Confirmed working English→Tamil translation pipeline with automatic audio playback
- **Interface Cleanup**: Removed complex audio visualizations, focused on core functionality

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