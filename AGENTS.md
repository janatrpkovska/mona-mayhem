# Agent Instructions

## Overview

Mona Mayhem is a finished Astro 6 app that compares the GitHub contribution activity of two users in a retro arcade battle. It is live at https://mona-mayhem.vercel.app.

- `src/pages/index.astro` is the only page: markup, scoped CSS, and the client-side TypeScript for battles, the countdown, sounds, streaks, the legend, sharing, and battle history.
- `src/pages/api/contributions/[username].ts` is the only API route: it validates the username, fetches `https://github.com/<username>.contribs`, and caches responses in memory.

## Commands

- `npm ci` installs the exact locked dependencies.
- `npm run dev` starts the development server on http://localhost:4321.
- `npm run lint` runs ESLint on `src/` and `astro.config.mjs`.
- `npm run build` builds the app with the Node adapter.
- `npm run preview` serves that build locally.

Run `npm run lint` and `npm run build` after every change.

## Runtime and deployment

- The app uses `output: 'server'`. `astro.config.mjs` selects `@astrojs/vercel` when `VERCEL` is set (Vercel builds) and `@astrojs/node` in standalone mode otherwise. Keep both paths working.
- To check the Vercel build locally, run `VERCEL=1 npm run build` and inspect `.vercel/output/`. Never commit that folder.
- Images use `passthroughImageService()`. Don't switch back to the Sharp service: the app has no images to optimize, and Sharp would put image decoding into the public server function.
- The in-memory API cache lives per server instance, so on Vercel it is best effort.

## Dependencies

- Don't add, remove, or upgrade dependencies without the maintainer's approval.
- `@astrojs/vercel` is pinned to `10.0.8`, the last release with `astro ^6` as a peer dependency. Version 11 needs Astro 7, so upgrading Astro and the adapters is one deliberate migration, never a side effect of another change.
- Never resolve peer dependency conflicts with `--force` or `--legacy-peer-deps`.

## Code practices

- Keep pages and API routes in `src/pages/`. Keep server-only logic in API routes or frontmatter, and use browser JavaScript only for interactions.
- Use `.astro` components by default. Add a client-hydrated framework component only when an interaction requires one.
- Type API handlers with `APIRoute`, return standard `Response` objects with the right status and `Content-Type`, and handle invalid input and upstream failures explicitly.
- Keep the strict TypeScript configuration and explicit types at API boundaries.
- In the client script, build the DOM with `createElement` and `textContent`. Never insert usernames, API data, or saved history with `innerHTML`.

## Design

- Use the dark arcade palette: background `#0a0a1a`, neon green `#5fed83`, and purple `#8a2be2`.
- Use Press Start 2P for display and interface text, and keep small text readable with enough size and contrast.
- Use CSS for scanlines, neon glow, and arcade animation. Don't add dependencies for visual effects.
- Keep layouts responsive: stack battle controls and results on narrow screens, and keep contribution graphs horizontally scrollable instead of shrinking their squares.
- Respect `prefers-reduced-motion` by turning off or minimizing nonessential animation.

## Security and privacy

- The app needs no secrets or environment variables. Never commit `.env*` files, `.vercel/`, tokens, or personal data.
