# AIE – NestJS back-end

Reference REST API of the [AIE platform](../README.md) (Framework for Ethical Impact Self-Assessment in AI for the Public Sector), built with **NestJS 11**, **TypeORM** and **PostgreSQL**.

## Requirements

- Node.js 20+ and npm
- PostgreSQL 13+
- (optional) Docker with Compose v2

## Getting started

```bash
cd back-end-nestjs
cp .env.example .env        # then edit the values
npm install
npm run start:dev           # http://localhost:8080
```

Migrations in `src/shared/migrations/` run automatically on start-up (`migrationsRun: true`). With `NODE_ENV=development`, TypeORM also synchronises the schema and logs SQL.

### With Docker

```bash
# from the repository root, back-end + front-end
LOCAL_ENV_FILE=.env.local docker compose -f docker-compose.nest-dev.yml up

# or only this service, from back-end-nestjs/
npm run docker:dev:local    # hot reload, reads ../.env.local
npm run docker:run:local    # production build
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP port |
| `NODE_ENV` | — | `development` enables schema sync and SQL logging |
| `POSTGRES_HOST` | `localhost` | Database host |
| `POSTGRES_PORT` | `5432` | Database port |
| `POSTGRES_USER` | `postgres` | Database user |
| `POSTGRES_PASSWORD` | `postgres` | Database password |
| `POSTGRES_DB` | `database_dev` | Database name |
| `JWT_SECRET` | — (**required**) | Secret used to sign JWTs; the app refuses to start without it |
| `GOVBR_*` | — | Optional gov.br OpenID Connect login; see the [root README](../README.md#govbr-login-optional) |

See [`.env.example`](.env.example).

## API documentation

The OpenAPI 3 specification is generated from the code and served publicly:

- Swagger UI: `http://localhost:8080/api/docs`
- OpenAPI JSON: `http://localhost:8080/api/docs-json`

All data endpoints exchange JSON and, except for the login routes, require `Authorization: Bearer <token>`.

## Modules

| Module | Route | Purpose |
|--------|-------|---------|
| `auth` | `/auth` | Administrator e-mail/password login, JWT issuance |
| `govbr` | `/govbr/authorize`, `/govbr/callback`, `/retornoWebHook` | Optional gov.br OpenID Connect login |
| `admin` | `/admin` | Administrator management |
| `project` | `/projects` | Assessed projects and sharing with other users |
| `session` | `/sessions` | Questionnaire sessions, triage configuration |
| `question` | `/questions` | Questions, options and version history |
| `actor` | `/actors` | Actors that can be linked to questions |
| `classification-level` | `/classification-levels` | Classification levels and thresholds |
| `response` | `/responses` | Submissions and answers per project |
| `result` | `/results` | Final result summary |
| `dashboard` | `/dashboard` | Aggregated, non-personal indicators for the home page |
| `logs` | `/logs` | Audit log (logins and every create/update/delete are recorded by `AuditInterceptor`) |

## Project structure

```
src/
├── main.ts                    # bootstrap: CORS, validation, Swagger
├── app.module.ts              # root module
├── common/interceptors/       # global audit interceptor
├── modules/                   # feature modules (see table above)
└── shared/
    ├── config/database/       # TypeORM configuration
    ├── config/swagger/        # OpenAPI configuration and response schemas
    ├── guards/                # JWT guard
    ├── interfaces/
    └── migrations/            # database migrations
```

## Scripts

```bash
npm run start:dev     # watch mode
npm run build         # compile to dist/
npm run start:prod    # run dist/main.js
npm run lint
npm test              # unit tests
npm run test:e2e      # end-to-end tests
```

## License

[GNU GPL v3.0](LICENSE) — Copyright © 2026 Ministério da Gestão e da Inovação em Serviços Públicos (MGI).
