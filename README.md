# MyMoney

The native iOS and Android app for [MyMoney](https://mymoneyapp.io), built with Expo and React Native. It is a port of the web app's phone experience (dashboard, spending, income, balance, cards, accounts, goals, calendar, analytics, settings, onboarding) and uses the web app, the `my-money-v2` repository, as its backend.

## Running it locally

You need the web app running, because it serves the API.

1. In `my-money-v2`, start Postgres and the dev server:

   ```bash
   bun run db:up && bun run dev
   ```

2. Here, install dependencies and create your local env file:

   ```bash
   npm install
   cp .env.example .env.local
   ```

   Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env.local` to the same publishable key the web app uses.

3. Start the app:

   ```bash
   npx expo start
   ```

   Press `i` for the iOS simulator or `a` for an Android emulator, or scan the QR code with Expo Go.

In development the app looks for the API on port 3000 of the machine running Metro, which works for simulators and for a phone on the same network. Set `EXPO_PUBLIC_API_URL` to point it somewhere else.

### Without signing in

For UI work you can skip Clerk and use the web app's seeded sample user: start the web app with `MOBILE_API_SAMPLE_USER=1` and set `EXPO_PUBLIC_DEV_SAMPLE_USER=1` in `.env.local`. Both flags are ignored outside development.

## How it fits together

- `src/app/` holds the routes (Expo Router), `src/components/` the UI, `src/api/` the API client, `src/theme/` the design tokens.
- `src/lib/` is **synced from the web repo**: translations, formatters and pure calculations as source, and the API's types as declarations. Refresh it with:

  ```bash
  npm run sync:web
  ```

  It expects `my-money-v2` checked out next to this repository (or `WEB_REPO=/path/to/it`).

See `AGENTS.md` for the conventions.

## Checks

```bash
npm run lint
npm run typecheck
```
