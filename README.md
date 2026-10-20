# Aurelia Mobile 🍳✨

> The modern, elegant culinary companion for home chefs and food lovers. Powered by React Native, Expo, TypeScript, and Supabase.

[![CI](https://github.com/Butteryjam/aurelia-mobile/actions/workflows/mobile-ci.yml/badge.svg)](https://github.com/Butteryjam/aurelia-mobile/actions/workflows/mobile-ci.yml)
[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-000020.svg?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB.svg?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Postgres-3ECF8E.svg?logo=supabase)](https://supabase.com)
[![Vitest](https://img.shields.io/badge/Vitest-152%20Tests%20Passing-6E9F18.svg?logo=vitest)](https://vitest.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

**Aurelia Mobile** is the mobile application of the [Aurelia](https://github.com/Butteryjam/aurelia) culinary ecosystem. Crafted with a refined warm-canvas aesthetic (`#FAF7F2`), editorial typography (*Playfair Display* & *DM Sans*), and smooth micro-interactions, Aurelia delivers a focused culinary experience right in the kitchen.

The mobile app operates autonomously as an independent React Native / Expo application, interfacing with Supabase for data persistence and authentication, and communicating with the Aurelia Next.js API for AI-assisted culinary operations.

---

## Key Features

- 🥘 **Smart Recipe Library & Discovery**: Browse, search, filter, and sort your entire culinary catalog with instant full-text filtering and dietary tag navigation.
- 🧑‍🍳 **AI Sous Chef & Natural Language Chat**: Context-aware culinary assistant that answers recipe questions, suggests substitutions, and provides personalized cooking advice.
- 📸 **AI Recipe Extraction**: Import recipes seamlessly from photos, screenshots, handwritten recipe cards, or pasted text with automated field structuring.
- ⏱️ **Interactive Hands-Free Cook Mode**:
  - Full-screen distraction-free cooking steps.
  - Built-in multi-stage timers with acoustic cues and haptic feedback.
  - Screen wake lock to prevent the device from sleeping while your hands are busy.
  - Dynamic serving scaling with instant ingredient quantity recalculation.
- 📅 **Visual Meal Planner**: Schedule breakfast, lunch, dinner, and snacks across a weekly calendar with nutritional summaries.
- 🛒 **Intelligent Shopping List Consolidation**: Automatically consolidate ingredients from recipes and meal plans into grouped grocery categories with unit conversion and checkable aisles.
- 📚 **Curated Collections & Favorites**: Organize recipes into custom collections (e.g. *Weekend Feasts*, *Quick Dinners*) with cover image customization.
- 💾 **Offline-Resilient Draft Auto-Save**: Recipe editing and creation automatically persist to local storage to prevent data loss.
- 🔗 **Universal Deep Linking**: Open recipe and collection links directly into native app screens.

---

## Architecture & Tech Stack

```
aurelia-mobile/
├── .github/
│   ├── ISSUE_TEMPLATE/        # Bug report and feature request templates
│   ├── workflows/             # GitHub Actions CI/CD workflows
│   └── PULL_REQUEST_TEMPLATE.md
├── assets/                   # App icons, splash screens, and images
├── src/
│   ├── app/                  # Expo Router file-based route hierarchy
│   ├── components/           # Modular UI components & design system
│   ├── constants/            # Navigation and configuration constants
│   ├── features/             # Feature domains (ai, auth, cook-mode, recipes, etc.)
│   ├── hooks/                # Custom React and Expo hooks
│   ├── lib/                  # Supabase, API client, and utility modules
│   ├── shared/               # Self-contained database types and schemas
│   └── theme/                # Design tokens (colors, typography, spacing)
├── tests/                    # 17 Vitest suites covering all app domains
├── scripts/                  # Development and helper scripts
├── app.json                  # Expo application configuration
├── eas.json                  # Expo Application Services build configurations
├── package.json              # Dependencies and script definitions
├── tsconfig.json             # Strict TypeScript compiler options
└── vitest.config.ts          # Vitest test runner configuration
```

| Technology | Purpose |
| :--- | :--- |
| **Expo (SDK 57)** | Universal React Native platform & managed build tooling |
| **Expo Router** | File-based, typed routing with deep-link support |
| **React Native 0.86** | Cross-platform native mobile runtime |
| **TypeScript 6.0** | End-to-end static typing and schema verification |
| **Supabase JS** | Authentication session management & Postgres client |
| **TanStack React Query** | Asynchronous state management, query caching, and mutations |
| **Vitest** | Blazing-fast unit and component test runner |
| **Lucide Icons** | Unified vector iconography |

---

## Getting Started

### Prerequisites

- **Node.js**: `>= 20.x`
- **npm**: `>= 10.x`
- **Expo Go** app on your phone, or an Android Studio Emulator / iOS Simulator.
- (Optional) **EAS CLI**: `npm install -g eas-cli` for cloud builds.

### 1. Clone the Repository

```bash
git clone https://github.com/Butteryjam/aurelia-mobile.git
cd aurelia-mobile
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Configure Environment Variables

Create a local `.env` file by copying the template:

```bash
cp .env.example .env
```

Configure your endpoints:

```env
EXPO_PUBLIC_SUPABASE_URL=https://upzkcqovqstfsizerulx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=http://localhost:3000
```

> 💡 **Note for Android Emulator**: Use `http://10.0.2.2:3000` as `EXPO_PUBLIC_API_URL` to refer to your host computer's localhost.

---

## Development Scripts

| Command | Action |
| :--- | :--- |
| `npm start` | Launch the Expo Metro bundler interactive development server |
| `npm run android` | Open directly in connected Android device / emulator |
| `npm run ios` | Open directly in connected iOS simulator |
| `npm run web` | Run web preview in browser |
| `npm run typecheck` | Run strict TypeScript compiler verification (`tsc --noEmit`) |
| `npm test` | Run the full test suite with Vitest (152 tests across 17 suites) |
| `npm run lint` | Run Expo linter |

---

## Building Native Binaries (EAS)

Aurelia Mobile is configured for Expo Application Services (EAS Build).

### Build Android Standalone APK (Preview / Testing)

```bash
eas build --platform android --profile preview
```

### Build Android App Bundle (Google Play Production)

```bash
eas build --platform android --profile production
```

### Build iOS Simulator / Production

```bash
eas build --platform ios --profile preview
```

---

## Security & Secrets Policy

- **Zero Secrets in Git**: No API keys, signing keystores, service-role tokens, or private environment files are tracked in source control.
- **Client-Safe Variables**: Only public variables prefixed with `EXPO_PUBLIC_` are bundled into the client runtime.
- **Backend Routing**: All AI provider integrations (OpenAI, Gemini) and privileged database operations route through authenticated server-side endpoints on the Aurelia backend.

---

## Contributing

1. Fork the repository.
2. Create your feature branch: `git checkout -b feature/delightful-feature`.
3. Verify type safety: `npm run typecheck`.
4. Ensure all tests pass: `npm test`.
5. Commit your changes: `git commit -m 'feat: add delightful culinary feature'`.
6. Push to branch: `git push origin feature/delightful-feature`.
7. Submit a Pull Request following the PR template.

---

## Related Repositories

- **Aurelia Web**: [https://github.com/Butteryjam/aurelia](https://github.com/Butteryjam/aurelia) — The flagship Next.js web application deployed on Vercel.

---

## License

This project is licensed under the [MIT License](LICENSE).
