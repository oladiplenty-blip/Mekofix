# Mekofix

A mechanic hailing app built with React Native (Expo) and TypeScript.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (installed globally or via npx)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on iOS:
```bash
npm run ios
```

4. Run on Android:
```bash
npm run android
```

## Project Structure

```
src/
├── components/
│   ├── common/       # Reusable UI components
│   ├── maps/         # Map-related components
│   └── forms/        # Form components
├── screens/
│   ├── auth/         # Authentication screens
│   ├── customer/     # Customer screens
│   ├── mechanic/     # Mechanic screens
│   ├── vendor/       # Vendor screens
│   └── marketplace/  # Marketplace screens
├── navigation/       # React Navigation setup
├── services/         # API calls and services
├── store/            # Zustand state management
├── hooks/            # Custom React hooks
├── utils/            # Helper functions
├── constants/        # App constants
└── types/            # TypeScript type definitions
```

## Environment Variables

Create a `.env` file in the root directory:

```
EXPO_PUBLIC_API_URL=your_api_url
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Dependencies

- **@react-navigation/native** - Navigation library
- **react-native-maps** - Maps integration
- **expo-location** - Location services
- **@supabase/supabase-js** - Supabase client
- **zustand** - State management
- **react-hook-form** - Form handling
- **axios** - HTTP client

## Development

This project uses TypeScript for type safety. Make sure to define types in `src/types/` and use them throughout the application.

