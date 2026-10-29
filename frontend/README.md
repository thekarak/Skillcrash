# Skillcrash — Frontend

The web frontend for **Skillcrash**, an AI skill testing and evaluation platform.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS 4, shadcn/ui + Radix |
| State | Zustand |
| 3D | Three.js |
| Local persistence | Prisma + SQLite |
| Package manager | Bun (npm works too) |

## Getting Started

```bash
# 1. Install dependencies
npm install            # or: bun install

# 2. Environment
cp .env.example .env   # creates local config

# 3. Create the local database
npx prisma db push     # or: bunx prisma db push

# 4. Run the dev server
npm run dev            # or: bun run dev
# open http://localhost:3000
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build (standalone output) |
| `npm run start` | Serve the standalone production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Sync Prisma schema to local SQLite |

## Directory Layout

```text
src/
  app/                    # Next.js entry: layout, page, globals.css, /api, /workspace
  components/skillcrash/  # UI: landing, workspace, shared, three (3D)
  components/ui/          # shadcn/ui component library
  hooks/                  # Custom React hooks
  lib/                    # Domain layer: store, types, utils
prisma/                   # Prisma schema (SQLite)
public/                   # Static assets
```
