# AIE – Avaliação de Impacto Ético

Este repositório hospeda o ecossistema da plataforma **AIE** (Avaliação de Impacto Ético em IA). O projeto é composto por:

- **front-end/**: aplicação Next.js/Tailwind para a interface administrativa (cadastro de projetos, sessões, atores, respostas etc.).
- **back-end-nestjs/**: API NestJS responsável pelas regras de negócio, autenticação (inclusive GovBR), persistência em PostgreSQL e geração de relatórios.
- *(opcional)* **back-end-java/**: API em linguagem padrão usada pelo Governo,`` responsável pelas regras de negócio, autenticação (inclusive GovBR), persistência em PostgreSQL e geração de relatórios.

A seguir você encontrará um guia completo sobre estrutura de pastas, execução e modelagem do banco.

---

## 📂 Estrutura do Repositório

```
aie/
├── back-end-java/                # API padrão Governo
├── back-end-nestjs/              # API oficial
└── front-end/                    # Interface Next.js
```

### Principais pastas do **front-end**
```
front-end/
├── public/                       # Assets estáticos (images/logo, covers, downloads, flags etc.)
├── src/
│   ├── app/                      # Rotas do Next 13 + layouts
│   │   ├── auth/                 # Tela de login (GovBR/admin)
│   │   ├── projects/             # CRUD de projetos
│   │   ├── projects-received/    # Painel de envios finalizados
│   │   ├── responses/            # Fluxo dinâmico de avaliação
│   │   ├── sessions/             # Cadastro de sessões
│   │   ├── questions/            # CRUD de questões
│   │   ├── config-classifications/# Configuração de níveis/thresholds
│   │   ├── actors/               # Cadastro de atores
│   │   ├── admins/               # Administração de usuários
│   │   ├── logs/                 # Auditoria
│   │   ├── page.tsx / layout.tsx / not-found.tsx
│   ├── components/               # Layouts, tabelas, gráficos, formulários, diálogos
│   ├── contexts/                 # DialogAlertContext, LanguageContext etc.
│   ├── hooks/                    # Hooks específicos (ex: useLanguage)
│   ├── service/                  # `api.ts`, `language.tsx`, helpers de datas
│   ├── lib/                      # Utilitários isolados
│   ├── types/                    # Tipagens compartilhadas (questions, menu, user…)
│   ├── fonts/                    # Fontes locais
│   ├── css/ e js/                # Estilos e scripts auxiliares
│   └── …
├── package.json
└── next.config.mjs / tailwind.config.ts
```

### Principais pastas do **back-end-nestjs**
```
back-end-nestjs/
├── src/
│   ├── app.module.ts             # Módulo raiz
│   ├── common/
│   │   └── interceptors/         # Interceptores globais
│   ├── modules/
│   │   ├── actor/                # CRUD de atores
│   │   ├── admin/                # Administradores
│   │   ├── auth/                 # Login por email/senha
│   │   ├── classification-level/ # Configuração de níveis de classificação
│   │   ├── dashboard/            # KPIs usados na home
│   │   ├── govbr/                # Login GovBR
│   │   ├── govbr_tst/            # Mock legado para testes
│   │   ├── logs/                 # Registro de auditoria
│   │   ├── project/              # Projetos e compartilhamentos
│   │   ├── question/             # Questões
│   │   ├── response/             # Envio de respostas/sessão
│   │   ├── result/               # Resumo final das classificações
│   │   └── session/              # Sessões (triagem, RESULT etc.)
│   ├── shared/
│   │   ├── config/               # Configurações globais
│   │   │   ├── database/         # Configuração TypeORM (autoload entities)
│   │   │   ├── firebase/         # Integração de notificações (quando usada)
│   │   │   └── swagger/          # Documentação da API
│   │   ├── guards/               # Autorização/autenticação
│   │   ├── interfaces/           # Tipos compartilhados
│   │   ├── repositories/         # Repositórios auxiliares
│   │   ├── utils/                # Helpers genéricos
│   │   └── migrations/           # Histórico de migrações
│   └── main.ts                   # bootstrap Nest
├── package.json
└── nest-cli.json / tsconfig*.json
```

### Principais pastas do **back-end-java**
```
back-end-java/
├── Dockerfile / docker-compose.yml # Build e orquestração (usa LOCAL_ENV_FILE)
├── pom.xml                         # Dependências e plugins Maven
├── src/
│   ├── main/java/com/aie/backend/  # Código fonte
│   │   ├── AieApplication.java     # Bootstrap Spring Boot
│   │   ├── config/                 # Segurança, JWT, OpenAPI, GovBR
│   │   └── modules/                # Auth, admin, actor, classificationlevel, dashboard,
│   │                               # govbr, govbr_tst, logs, project, question, response,
│   │                               # result, session
│   └── main/resources/application.yml # Configuração (lê variáveis de ambiente)
└── src/test/java/com/aie/backend/  # Testes
```

---

## ⚙️ Configuração e Execução

### 1. Pré-requisitos
- Node.js 18+
- npm (ou pnpm/yarn)
- PostgreSQL 13+
- Variável `JWT_SECRET` definida (usada no auth e govbr) no arquivo `.env.<local|stage|production>`
- Docker
- Java 17
- Maven

### 2. Banco de Dados
Crie um banco novo e configure as variáveis de ambiente (`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) no arquivo `.env.<local|stage|production>`. As migrations são executadas automaticamente ( `migrationsRun: true` no DatabaseModule ).

### 3. Back-end NestJS
```bash
cd back-end-nestjs
npm install
npm run docker:<modo>:<ambiente>

# modo => run para produção, dev para desenvolvimento (auto reload)
# ambiente => local, stage ou production
```
- **API**: http://localhost:8080 (ajuste `main.ts`/variáveis se necessário)
- Rotas relevantes:
  - `POST /auth/login` (email/senha admin)
  - `GET /govbr/authorize` → inicia OAuth do gov.br (usa `GOVBR_*`; callback em `/govbr/callback`)
  - `POST /govbr-tst/login` (mock antigo para testar sem gov.br)
  - `GET /responses?status=FINISHED` (usado pela tela *projects_received*)
  - `GET /dashboard` (dados da home)

### 4. Front-end Next.js
```bash
cd front-end
npm install
npm run dev
```
- **App**: http://localhost:3000
- Tokens são salvos em `localStorage`. O `fetchApi` injeta o header `Authorization` automaticamente.

> **Dica:** o botão “Entrar com GovBR” em `/auth/signin` abre uma popup chamando `/govbr/authorize`. O retorno `/govbr/callback` fecha a popup e entrega o token ao front. Para testar sem credenciais do gov.br, use o mock em `/govbr-tst/login`.

---

### 5. Back-end Spring-Boot

Arquivos relevantes em `back-end-java/`:
- `application.yml`: mapeia variáveis de ambiente (`PORT`, `POSTGRES_*`, `JWT_*`, `NODE_ENV`).
- `docker-compose.yml`: sobe o serviço lendo `LOCAL_ENV_FILE` (mesmo `.env` do NestJS).
- `Dockerfile`: build da imagem Spring Boot.
- `pom.xml`: dependências/plugins Maven.
- `src/main/java/com/aie/backend/{config|modules}/`: código (mesmos domínios do NestJS: auth, admin, actor, classificationlevel, dashboard, govbr/govbr_tst, logs, project, question, response, result, session).

Passo a passo:
1) Copie o `.env.<ambiente>` já usado no NestJS para `back-end-java/.env.<ambiente>` ou exporte as variáveis no shell (`export $(grep -v '^#' .env.local | xargs)`).
2) Opcional: gere o JAR localmente para validar dependências.
```bash
cd back-end-java
mvn clean package -DskipTests
```
3) Execute em desenvolvimento:
```bash
mvn spring-boot:run
```
ou
```bash
java -jar target/*.jar
```
4) Execute via Docker Compose (lendo o `.env` que estiver em `LOCAL_ENV_FILE`):
```bash
cd back-end-java
LOCAL_ENV_FILE=.env.<ambiente> docker compose up

# ambiente => local, stage ou production
```

---

### 6. Setup Completo (Back-End + Front-End)
```bash

LOCAL_ENV_FILE=.env.<ambiente> docker compose -f docker-compose.<back-end>-<modo>.yml up

# ambiente => local, stage ou production
# backend => nest ou java
# modo => prod para produção, dev para desenvolvimento (auto reload)


# exemplo => LOCAL_ENV_FILE=.env.production docker compose -f docker-compose.java-prod.yml up
```


## 🗃️ Modelagem do Banco (PostgreSQL via TypeORM)

### Entidades chave
| Entidade            | Descrição                                                                 | Relacionamentos principais |
|---------------------|----------------------------------------------------------------------------|----------------------------|
| `administradores`   | Usuários admins (login/email).                                            | `responses` (via logs)     |
| `projects`          | Projetos avaliados. Inclui proprietário, descrição e compartilhamentos.   | 1:N `responses`, N:N via tabela `project_shares` |
| `project_shares`    | CPF/Social number com acesso a um projeto.                                | FK `project_id`            |
| `sessions`          | Sessões/questionários (triagem, RESULT etc.).                             | 1:N `questions`            |
| `questions`         | Questões dinâmicas por sessão (tipos, opções, atores).                    | FK `session_id`            |
| `actors`            | Lista de atores (checkbox dinâmico no cadastro de questões).              | N/A                        |
| `responses`         | Envio de respostas por projeto. Armazena status (`SUBMITTED`/`FINISHED`), `session_scores`, `total_score`. | 1:N `response_answers`, 1:1 `results`, N:1 `projects` |
| `response_answers`  | Cada resposta de pergunta (valor serializado e pontos).                   | FK `response_id`, `question_id` |
| `results`           | Resumo final (nível, pontuação, seções). Persistido após RESULT.          | 1:1 `responses`, opcional FK projeto |
| `logs`              | Auditoria de ações (login etc.).                                         | FK opcional admin          |

### Fluxo de dados
1. **Sessões** são cadastradas com `is_triage`, `next_session_code` e (quando triagem) `triage_config` detalhando thresholds e próximo formulário.
2. **Questions** referenciam uma sessão e possuem opções JSON (com `points`, `score` ou `score_positive`).
3. Durante o preenchimento (front-end `responses/page.tsx`), cada sessão é enviada via `POST /responses`. A triagem calcula risco localmente e envia `session_scores` com os metadados.
4. Ao atingir `next_session_code = RESULT`, o serviço salva as respostas, gera `ResultSummary` (client) e persiste via `POST /results`. `responses.status` passa a `FINISHED`.
5. A tela **Projetos** e **Envios Recebidos** listam apenas `FINISHED`, lendo `response.result.summary` para mostrar nível e pontuação.

---

## 🧱 Componentes Front-end Relevantes
- `DefaultLayout`: container padrão com header, menu lateral e `LanguageButton`.
- `DialogAlertContext`: modal de confirmações/erros usada em todas as telas.
- Páginas dinâmicas (`src/app/.../page.tsx`) usam hooks `fetchApi` + `useEffect` para carregar dados do Nest.
- Gráficos na home usam `react-apexcharts` (donut de status e barras horizontais de média por sessão).

---

## ✅ Fluxos Principais
1. **Login**
   - GovBR: `/govbr/authorize` abre popup, redirect do gov.br volta em `/govbr/callback`; mock legado em `/govbr-tst/login`.
   - Admin: `/auth/login` com email/senha -> dashboards e CRUDs.
2. **Cadastro de Sessões/Questões**
   - Sessões definem sequência e triagem. Questões suportam condicional, atores, order etc.
3. **Resposta de projetos**
   - `/projects` -> “Novo Questionário” leva a `/responses?project=<id>`.
   - Cada envio mantém o mesmo `response_id` até finalizar.
4. **Resultados finais**
   - Após RESULT, `/responses?result=true` permite reabrir a tela final sem recálculo.
   - `/projects_received` lista todos os FINISHED com filtros (responsável, período, nível) e botão “Ver resultado”.

---

## 🛠️ Scripts Úteis
### Front-end
```bash
npm run dev      # desenvolvimento
npm run build    # build
npm run start    # modo produção
npm run lint
```

### Back-end
```bash
npm run start:dev      # desenvolvimento
npm run build
npm run start:prod
npm run migration:run  # executar migrations manualmente
```

---

## 📄 Licenças e Créditos
- Front-end: Next.js 13 + TailwindCSS.
- Back-end: NestJS + TypeORM + PostgreSQL.
- Autenticação GovBR: fluxo OAuth2/OpenID pronto para inserir `GOVBR_*`; mock estático permanece no módulo `govbr_tst`.

Para dúvidas e contribuições, ajuda na implantação/deploy entre em contato por email ou telefone

hudson.m.3110@gmail.com
(62) 99451-0167

Boas avaliações éticas! 🚀