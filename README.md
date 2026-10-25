# Creative Studio (Demo)

An AI-powered creative studio for marketing work: campaign planning, strategy and analysis, data visualization, presentation building, transcription, translation, image generation, text-to-speech, tasks, and a marketing calendar, with an in-app AI assistant. Built solo, zero to one.

**Portfolio demo using sample data created for demonstration, replacing private information from the original project.** The original repository remains private. Branding is neutral ("Creative Studio") and the bundled business context and editorial guidelines describe a made-up company ("Northbeam"). Tasks, calendar items, and metrics are sample data, not real results.

## Tech stack

React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Google Generative AI (Gemini), Firebase (optional sync), Node.js + Express.

## Run locally

1. `npm install`
2. Set `GEMINI_API_KEY` in `.env.local` (see `.env.example`)
3. `npm run dev`

## Demo mode (no keys needed)

- With the placeholder Firebase config, the sign-in page shows "Explore the demo (no sign-in)". It opens a local-only session with sample tasks and calendar items. Nothing is saved to a server.
- Without `GEMINI_API_KEY`, the app loads normally and AI features (chat, strategy, transcription, image/voice generation) show a short "AI features are off in this demo" message instead of crashing.
- To use the full studio, set `GEMINI_API_KEY` and a real Firebase config.

## Notes

- Replace the sample brand context in `src/lib/businessContext.ts` with your own to use it for a real brand.

## Build & verification notes

- `npm run build` passes with `NODE_OPTIONS=--max-old-space-size=1200` on a ~2GB machine (1024 ran out of memory; 1536 was killed once by the container limit). No flag is needed on a normal dev machine. A `.npmrc` sets `legacy-peer-deps=true` so `npm ci` works with the committed lockfile.
- Type checking: `@types/react` and `@types/react-dom` are dev dependencies; the previously reported React-namespace type errors are fixed. Verified with targeted `tsc --noEmit` passes covering the client (`src/**`) and `vite.config.ts`, which pass. A single full-project `tsc` pass (and a `server.ts`-only pass) needs more than ~1.4GB of heap and could not be run on a 2GB machine; the Vite production build passes.
- Checked in a headless browser, no keys: sign-in page, demo entry, home, Tasks (sample tasks), Calendar (sample events), World Clock, and the assistant chat showing the "AI features are off" message. No Firestore requests are made.
- Also checked: creating a task and editing its title (local sample session). Mobile (390px) login and home render without horizontal overflow.
- Not checked: any AI-generated output (needs a key and was deliberately not run), creating/editing calendar events, presentation, storyboard, data visualization, transcription, text-to-speech, and settings screens.
