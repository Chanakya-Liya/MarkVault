# MarkVault

A local markdown reader built for focused reading. Upload `.md` files, read them in a clean interface, annotate with notes, and switch between custom themes — all running locally via Docker with no cloud dependency.

## Features

- **Split view** — open two files side by side with a draggable divider
- **Resizable panel** — drag either edge of a single panel to set your preferred reading width
- **Table of contents** — auto-generated TOC with active-section tracking as you scroll
- **Search** — in-file search with highlighted matches and next/prev navigation
- **Notes** — select any text to attach a note; notes are highlighted in the document and listed in a sidebar
- **Themes** — 7 built-in themes (Light, Dark, Sepia, Forest, Rosé, Ocean, Slate) plus a custom theme builder with a live color preview
- **Reading progress** — progress bar at the top tracks scroll position

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Running

```bash
docker compose up --build
```

Then open [http://localhost:3000](http://localhost:3000).

On subsequent runs (no code changes):

```bash
docker compose up
```

To stop:

```bash
docker compose down
```

## Data

Uploaded files and notes are stored in a SQLite database at `./data/markvault.db`. This file is created automatically on first run and is not tracked by git — your data stays local.

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite, CSS Modules         |
| Renderer | marked, highlight.js, DOMPurify     |
| Backend  | Node.js, Express, better-sqlite3    |
| Runtime  | Docker Compose                      |
