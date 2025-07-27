# Replit.md

## Overview

This is a full-stack translation application built with a React frontend and Express.js backend. The app provides real-time translation between Chinese, English, and Tamil languages using the Google Translate API. It features voice input, text-to-speech capabilities, and translation history management.

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
- **Database**: PostgreSQL with Drizzle ORM (configured but using in-memory storage currently)
- **Session Management**: In-memory storage with fallback to PostgreSQL capability
- **External APIs**: Google Translate API integration
- **Build Process**: esbuild for production bundling

## Key Components

### Core Features
1. **Language Translation**: Real-time translation between Chinese (zh-CN), English (en-US), and Tamil (ta-IN)
2. **Voice Input**: Web Speech API integration for voice-to-text conversion
3. **Text-to-Speech**: Browser speech synthesis for audio playback
4. **Translation History**: Persistent storage of translation sessions
5. **Language Switching**: Quick swap between source and target languages

### Frontend Components
- **LanguageSelector**: Language selection interface with visual flag indicators
- **VoiceRecorder**: Speech recognition component with audio visualization
- **TranslationResults**: Display and interaction component for translation output
- **RecentTranslations**: History management and selection interface

### Backend Components
- **Translation API**: Google Translate integration endpoint
- **Storage Layer**: Abstracted storage interface (currently in-memory, expandable to PostgreSQL)
- **Route Management**: RESTful API structure for translation operations

## Data Flow

1. **Translation Request**: User inputs text via typing or voice → Frontend validates and sends to backend
2. **Translation Processing**: Backend calls Google Translate API → Stores result in database/memory
3. **Response Handling**: Frontend receives translation → Updates UI and caches with React Query
4. **History Management**: Recent translations stored and retrievable → Displayed in sidebar component
5. **Voice Features**: Speech recognition converts voice to text → Text-to-speech plays translated results

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