# BLOTIC Backend Setup Guide

## Overview
The BLOTIC application has both frontend (React) and backend (Express.js) components. The backend provides API endpoints for enhanced functionality.

## Backend Features
- **Core Team Management**: `/api/core-team`
- **User Registration**: `/api/register`
- **Analytics Dashboard**: `/api/analytics/summary`
- **Health Check**: `/api/health`
- **Faculty Seeding**: `/api/core-team/seed-faculty`

## Development Setup

### Prerequisites
- Node.js 18+ installed
- All dependencies installed (`npm install`)
- Supabase project configured

### Environment Variables
Create a `.env` file with:
```env
SUPABASE_URL=https://hcnudxonfoainnkinouz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
PORT=3001
```

### Running Locally

#### Option 1: Full Development (Frontend + Backend)
```bash
npm run dev:full
```
This starts:
- Frontend: http://localhost:8080
- Backend: http://localhost:3001

#### Option 2: Backend Only
```bash
npm run server:dev
```
Backend available at: http://localhost:3001

#### Option 3: Frontend Only (with fallback)
```bash
npm run dev
```
Frontend at http://localhost:8080 (API calls will fallback to direct Supabase)

### Using Batch Files
- `start-working-server.bat` - Starts both frontend and backend
- `start-server-only.bat` - Starts only the backend server

## Production Deployment

### For Vercel (Frontend Only)
The current Vercel deployment only serves the frontend. API calls automatically fallback to direct Supabase queries.

### For Full Stack Deployment
To deploy with backend support:

1. **Railway/Render/Heroku** (Backend):
   ```bash
   # Deploy server/index.ts to your platform
   # Set environment variables
   # Ensure PORT is configured
   ```

2. **Update Frontend Config**:
   ```typescript
   // Update API base URL in production
   const API_BASE = process.env.NODE_ENV === 'production' 
     ? 'https://your-backend.railway.app'
     : 'http://localhost:3001';
   ```

## API Endpoints

### GET /api/health
Health check endpoint
```json
{ "ok": true }
```

### GET /api/core-team
Fetch core team members
```json
{
  "teamMembers": [...],
  "count": 5,
  "generatedAt": "2025-01-11T..."
}
```

### POST /api/register
Register new user
```json
{
  "email": "user@example.com",
  "password": "password",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "branch": "CSE",
  "year": 2024
}
```

### GET /api/analytics/summary
Admin dashboard analytics
```json
{
  "totalUsers": 150,
  "totalEvents": 25,
  "newUsersLast30Days": 30,
  "roleDistribution": {...}
}
```

## Troubleshooting

### Backend Not Responding
1. Check if backend server is running: `curl http://localhost:3001/api/health`
2. Verify environment variables are set
3. Check Supabase connection
4. Review server logs

### API 404 Errors
- Frontend automatically falls back to direct Supabase queries
- No action needed for basic functionality
- Backend provides enhanced features when available

### CORS Issues
Backend is configured with CORS enabled for all origins in development.

## Architecture

```
Frontend (React/Vite) → Backend (Express.js) → Supabase
                     ↘                      ↗
                       Direct Fallback ----
```

The application is designed with graceful degradation:
- **With Backend**: Full features, enhanced performance
- **Without Backend**: Core functionality via direct Supabase access

## Development Workflow

1. **Local Development**: Use `npm run dev:full`
2. **Frontend Only**: Use `npm run dev` 
3. **Backend Testing**: Use `npm run server:dev`
4. **Production**: Deploy frontend to Vercel, backend separately if needed

## Notes
- Backend is optional for basic functionality
- All critical features work with direct Supabase access
- Backend provides performance optimizations and additional features
- Environment variables must be configured for backend to work properly
