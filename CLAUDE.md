# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

The 100xBuddy repository contains three main components:

1. **Backend API** (`100x-buddy-finder-backend/`): Express.js REST API handling authentication, profile management, and matching logic
2. **React Frontend** (`100x-buddy-finder-frontend/`): Legacy Create React App frontend
3. **Next.js Frontend** (`supernetwork-ai-frontend/`): Newer TypeScript/Next.js frontend with enhanced features

The system helps users find collaborative learning buddies through AI-powered profile analysis and matching based on skills, interests, and working styles.

## Common Development Commands

### Backend Development
```bash
cd 100x-buddy-finder-backend
npm install                    # Install dependencies
npm run dev                    # Start dev server with nodemon on port 3001
npm start                      # Start production server
```

### React Frontend Development
```bash
cd 100x-buddy-finder-frontend
npm install                    # Install dependencies
npm start                      # Start dev server on port 3002
npm run build                  # Build for production
npm test                       # Run tests
```

### Next.js Frontend Development
```bash
cd supernetwork-ai-frontend
npm install                    # Install dependencies
npm run dev                    # Start dev server with Turbopack
npm run build                  # Build for production
npm run lint                   # Run ESLint
npm start                      # Start production server
```

## Key API Endpoints

Backend API endpoints follow RESTful patterns:
- `/auth/*` - Authentication (register, login)
- `/profile/*` - User profile management
- `/connections/*` - Connection management
- `/matches/*` - Matching and suggestions
- `/notifications/*` - User notifications
- `/analysis/*` - LinkedIn/GitHub profile analysis

## Tech Stack Details

### Backend
- **Framework**: Express.js with middleware for auth, CORS, and security
- **Database**: Supabase (Postgres)
- **AI**: OpenAI and Groq for profile analysis
- **Scraping**: LinkedIn and GitHub integration for profile enrichment

### React Frontend
- **State**: React hooks and context
- **Routing**: React Router v6
- **API**: Axios with proxy to backend

### Next.js Frontend
- **Framework**: Next.js 15 with App Router
- **Auth**: NextAuth with Supabase adapter
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **TypeScript**: Full type coverage

## Environment Variables

Backend requires:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `OPENAI_API_KEY`
- `GROQ_API_KEY`

Frontend environment variables should be configured in `.env` files (not tracked in git).

## Testing Approach

- React frontend uses Jest with React Testing Library
- Run individual tests in React frontend: `npm test -- TestFile.test.js`
- No test setup in backend or Next.js frontend

## Important Patterns

### API Communication
- React frontend proxies API calls to backend via package.json proxy config
- Next.js frontend likely uses its own API routes or direct Supabase calls

### Authentication Flow
- Backend handles JWT-based auth with Supabase
- Next.js frontend uses NextAuth for session management
- Both share the same Supabase instance

### Profile Analysis
- Backend agents scrape and analyze LinkedIn/GitHub profiles
- Results are stored and used for matching algorithms
- AI models generate compatibility scores and suggestions

### Working Style Implementation
- Frontend form at `/profile/working-style` collects preferences
- Data includes communication style, work hours, decision making, feedback preferences
- Backend endpoints: POST/GET/PUT `/api/profile/working-style`
- Stored in `working_styles` table in Supabase