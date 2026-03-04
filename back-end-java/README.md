# AIE Java Backend

Reimplementação do backend NestJS utilizando Spring Boot, Hibernate e PostgreSQL. Nesta etapa foram migrados os módulos de **admin** e **auth**, mantendo comportamento equivalente ao serviço original.

## Pré-requisitos

- JDK 17+
- Maven 3.9+ (ou compatível)
- Banco PostgreSQL com as mesmas tabelas utilizadas pelo NestJS (`administradores`, `logs`, etc.)
- Variáveis de ambiente iguais às usadas no projeto NestJS (`back-end-nestjs/.env`).

## Variáveis de ambiente

O `application.yml` lê as mesmas chaves já usadas pelo NestJS:

```
PORT=8080
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=root
POSTGRES_PASSWORD=root
POSTGRES_DB=aie
JWT_SECRET=7f909d34f2628f6a4704f30504de326c6aaae756
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
```

Você pode simplesmente exportar o mesmo arquivo `.env` antes de subir o backend em Java:

```bash
cd back-end-nestjs
export $(grep -v '^#' .env | xargs)
```

ou duplicar o arquivo `.env` dentro de `back-end-java`.

## Executando o projeto

```bash
cd back-end-java
mvn spring-boot:run
```

O serviço sobe em `http://localhost:8080` (ou na porta definida por `PORT`). Os endpoints disponíveis nesta fase:

- `POST /auth/login` – autentica o administrador e retorna `{ user, token, menu }`.
- `GET /auth/login` – retorna o usuário autenticado (requer JWT).
- `GET /admin` – lista administradores ativos.
- `GET /admin/{id}` – retorna um administrador específico.
- `POST /admin` – cria novo administrador.
- `PUT /admin/{id}` – atualiza administrador.
- `DELETE /admin/{id}` – realiza soft delete (inativa).

## Notas adicionais

- O JWT carrega o mesmo payload do NestJS (dados do admin e menu). O filtro `JwtAuthenticationFilter` protege todas as rotas exceto `POST /auth/login`.
- O módulo de logs persiste entradas na tabela `logs`, replicando o comportamento de auditoria do NestJS.
- A configuração do Hibernate usa `ddl-auto=update` por padrão; ajuste via `HIBERNATE_DDL_AUTO` caso queira desabilitar alterações automáticas de esquema.
