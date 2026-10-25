# SafariBookings Live Wallet and Vercel Handoff Plan

## Product and money-flow scope

Preserve the SafariBookings home, 100-tour catalog, listing, details, and responsive visual language. Keep the email/password `/login` experience and server-side Supabase Auth APIs. Development and Vercel Preview use only the dedicated test Supabase project; published production uses only the separately configured production project. `SUPABASE_ENVIRONMENT=test` selects the test variables; `SUPABASE_ENVIRONMENT=production` selects production variable names and is accepted only in a production runtime. Every selected Supabase URL must match its project reference. No fallback between projects is allowed, no service-role key reaches the browser, and `.env.local` is ignored and never read or committed.

Enable Paystack Live only when `NODE_ENV=production`, `SUPABASE_ENVIRONMENT=production`, the production-scoped public and secret key prefixes match, and any supplied `VERCEL_ENV` is `production`. Vercel Preview/Development never loads the Paystack script or enables payment verification or wallet bookings. The public key is served by a production-only runtime endpoint so Next.js does not inline it into Preview browser output. The user will configure environment variables in Vercel and initiate deployment; the assistant will not create/configure a Vercel project or deploy it.

Use the requested Paystack InlineJS V1 popup at `https://js.paystack.co/v1/inline.js` with `PaystackPop.setup(...).openIframe()`, remaining on `/wallet` with no redirect. The server creates a pending ledger row and random reference for the verified session user. The callback alone never credits funds. The server independently verifies exact reference, successful status, live domain, USD currency, expected amount, and customer identity with Paystack. A database function locks the pending transaction and wallet and returns without a second credit on replay. The minimum is $2.00 USD, matching Paystack's published USD minimum for Kenya and Nigeria. Paystack fees may reduce the merchant's settlement while the same gross USD is credited as virtual booking balance.

## Wallet, ledger, and bookings

The production wallet renders only the signed-in user's Supabase ledger and balance, denominated in USD. Pending and posted deposits and booking debits are shown. No card details or credentials are stored. `/wallet` explains that live money actions are production-only when shown in Preview.

On tour detail pages, an authenticated production user can pick a date and one to six guests and select “Book with Wallet.” The server derives current tour price, title, and location from `data/tours.json`; the browser cannot choose the authoritative price or user identity. One Supabase RPC atomically checks balance, creates the booking, debits the wallet, and records the ledger entry using an idempotency key. `/bookings` shows only the current user's rows.

## Data and security architecture

Keep the profiles migration and an additive, repeatable wallet migration for `wallets`, `wallet_transactions`, and `bookings`. The SQL functions are service-role-only and use transaction locks for deposit credit and booking debit. The owner must apply the two migration files to the matching Supabase projects; the assistant will not access or change Supabase data. Live wallet endpoints remain disabled until the production readiness function confirms the schema exists.

Vercel uses `VERCEL_ENV` when available to block Live wallet actions from Preview. The origin allowlist accepts exact configured origins and, for Vercel Preview/Development, exact deployment and branch aliases from `VERCEL_URL` and `VERCEL_BRANCH_URL`. Production origin remains an explicit Vercel environment variable. Vercel's environment-scoped variables keep the production project and Paystack Live keys out of Preview.

## Project structure

- `app/login/page.tsx` and `app/api/auth/*` provide email/password signup, sign-in, sign-out, and verified user state.
- `lib/supabase-admin.js`, `lib/supabase-auth.js`, and `lib/origin-guard.js` select the correct environment-scoped Supabase project and enforce verified identity/origin rules.
- `app/wallet/page.tsx` and `components/WalletClient.tsx` provide the production wallet and Preview-only lock state.
- `app/api/wallet/*` expose wallet readiness and authenticated balance/history; `app/api/paystack/*` create pending deposits and verify them server-side.
- `app/api/bookings/*` and `components/BookingCard.tsx` create server-priced, atomic wallet bookings; `components/BookingsClient.tsx` renders booking history.
- `supabase/migrations/*` contain profiles and additive wallet/booking schema plus atomic RPCs.
- `README.md` documents Vercel Production and Preview environment values and database migration prerequisites.
- `public/manus-routes.json` declares every page route and excludes APIs.
- `Dockerfile` remains for container use; Vercel uses the detected Next.js framework defaults and the `build` script from `package.json`.

## GitHub and Vercel delivery

Use the authorized GitHub connector to inspect the user's existing `bradlyn693-code/Tours-travel-` repository, preserve its existing history/files, and push the intended code and README to `main` with the exact commit message requested. Never force-push or include `.env.local` or any credential values. The user will set the listed environment variables in Vercel and deploy the project themselves. Vercel detects Next.js and uses framework build defaults; no custom build command, output directory, `vercel.json`, or assistant-side Vercel configuration is planned. The user must apply the production migrations before the readiness gate enables wallet actions.

## Design direction

Reuse the established SafariBookings visual system: white rounded cards, quiet neutral canvas, wildlife photography, accessible spacing, and #00A651 as the signature green for trust and primary actions. The wallet uses a clear balance card, visibly labeled USD amounts, restrained ledger rows, and a production-only lock state in Preview. Motion remains limited to short, reduced-motion-aware feedback for loading and success; payment overlays are Paystack's own popup. Voice stays direct and reassuring, such as “Add funds securely” and “Your wallet is updated after Paystack confirms payment.”

## Provider references

Paystack's API reference documents amount values in currency subunits and a $2.00 USD transaction minimum for Kenya and Nigeria: https://paystack.com/docs/api/ . The official InlineJS migration guide documents V1 `PaystackPop.setup()` and `openIframe()` while describing V2's newer capabilities: https://paystack.com/docs/guides/migrating-from-inlinejs-v1-to-v2/ . Paystack's accept-payments guide says transaction status and amount must be verified before delivering value: https://paystack.com/docs/payments/accept-payments/ . Vercel documents automatic Next.js framework build settings at https://vercel.com/docs/frameworks/full-stack/nextjs and environment scoping at https://vercel.com/docs/environment-variables .