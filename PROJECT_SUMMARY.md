# Code Clash - Project Summary

This document provides a detailed overview of the core features, architecture, and components that have been developed for **Code Clash**, an interactive, real-time 1v1 competitive coding platform.

---

## 1. Core Architecture & Tech Stack

- **Framework:** Next.js (App Router) with React 19.
- **Real-Time Communication:** Custom Node.js HTTP server running **Socket.io** (`server.js`, `server/socket/`).
- **Database Layer:** **PostgreSQL** with **Prisma ORM**.
- **Authentication:** **NextAuth.js** integrated with the Prisma adapter.
- **Matchmaking Engine:** Backed by **Redis** (`ioredis`) for scalable memory management of active player queues.
- **Styling & UI:** Vanilla CSS (globals), **Tailwind CSS v4**, Framer Motion for sleek animations, and Lucide React for iconography.
- **Code Editor:** `@monaco-editor/react` providing a robust, VS Code-like coding interface directly in the browser.

---

## 2. Real-Time Game & Lobby Architecture

A modular real-time connection infrastructure handles player interaction:
- **Lobby System:** Players can queue up for matchmaking. 
- **Matchmaking Service (`matchmakingService.js`):** Puts querying players into active instances matching their respective rankings.
- **Room Handlers (`roomHandler.js`):** Manages room lifecycle events, joining, game start, real-time code synchronization across the wire, and instant forfeit logics when players disconnect prematurely.
- **Elo Rating Math (`eloService.js`):** Calculates changes in player rankings upon match completions (win/loss).

---

## 3. Sandboxed Judge Service (`judgeService.js`)

At the heart of the platform sits a highly secure remote code execution and testing engine:
- **Execution:** Spawns strictly isolated **Docker** containers for each submission to prevent arbitrary code execution attacks. Uses `--network=none` to restrict web access, caps CPU/memory, and drops privileges (`--cap-drop=ALL`).
- **Supported Languages:**
  - **JavaScript / TypeScript** (via Node.js 18)
  - **Python** (via `python:3.10-slim`)
  - **C++ / C** (via `gcc:latest` container)
  - **Java** (via `eclipse-temurin:17-jdk`)
- **Advanced Evaluation Math:** Includes custom deep comparison algorithms, order-independent nested evaluation arrays, and flexible precision thresholds to rigorously grade outputs across languages against expected hidden and sample test cases.

---

## 4. Database Schema (Prisma)

The application models its logic accurately with the following key database tables (`schema.prisma`):
- **User / Accounts / Sessions:** Core profile models representing next-auth users and storing their current Elo Rating.
- **Room / Match:** Represents active and historical gameplay states between two peers tracking time and winners.
- **Question:** Holds challenges, arguments, difficulty constraints, and both hidden/sample verification test JSON payloads.
- **Submission:** A permanent register for code runs indexing their status (PENDING, ACCEPTED, WRONG_ANSWER, ERROR) and execution times.

---

## 5. Automated Data Ingestion pipeline

- **LeetCode Scraper Pipeline:** Built robust scraping implementations (`scripts/leetcode_scraper.js` & `scripts/seed-problems.js`) to scrape structural data (titles, constraints, templates, difficulty, input arguments) and automatically translate them into our `Question` representation.
- **Local Seeding (`seed_db.js`):** Bootstrapping scripts that populate the platform with initial content so the environment is always ready for matches.

---

## 6. Frontend Features

- **Dynamic Homepage:** Beautiful, engaging landing interface outlining the app's benefits and features.
- **Queue / Matchmaking Views:** Sleek transitions placing players into the search state until a match is found.
- **Arena (Game) View:**
  - Integrated `Monaco Editor` for drafting logic.
  - Interactive test case panes.
  - Submission feedback panels communicating `Passed` / `Wrong Answer` / `Compilation Error` statuses live.
  - Winner/Loser end-screen Modals upon match conclusions or opponent forfeiture.

---

### *Current State of the Platform*
Code Clash operates as a highly scalable production-grade Minimum Viable Product (MVP). It successfully spans the entire lifecycle of a competitive programming match: authenticating users -> finding peers -> executing arbitrary player logic securely against hidden tests -> determining the winner -> adjusting leaderboards accordingly natively.
