This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## MyMoney: architecture

MyMoney is the native app for the product whose web app lives in the `my-money-v2` repository (Next.js). The web app stays the backend: this repo holds no business rules of its own and talks to it over one endpoint.

- **API**: `POST {EXPO_PUBLIC_API_URL}/api/mobile/rpc/<method>` runs one entry of the web repo's `mobileApi` registry (`src/lib/mobile/api.ts` there): the same queries and server actions the web pages call. Authentication is the Clerk session token as a bearer token. Call it with `callApi('goals.create', input)` or the hooks in `src/api/hooks.ts`; methods, arguments and results are fully typed.
- **`src/lib/` is synced from the web repo** by `npm run sync:web` (`scripts/sync-web.mjs`) and mirrors its paths. Pure modules (messages, formatters, scope calculators, plan rules) come as source; server modules (`*-queries`, `*-actions`, `mobile/api`) come as `.d.ts` only, so import from those with `import type`. Never edit a synced file here: change it in the web repo and sync. The files this repo owns inside `src/lib/` are the ones missing from `src/lib/.synced.json` (currently `i18n/provider.tsx`).
- **Adding a server call**: add the entry to `mobileApi` in the web repo, then `npm run sync:web`.
- **Hosted flows** (Stripe Checkout and portal, Google Calendar consent) open the web app in an in-app browser through `openWebFlow()` (`src/api/web-handoff.ts`), signed in with a single-use ticket.
- **Payments**: native builds sell plans through the App Store and Google Play via Adapty (`src/providers/store-billing.ts`, `react-native-adapty`), keyed by our `users.id` as Adapty's customer user ID. After a purchase or restore the app calls `billing.syncStore`; the web app's Adapty webhook keeps it in sync afterwards, writing `store_subscriptions`, which entitlements combine with Stripe (`entitlements.provider` says who bills). Store products are named `mymoney.<plus|premium>.<monthly|yearly>` (on Play: subscription `mymoney.<tier>`, base plans `monthly`/`yearly`); `store-products.ts` reads the tier and interval from the IDs. Without `EXPO_PUBLIC_ADAPTY_PUBLIC_KEY`, in Expo Go and on web, the app falls back to the Stripe checkout handoff. A store subscriber is never sent to Stripe: manage and upgrade open the store's subscription settings.
- **Auth**: Clerk, through `src/providers/auth-provider.tsx`. Screens read `useSession()`, never Clerk hooks directly. `EXPO_PUBLIC_DEV_SAMPLE_USER=1` (development only) skips sign-in and uses the web app's seeded sample user.
- **Shell**: `src/app/(app)/_layout.tsx` loads `app.bootstrap` (plan, onboarding, workspaces, display preferences) and applies the same gates as the web layout. Read it with `useBootstrap()` / `useEntitlements()`.

## MyMoney: UI conventions

The UI is a port of the web app's phone layout; when in doubt, open the matching component in `my-money-v2/src/components/` and its screenshot in `my-money-v2/screenshots/mobile-screen/`.

- Routes live in `src/app/`, feature components in `src/components/<feature>/`, at the same paths the web repo uses (`@/components/goals/goal-card`).
- Style with `StyleSheet`/inline styles and the tokens in `src/theme/tokens.ts`, read through `useTheme()`. Token names follow the web's Tailwind utilities (`bg-surface-1` is `colors.surface1`). Never hardcode a colour that has a token: both themes must work.
- All text goes through `Text` from `@/components/ui/text` (`font`, `size`, `color` props). Display headings use `font="display"` / `"displayItalic"`, numbers `font="mono"`.
- Build screens from `src/components/ui/*` (`Screen`, `Card`, `Button`, `IconButton`, `Chip`, `Input`, `FormField`, `CurrencyInput`, `DateInput`, `Select`, `SegmentedControl`, `Switch`, `Sheet`, `Modal`, `Skeleton`, `ProgressBar`, `toast`) plus `PageHeader`, `PeriodFilter`, `DataTable`, `QuickTipCard`, `CardNoData`. A web `Modal` is the full-screen `Modal` here; a popover or `<select>` is a `Sheet` / `Select`.
- Strings come from `useI18n().messages` (synced from the web app, pt-BR and en-US). Do not add user-facing literals; if the web has no message for something, add it to the web repo's `messages.ts` and sync.
- Money and dates are formatted with `useI18n()` and `@/lib/i18n/format`, exactly as on the web.
- Icons: `lucide-react-native`, same names as the web's `lucide-react`. Charts: `react-native-svg`.
- Data: `useScreenQuery(method, args)` on screens (refetches on focus), `useApiAction(method)` for mutations (refreshes all data afterwards, like `router.refresh()`), pull-to-refresh via `usePullToRefresh` + `<Screen onRefresh refreshing>`.
- Commits follow Conventional Commits (`feat: ...`, `fix: ...`, `chore: ...`), enforced by `.githooks/commit-msg`.
