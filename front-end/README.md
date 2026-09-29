# AIE – Front-end

Web interface of the [AIE platform](../README.md) (Framework for Ethical Impact Self-Assessment in AI for the Public Sector), built with **Next.js 14**, **React 18** and **TailwindCSS**.

The application is configured as a **static export** (`output: 'export'` in `next.config.mjs`): the build produces plain HTML/CSS/JS in `out/` that can be served by any web server (nginx, Apache, a CDN, object storage, etc.). It talks to one of the AIE back-ends (NestJS or Java) through their REST/JSON API.

## Requirements

- Node.js 20+ and npm
- A running AIE back-end (see [back-end-nestjs](../back-end-nestjs/README.md) or [back-end-java](../back-end-java/README.md))

## Getting started

```bash
cd front-end
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL
npm install
npm run dev                  # http://localhost:3000
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/` | Base URL of the back-end API, with trailing slash. Embedded into the bundle at build time. |

## Building for production

```bash
npm run build     # generates the static site in ./out
```

Serve the `out/` directory with any static web server, for example:

```bash
npx serve out
```

Because routing is client-side, configure the server to fall back to the matching `.html` file (e.g. `/projects` → `/projects.html`).

### With Docker

```bash
# from the repository root, front-end + back-end
LOCAL_ENV_FILE=.env.local docker compose -f docker-compose.nest-dev.yml up
```

`front-end/Dockerfile` provides `dev` (hot reload) and `prod` targets.

## Internationalisation

UI strings live in `src/service/languages/{pt,en,es,fr}.ts` and are loaded by `src/service/language.tsx`. To add a language, create a new file with the same keys and register it in `language.tsx`.

## Project structure

```
src/
├── app/               # Next.js App Router pages
│   ├── auth/          # sign-in (administrator / gov.br)
│   ├── projects/      # projects CRUD
│   ├── projects-received/  # finished submissions
│   ├── responses/     # assessment flow and final result
│   ├── sessions/      # sessions CRUD
│   ├── questions/     # questions CRUD
│   ├── config-classifications/  # classification levels
│   ├── actors/        # actors CRUD
│   ├── admins/        # administrator management
│   └── logs/          # audit log
├── components/        # layout, tables, charts, forms, dialogs
├── contexts/          # dialog and language contexts
├── service/           # API client (api.ts) and i18n
└── types/             # shared TypeScript types
```

## Scripts

```bash
npm run dev      # development server
npm run build    # static export to ./out
npm run lint
```

## License

[GNU GPL v3.0](LICENSE) — Copyright © 2026 Ministério da Gestão e da Inovação em Serviços Públicos (MGI).
