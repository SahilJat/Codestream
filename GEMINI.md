# CodeStream Project Context

## Project Overview

**CodeStream** is a real-time collaborative coding and interview platform organized as a monorepo using **Turborepo**. It features a modern web interface for coding interviews with integrated video calling and live code synchronization.

### Architecture

The project is split into applications and shared packages:

*   **`apps/web`**: A **Next.js 16** (React 19) frontend application.
    *   **Features**: Code editor (Monaco), video calls (PeerJS), real-time updates (Socket.io).
    *   **Styling**: Tailwind CSS, Radix UI.
*   **`apps/api`**: A **Node.js/Express** backend server.
    *   **Role**: Handles real-time socket connections (Socket.io) and signaling for video calls (PeerJS).
    *   **Infrastructure**: Uses Redis for socket adapters and Postgres for persistence.
*   **`packages/db`**: A shared database package using **Prisma** with **PostgreSQL**.
    *   **Models**: `User`, `InterviewSession`.
*   **`packages/ui`**: (Implied) Shared UI components.
*   **`packages/ts-config`**: Shared TypeScript configurations.

### Tech Stack

*   **Languages**: TypeScript
*   **Frontend**: Next.js, React, Tailwind CSS, Monaco Editor
*   **Backend**: Express.js, Socket.io, PeerJS
*   **Database**: PostgreSQL, Redis
*   **ORM**: Prisma
*   **DevOps**: Docker Compose (for local DB/Redis), Turborepo

## key Files & Directories

*   `docker-compose.yml`: Defines the local PostgreSQL and Redis services.
*   `apps/web/app/room/[roomId]/page.tsx`: Likely the main entry point for the collaborative coding room.
*   `apps/api/src/index.ts`: Entry point for the backend server.
*   `packages/db/prisma/schema.prisma`: Database schema definition.

## Development Workflow

### 1. Prerequisites
*   Node.js & npm
*   Docker & Docker Compose

### 2. Setup
1.  **Start Infrastructure**:
    ```bash
    docker-compose up -d
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Setup Database**:
    You need to ensure your `.env` files are set up correctly in `apps/api` and `apps/web` (and potentially root) to point to the local Postgres instance.
    ```bash
    # Generate Prisma Client
    npm run db:generate -w @repo/db
    
    # Push Schema to DB
    npm run db:push -w @repo/db
    ```

### 3. Running the App
Since there is no root `dev` script, you can run the apps using Turbo or individually:

**Using Turbo (Recommended):**
```bash
npx turbo dev
```

**Individually:**
*   **Web**: `cd apps/web && npm run dev` (Runs on http://localhost:3000)
*   **API**: `cd apps/api && npm run dev` (Runs on default port, check code)

## Common Commands

| Command | Description |
| :--- | :--- |
| `npm install` | Install dependencies for the entire workspace. |
| `npx turbo build` | Build all apps and packages. |
| `npm run db:push -w @repo/db` | Push Prisma schema changes to the database. |
| `npm run db:generate -w @repo/db` | Regenerate the Prisma client after schema changes. |
