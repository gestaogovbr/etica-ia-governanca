# AIE – Java back-end

Spring Boot implementation of the [AIE platform](../README.md) REST API (Framework for Ethical Impact Self-Assessment in AI for the Public Sector). It mirrors the [NestJS back-end](../back-end-nestjs/README.md) — same routes, same JSON payloads, same PostgreSQL schema — for organisations that standardise on the JVM. Deploy **one** of the two back-ends.

Stack: **Java 17**, **Spring Boot 3**, Spring Security (JWT), Spring Data JPA / Hibernate, PostgreSQL, springdoc-openapi.

## Requirements

- JDK 17+
- Maven 3.9+
- PostgreSQL 13+ (the schema is created by the NestJS migrations; Hibernate runs with `ddl-auto: update`)

## Configuration

The service reads environment variables (or a `.env` file in the working directory, loaded with `dotenv-java`). Copy the example and edit it:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | `8080` | HTTP port |
| `POSTGRES_HOST` | `localhost` | Database host |
| `POSTGRES_PORT` | `5432` | Database port |
| `POSTGRES_DB` | `aie` | Database name |
| `POSTGRES_USER` | `root` | Database user |
| `POSTGRES_PASSWORD` | `root` | Database password |
| `JWT_SECRET` | — (**required**) | Secret used to sign JWTs |
| `JWT_ACCESS_EXPIRES_IN` | `1h` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `GOVBR_*` | — | Optional gov.br OpenID Connect login; see the [root README](../README.md#govbr-login-optional) |

## Running

```bash
cd back-end-java
mvn spring-boot:run          # http://localhost:8080
```

or build a JAR:

```bash
mvn clean package -DskipTests
java -jar target/*.jar
```

### With Docker

```bash
# from the repository root, back-end + front-end
LOCAL_ENV_FILE=.env.local docker compose -f docker-compose.java-dev.yml up

# or only this service, from back-end-java/
LOCAL_ENV_FILE=.env.local docker compose up java-local
```

## API documentation

The OpenAPI 3 specification is generated from the code and served publicly:

- Swagger UI: `http://localhost:8080/docs`
- OpenAPI JSON: `http://localhost:8080/api-docs`

All data endpoints exchange JSON (snake_case) and, except for the login routes, require `Authorization: Bearer <token>`.

## Modules

`src/main/java/com/aie/backend/modules/`:

| Module | Route | Purpose |
|--------|-------|---------|
| `auth` | `/auth` | Administrator e-mail/password login, JWT issuance |
| `govbr` | `/govbr/authorize`, `/govbr/callback`, `/retornoWebHook` | Optional gov.br OpenID Connect login |
| `admin` | `/admin` | Administrator management |
| `project` | `/projects` | Assessed projects and sharing |
| `session` | `/sessions` | Questionnaire sessions and triage |
| `question` | `/questions` | Questions, options and versions |
| `actor` | `/actors` | Actors linked to questions |
| `classificationlevel` | `/classification-levels` | Classification levels and thresholds |
| `response` | `/responses` | Submissions and answers |
| `result` | `/results` | Final result summary |
| `dashboard` | `/dashboard` | Aggregated, non-personal indicators |
| `logs` | `/logs` | Audit log |

Cross-cutting configuration (security, JWT, OpenAPI, gov.br) lives in `src/main/java/com/aie/backend/config/`.

## License

[GNU GPL v3.0](LICENSE) — Copyright © 2026 Ministério da Gestão e da Inovação em Serviços Públicos (MGI).
