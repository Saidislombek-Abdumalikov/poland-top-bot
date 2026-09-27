# Poland Top Universities (PTU) Telegram Bot

A Telegram bot built with TypeScript, Grammy framework, and Supabase integration.

## Bot Architecture & Structure

- `src/bot/index.ts` - Bot entrypoint and initialization with Grammy. Starts polling and cloud health check server.
- `src/bot/config.ts` - Environment variables, bot token, admin passcodes, and Supabase config.
- `src/bot/types.ts` - Central TypeScript interfaces and data models.
- `src/bot/handlers/` - Grammy event and command handlers:
  - `startHandler.ts` - `/start` command, user onboarding, Oferta acceptance, and main menu routing.
  - `universityHandler.ts` - Browsing and searching Polish universities.
  - `programHandler.ts` - Browsing degree programs, search, and university application submission.
  - `documentHandler.ts` - Student document uploading and verification tracking.
  - `examHandler.ts` - Test materials & exams repository.
  - `reviewHandler.ts` - Student reviews and ratings.
  - `profileHandler.ts` - Student profile view and language switcher.
  - `textInputHandler.ts` - Handles text inputs during step-by-step forms and admin actions.
  - `adminHandler.ts` - Unified Administrator CRM panel (`/admin`).
- `src/bot/keyboards/` - Keyboard markup builders:
  - `menuKeyboards.ts` - Student user interfaces and navigation keyboards.
  - `adminKeyboards.ts` - Admin CRM keyboards.
- `src/bot/services/` - Core services:
  - `db.ts` - High-performance local JSON store with Supabase cloud synchronization.
  - `auth.ts` - Admin authentication, session management, and constant-time password verification.
  - `storage.ts` - File storage and document uploads.
  - `aiValidation.ts` - Intelligent document verification assistance.
- `src/bot/locales/` - Bilingual localization (Uzbek & English).
- `src/bot/data/` - Static catalogs for universities, programs, and test materials.

## Running the Bot

- Start Bot: `npm run bot`
- Watch Mode: `npm run bot:dev`
- Tests: `npm test`
