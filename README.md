# SafariBookings

SafariBookings is a Next.js 14 App Router site for Kenya tours with Supabase email/password authentication and a USD wallet backed by Paystack Live.

## Vercel deployment

Import this repository into Vercel with the repository root as the project root and Next.js as the framework. Vercel detects Next.js and uses the `build` script from `package.json`; keep the default install, build, and output settings. No `vercel.json`, custom build command, custom output directory, or other Vercel project configuration is required for the app. The Dockerfile is for container hosting and is not needed by Vercel. See [Vercel's Next.js deployment guide](https://vercel.com/docs/frameworks/full-stack/nextjs) and [build settings guide](https://vercel.com/docs/builds/configure-a-build).

The application uses environment-specific Supabase credentials. The production wallet guard also requires the production marker and Live Paystack key prefixes, and rejects Vercel Preview/Development deployments. Set the following variables in Vercel Project Settings → Environment Variables, selecting **Production only** for each:

- `SUPABASE_ENVIRONMENT` — literal `production`.
- `SUPABASE_PRODUCTION_URL` — HTTPS URL of the production Supabase project.
- `SUPABASE_PRODUCTION_SERVICE_ROLE_KEY` — production Supabase service-role key; server-side only.
- `SUPABASE_PRODUCTION_PROJECT_REF` — exact project-reference hostname prefix from the production Supabase URL.
- `PAYSTACK_LIVE_SECRET_KEY` — Paystack Live secret key, beginning `sk_live_`; server-side only.
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` — Paystack Live public key, beginning `pk_live_`.
- `ALLOWED_ORIGINS` — the exact published site origin, for example `https://your-production-domain.example` with no path or trailing slash.

Do not set production Supabase or Paystack Live values in Vercel Preview or Development. Vercel's Preview environment should use only the dedicated test Supabase values below. No Paystack keys are needed in Preview, and Preview top-ups, payment verification, and wallet bookings stay disabled.

For Vercel Preview authentication, configure these variables in **Preview only**, using the dedicated test Supabase project:

- `SUPABASE_ENVIRONMENT` — literal `test`.
- `SUPABASE_URL` — HTTPS URL of the test Supabase project.
- `SERVICE_ROLE_KEY` — test-project service-role key; server-side only.
- `SUPABASE_TEST_PROJECT_REF` — exact hostname prefix from `SUPABASE_URL`.

Vercel Preview origins are accepted from its `VERCEL_URL` and `VERCEL_BRANCH_URL` system variables when available. If those variables are not enabled for the project, set `ALLOWED_ORIGINS` in Preview to the exact Preview origin you use. Vercel system variables include `VERCEL_ENV` (`production`, `preview`, or `development`) and the deployment URL; see [Vercel's system environment variable guide](https://vercel.com/docs/environment-variables/system-environment-variables).

Environment-variable changes apply to new deployments, not existing deployments, so create a new deployment after changing them. See [Vercel environment variables](https://vercel.com/docs/environment-variables).

## Supabase database setup

Before enabling live wallet operations, apply both SQL files in order to the **production** Supabase project using its SQL Editor:

1. `supabase/migrations/20261025100000_profiles.sql`
2. `supabase/migrations/20261025133000_production_wallet.sql`

These migrations create/retain the profile schema, USD wallet and transaction ledger, bookings, and atomic deposit-credit and booking-debit functions. The wallet readiness check keeps top-ups and wallet bookings disabled until the required schema is present. Apply them to a test Supabase project only when intentionally preparing a separate test schema. Do not apply them to an unrelated Supabase project.

## Wallet behavior

The wallet accepts USD only and opens Paystack InlineJS V1 on the `/wallet` page without redirecting. The application requires at least $2.00 USD, a verified Supabase session, and server-side Paystack verification before crediting a wallet. Booking prices are derived on the server from the tour catalog; wallet debits and booking records are written atomically. No card details are stored by the application.

## Local development and secrets

Use the values from a dedicated test Supabase project for local development. Never put production credentials in source code, commit them, or add them to `.env.example`. `.env.local` is explicitly ignored by Git. The example file documents variable names only; it contains no usable credentials.

## Sources

- [Vercel: Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel: Configuring a Build](https://vercel.com/docs/builds/configure-a-build)
- [Vercel: Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel: System Environment Variables](https://vercel.com/docs/environment-variables/system-environment-variables)
- [Paystack: API reference](https://paystack.com/docs/api/)
- [Paystack: InlineJS V1 to V2 migration](https://paystack.com/docs/guides/migrating-from-inlinejs-v1-to-v2/)
- [Paystack: Accept Payments](https://paystack.com/docs/payments/accept-payments/)
