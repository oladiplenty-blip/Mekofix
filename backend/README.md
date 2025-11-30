# Mekofix Backend API

Node.js/Express backend with TypeScript for the Mekofix mechanic hailing app.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Fill in your environment variables in `.env`:
   - `PORT` - Server port (default: 3000)
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `SUPABASE_SERVICE_KEY` - Your Supabase service role key
   - `JWT_SECRET` - Secret key for JWT token signing

### Running the Server

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

**Type checking:**
```bash
npm run type-check
```

## Project Structure

```
src/
├── controllers/    # Route handlers
├── routes/         # API routes
├── middleware/     # Express middleware (auth, validation, error handling)
├── services/       # Business logic
├── models/         # Database queries (Supabase)
├── utils/          # Helper functions
├── config/         # Configuration (env, supabase)
├── types/          # TypeScript type definitions
└── app.ts          # Express app entry point
```

## API Endpoints

### Health Check
- `GET /api/health` - Health check endpoint

## Environment Variables

See `.env.example` for all required environment variables.

## Dependencies

- **express** - Web framework
- **@supabase/supabase-js** - Supabase client
- **jsonwebtoken** - JWT token handling
- **bcryptjs** - Password hashing
- **cors** - CORS middleware
- **helmet** - Security middleware
- **express-validator** - Request validation
- **dotenv** - Environment variable management

## Development

This project uses TypeScript for type safety. Make sure to:
- Define types in `src/types/`
- Use proper error handling with `CustomError` class
- Follow the existing folder structure for new features

