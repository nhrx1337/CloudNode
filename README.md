# CloudNode

## Overview
**CloudNode** is a self-hosted file sharing workspace. Upload files privately or publish them to a public feed, create expiring and burn-after-read share links, and edit code together in real time. It runs entirely on your own server and keeps the data in PostgreSQL and on disk.

## Installation
1. Clone the repository:
```bash
git clone https://github.com/nhrx1337/CloudNode.git

cd CloudNode/
```

2. Install dependencies:
```bash
pnpm install
```

> **Note:** The commands below use `pnpm` as the default package manager. If you are using **npm**, replace `pnpm` with `npm run` for scripts (e.g., `npm run dev:all`) or use `npx` where applicable. If you are using **yarn**, use `yarn` instead.

## Configuration
Before starting the app, create a .env file in the root directory:
```bash
cp .env.example .env
```
1. Set the required values:
```bash
# PostgreSQL connection string used by Drizzle ORM
DATABASE_URL="postgresql://postgres:password@localhost:5432/cloudnode"

# Secret used to sign session JWTs, generate with: openssl rand -base64 32
JWT_SECRET=change-me-to-a-long-random-string
```

2. Create the database tables:
```bash
pnpm db:push
```

3. Start the app and the collaboration server:
```bash
pnpm dev:all  # Starts both Next.js (http://localhost:3000) and the WebSocket server concurrently

# Or run them separately in two terminals:
pnpm dev:next # Next.js on http://localhost:3000
pnpm dev:ws   # collaboration server on ws://localhost:1234
```

## Usage
- Open your application URL (e.g., `http://localhost:3000` in development, or your configured domain behind Nginx in production), register an account and log in.
- Upload files from the uploads page, public or private.
- Create a share link per file: optional expiry, view limit or burn after read.
- Open the editor page to collaborate with others in the same room over WebSockets.
- Everything is served under one origin, so use nginx in front of both servers in production.

## Behavior & Notes
- Uploads: resumable with the tus 1.0.0 protocol, streamed to `uploads/` under random filenames, capped at 5 GB.
- Incomplete uploads are removed 24 hours after creation, deleted files are removed from disk.
- Every download is re-checked against the session, so private files stay private to their owner.
- Monaco is served locally from `node_modules`, so the editor works without a CDN.

## Stack
- **Next.js 16** (App Router) and **React 19** for the UI and API routes.
- **TypeScript** and **Tailwind CSS v4**.
- **Drizzle ORM** with **PostgreSQL** for users, files and links.
- **@tus/server** and **tus-js-client** for resumable uploads.
- **Monaco Editor** and **ws** for the collaborative editor.
- **bcrypt** and **jose** for password hashing and JWT sessions.

## Project Structure
```text
CloudNode/
├── src/
│   ├── app/               # routes: auth, dashboard, uploads, shares, editor, api
│   ├── components/        # UI, layout, files, shares, editor
│   ├── db/                # Drizzle schema and client
│   ├── lib/               # auth, links, tus, storage helpers
│   └── proxy.ts           # route protection
├── public/                # static assets
├── uploads/               # uploaded files on disk
├── .env                   # environment variables
├── package.json           # metadata and dependencies
└── wsserver.ts            # collaboration WebSocket server
```

## Maintenance
```bash
# Development
pnpm dev:all        # Start Next.js and WebSocket server concurrently in dev mode
pnpm dev:next       # Start Next.js dev server only
pnpm dev:ws         # Start WebSocket server with watch mode only

# Production / Running
pnpm start          # Start Next.js and WebSocket server concurrently in production
pnpm start:next     # Start Next.js production server only
pnpm start:ws       # Start WebSocket server only

# Database & Tools
pnpm db:generate    # create a migration after schema changes
pnpm db:push        # apply migrations
pnpm db:studio      # open Drizzle Studio
pnpm build          # production build
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
```
