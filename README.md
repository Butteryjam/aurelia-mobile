# Aurelia Mobile

A mobile client for the Aurelia recipe management system, built with React Native and Expo.

[![Expo SDK](https://img.shields.io/badge/Expo-SDK_57-4630EB?style=flat-square&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.86-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

---

## Overview

Aurelia Mobile provides an on-device interface for browsing recipes, managing meal plans, generating shopping lists, and using interactive timers while cooking. It is designed to work alongside the [Aurelia web application](https://github.com/Butteryjam/aurelia), connecting directly to Supabase for database storage and user authentication, and calling the Aurelia web backend for AI-assisted operations.

---

## Screenshots

<!-- App screenshots will be added in a future release. -->

---

## Features

- **Recipe Catalog & Search**: Browse, filter, and search saved recipes by title, cuisine, difficulty level, and tags.
- **Recipe Management & Draft Persistence**: Create and edit recipes with automatic local draft saving to AsyncStorage, preventing form data loss if navigation is interrupted.
- **Cook Mode with Screen Wake Lock**: Step-by-step cooking view with multiple concurrent countdown timers and `expo-keep-awake` integration to keep the display active during cooking.
- **Serving Scaler**: Real-time proportional ingredient quantity adjustment supporting fractional and decimal measurements.
- **AI Chef Assistant**: Chat interface for recipe questions and culinary advice, authenticated via Supabase JWT and routed through the Aurelia backend.
- **Recipe Extraction**: Import recipes from pasted text or camera/gallery photos via the backend extraction API.
- **AI Recipe Modifications**: Apply structured adjustments to recipes (e.g. dietary substitutions, spice adjustments, faster prep) through backend endpoints.
- **Meal Planning**: Weekly grid layout for breakfast, lunch, dinner, and snack scheduling.
- **Consolidated Shopping Lists**: Aggregates ingredients from meal plans and individual recipes, grouped by grocery aisle categories with checkable items.
- **Collections & Favorites**: Organize recipes into named collections and toggle favorites.
- **Deep Linking**: Configured URL scheme (`aurelia://`) for routing directly to specific recipes and collections.
- **Theme Support**: Light mode, dark mode, and automatic system theme detection.

> **Note on Data Access**: The mobile client requires an active internet connection to authenticate, read and write data to Supabase, and call AI endpoints. Local caching is currently limited to active recipe form drafts.

---

## Technology Stack

| Technology | Version | Role in Project |
| :--- | :--- | :--- |
| **React Native** | `0.86.3` | Cross-platform mobile UI runtime |
| **Expo** | `~57.0.26` (SDK 57) | Native platform tooling and managed module ecosystem |
| **Expo Router** | `~57.0.24` | File-based typed routing and deep linking |
| **TypeScript** | `~6.0.3` | Static type checking and schema enforcement |
| **Supabase JS** | `^2.117.2` | Authentication session management and PostgreSQL client |
| **TanStack React Query** | `^5.104.0` | Asynchronous server-state management and query caching |
| **Zod** | `^4.6.5` | Runtime schema validation and form parsing |
| **Vitest** | `^3.0.0` | Unit and component test runner |
| **Lucide React Native** | `^1.48.0` | Vector iconography |

---

## Architecture

The mobile application operates as a client that communicates with two external services:

```text
┌─────────────────┐       Direct PostgreSQL queries (RLS)
│  Aurelia Mobile │ ──────────────────────────────────────────► Supabase (Auth & DB)
│  (React Native) │
└────────┬────────┘
         │
         │ Authenticated HTTP requests (JWT Bearer)
         ▼
┌─────────────────────────┐
│ Aurelia Web API         │ ───► OpenAI / Gemini API (Extraction & Chef Chat)
│ (Next.js on Vercel)     │
└─────────────────────────┘
```

1. **Supabase**: Handles user authentication, session persistence (stored in AsyncStorage), and direct CRUD operations for recipes, collections, meal plans, and shopping lists protected by Row Level Security (RLS).
2. **Aurelia Web Backend**: Privileged operations—such as AI image extraction, chat completions, recipe modifications, and rate limiting—are handled by the Next.js server. The mobile app passes the user's Supabase session access token in the `Authorization` header to authenticate each request.

---

## Installation and Setup

### Prerequisites

- **Node.js**: `>= 20.x`
- **npm**: `>= 10.x`
- An Android device, Android emulator, iOS simulator, or the **Expo Go** application.

### 1. Clone the Repository

```bash
git clone https://github.com/Butteryjam/aurelia-mobile.git
cd aurelia-mobile
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

> **Why `--legacy-peer-deps`?** Expo SDK 57 runs on React 19. Certain transitive dev dependencies have strict peer dependency declarations that npm's default resolver flags during resolution.

### 3. Configure Environment Variables

Create a local `.env` file from the example template:

```bash
cp .env.example .env
```

Set the appropriate endpoints for your setup:

```env
# Supabase public credentials (client-safe)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_anon_key

# Aurelia Next.js API endpoint
EXPO_PUBLIC_API_URL=http://localhost:3000
```

#### Network Configuration Guide for `EXPO_PUBLIC_API_URL`

- **Android Emulator**: Set to `http://10.0.2.2:3000` (10.0.2.2 routes to the host machine's localhost).
- **iOS Simulator**: Set to `http://localhost:3000`.
- **Physical Android / iOS Device**: Set to your computer's local network IP address (e.g. `http://192.168.1.100:3000`). Both your phone and development computer must be connected to the same Wi-Fi network.
- **Production Backend**: Set to your deployed instance (e.g. `https://aurelia-gamma-one.vercel.app`).

---

## Development and Testing Commands

| Command | Action |
| :--- | :--- |
| `npm start` | Start the Expo Metro bundler interactive development server |
| `npm run android` | Launch the app in a connected Android emulator or device |
| `npm run ios` | Launch the app in an iOS simulator |
| `npm run web` | Start the app in a web browser |
| `npm run typecheck` | Run TypeScript type checking (`tsc --noEmit`) |
| `npm test` | Run the unit and integration test suite with Vitest |

---

## Android Build Instructions

The project is configured for building with **Expo Application Services (EAS Build)** via `eas.json`.

### Prerequisites for Cloud Builds

Install the EAS CLI globally:

```bash
npm install -g eas-cli
```

### Build a Standalone Android APK (Testing / Preview)

```bash
eas build --platform android --profile preview
```

### Build an Android App Bundle (Production / Google Play)

```bash
eas build --platform android --profile production
```

---

## Bug Reporting and Feature Requests

This repository follows an **issue-only community model**:

- **Bug Reports & Suggestions**: Anyone is welcome to submit bug reports and feature requests using our [GitHub Issue Templates](https://github.com/Butteryjam/aurelia-mobile/issues/new/choose).
- **Maintenance & Fixes**: Application development, bug fixes, and releases are maintained directly by the repository owner ([@Butteryjam](https://github.com/Butteryjam)).
- **Pull Requests**: External pull requests are not actively accepted or automatically merged. If you encounter a problem, opening an issue with clear reproduction steps is the best way to have it addressed.

---

## Security

- **Client-Safe Variables**: Only public configuration prefixed with `EXPO_PUBLIC_` is included in the client bundle.
- **Zero Committed Secrets**: `.env` files, private signing keys, keystores, and service-role tokens are explicitly ignored by `.gitignore` and are not committed to source control.
- **Backend Authentication**: All sensitive AI operations and rate-limited actions require a valid Supabase JWT and are handled server-side.

---

## Related Project

- **Aurelia Web**: [https://github.com/Butteryjam/aurelia](https://github.com/Butteryjam/aurelia) — The main Next.js web application and backend API.

---

## License

This project is licensed under the [MIT License](LICENSE).
