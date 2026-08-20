<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This repo is a **frontend-only** Next.js 16 (App Router, Turbopack, React 19, next-intl) app — the "SEAL FE" competition/hackathon management UI. There is no backend in this repo.

- Backend: the app calls a hosted backend by default (`NEXT_PUBLIC_API_URL`, defaults to `https://seal-bl3w-backend.onrender.com/api`; Google client id and API timeout also have baked-in defaults). No secrets or local backend are required to run or to exercise auth/register flows. To point at a different backend, create `.env.local` with `NEXT_PUBLIC_API_URL` (there is no committed `.env.example` despite the README's mention).
- Run/build/lint commands live in `package.json` (`dev`, `build`, `lint`) and the README ("Chạy local"). Dev server runs on port 3000; visiting `/` 307-redirects to the default locale `/vi` (`en` also available).
- Dependencies must be installed with `--legacy-peer-deps` (peer-dependency conflicts otherwise fail the install); this matches `.github/workflows/ci.yml`. The startup update script already handles this.
- There is **no automated test framework** (no `test` script). "Tests" = `npm run lint` and `npm run build`.
- Gotcha: `npm run lint` currently exits non-zero due to one pre-existing error in `src/views/UserProfileView.tsx` (`react-hooks/immutability`: `setFptCode` used before its declaration). `npm run build` still succeeds. Don't assume a green lint means a clean tree.
