# NestJS Default Project

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## 📋 Descrição

Projeto base NestJS com TypeScript, estruturado seguindo as melhores práticas do framework. Inclui configuração completa de Docker, PostgreSQL, Firebase, TypeORM, validação, testes e documentação com Swagger.

Este template fornece uma base sólida para desenvolvimento de APIs RESTful escaláveis, com arquitetura modular e configuração para múltiplos ambientes (desenvolvimento, homologação e produção).

## 🏗️ Arquitetura do Projeto

### Estrutura de Diretórios

```
nestjs-default/
├── app/                          # Aplicação NestJS
│   ├── src/
│   │   ├── main.ts              # Ponto de entrada da aplicação
│   │   ├── app.module.ts        # Módulo raiz
│   │   ├── app.controller.ts    # Controller principal
│   │   ├── app.service.ts       # Service principal
│   │   ├── modules/             # Módulos de domínio
│   │   │   └── user/           # Módulo de usuários
│   │   │       ├── user.module.ts
│   │   │       ├── user.controller.ts
│   │   │       ├── user.service.ts
│   │   │       ├── dto/        # Data Transfer Objects
│   │   │       └── entities/   # Entidades do banco
│   │   └── shared/             # Recursos compartilhados
│   │       ├── config/         # Configurações
│   │       │   ├── database/   # Config do banco
│   │       │   ├── firebase/   # Config do Firebase
│   │       │   └── swagger/    # Config do Swagger
│   │       ├── guards/         # Guards de autenticação
│   │       ├── interfaces/     # Interfaces compartilhadas
│   │       ├── migrations/     # Migrações do banco
│   │       ├── repositories/   # Repositórios
│   │       ├── services/       # Serviços compartilhados
│   │       └── utils/          # Utilitários
│   ├── test/                   # Testes E2E
│   ├── Dockerfile              # Container da aplicação
│   └── package.json            # Dependências
├── infra/                      # Infraestrutura
│   ├── docker-compose.yml      # Compose base
│   ├── docker-compose.dev.yml  # Override para desenvolvimento
│   ├── docker-compose.hml.yml  # Override para homologação
│   ├── docker-compose.prod.yml # Override para produção
│   ├── .env.development        # Variáveis de desenvolvimento
│   ├── .env.test              # Variáveis de teste
│   └── .env.production        # Variáveis de produção
└── scripts.sh                 # Script de gerenciamento
```

### Principais Tecnologias

- **NestJS**: Framework Node.js progressivo
- **TypeORM**: ORM para TypeScript
- **PostgreSQL**: Banco de dados relacional
- **Firebase Admin**: Autenticação e serviços
- **Swagger**: Documentação da API
- **Docker**: Containerização
- **Jest**: Framework de testes

## 🚀 Início Rápido

### Pré-requisitos

- Docker e Docker Compose
- Node.js 18+ (apenas para desenvolvimento local)

### Iniciando o Projeto

O projeto utiliza um script de gerenciamento que facilita o trabalho com diferentes ambientes:

```bash
# Iniciar ambiente de desenvolvimento
./scripts.sh dev up

# Iniciar apenas a API
./scripts.sh dev up api

# Iniciar apenas o banco de dados
./scripts.sh dev up postgres
```

### Comandos Principais

```bash
# 🔧 DESENVOLVIMENTO
./scripts.sh dev up              # Subir todos os serviços
./scripts.sh dev up api          # Subir apenas a API
./scripts.sh dev logs            # Ver logs de todos os serviços
./scripts.sh dev logs api        # Ver logs apenas da API
./scripts.sh dev down            # Parar todos os serviços
./scripts.sh dev restart         # Reiniciar todos os serviços
./scripts.sh dev exec api bash   # Executar bash dentro do container da API

# 🧪 HOMOLOGAÇÃO
./scripts.sh staging up          # Subir ambiente de homologação
./scripts.sh staging logs        # Ver logs do ambiente de homologação
./scripts.sh staging down        # Parar ambiente de homologação

# 🏭 PRODUÇÃO
./scripts.sh prod up             # Subir ambiente de produção
./scripts.sh prod logs           # Ver logs do ambiente de produção
./scripts.sh prod down           # Parar ambiente de produção

# 📋 UTILITÁRIOS
./scripts.sh dev services        # Listar serviços disponíveis
./scripts.sh dev ps             # Status dos containers
./scripts.sh dev migrate        # Executar migrações
```

### URLs de Acesso

Após iniciar o projeto:

- **API**: http://localhost:8080
- **Swagger**: http://localhost:8080/api
- **Frontend** (se configurado): http://localhost:3000

## 🛠️ Desenvolvimento Local

Para desenvolvimento local sem Docker:

```bash
# Instalar dependências
cd app
npm install

# Configurar banco local (PostgreSQL deve estar rodando)
npm run migration:run

# Iniciar em modo desenvolvimento
npm run start:dev

# Iniciar em modo debug
npm run start:debug
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes em modo watch
npm run test:watch

# Testes E2E
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

## 🏛️ Arquitetura NestJS

### Padrões Implementados

#### Modular Architecture
- **Modules**: Cada funcionalidade é organizada em módulos independentes
- **Controllers**: Responsáveis pelas rotas e validação de entrada
- **Services**: Contêm a lógica de negócio
- **DTOs**: Validação e transformação de dados
- **Entities**: Representação das tabelas do banco

#### Dependency Injection
O NestJS utiliza um sistema robusto de injeção de dependências que:
- Facilita testes unitários
- Promove baixo acoplamento
- Permite configuração flexível de provedores

#### Guards e Middleware
- **AuthGuard**: Proteção de rotas autenticadas
- **Validation Pipes**: Validação automática de DTOs
- **Exception Filters**: Tratamento centralizado de erros

### Configurações por Ambiente

O projeto suporta três ambientes distintos:

- **Development** (`.env.development`): Configurações para desenvolvimento local
- **Testing** (`.env.test`): Configurações para homologação
- **Production** (`.env.production`): Configurações para produção

## 🔧 Configuração

### Banco de Dados

O projeto utiliza TypeORM com PostgreSQL:

- **Entities**: Definidas em `src/modules/*/entities/`
- **Migrations**: Localizadas em `src/shared/migrations/`
- **Repositories**: Implementações em `src/shared/repositories/`

### Autenticação

Configurado para usar Firebase Admin SDK:
- JWT tokens
- Guards personalizados
- Integração com Firebase Auth

## 📊 Monitoramento e Logs

### Logs da Aplicação

```bash
# Ver logs em tempo real
./scripts.sh dev logs

# Ver logs de um serviço específico
./scripts.sh dev logs api

# Ver logs do banco
./scripts.sh dev logs postgres
```

### Health Checks

O projeto inclui health checks para:
- PostgreSQL (ping de conexão)
- Redis (se habilitado)
- API (endpoint de status)

## 🚢 Deploy

### Docker Compose

O projeto está configurado para deploy usando Docker Compose com diferentes overrides:

```bash
# Deploy em produção
./scripts.sh prod up

# Verificar status
./scripts.sh prod ps

# Ver logs de produção
./scripts.sh prod logs
```

### Migrations

```bash
# Executar migrations
./scripts.sh dev migrate

# Ou diretamente no container
./scripts.sh dev exec api npm run migration:run
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📚 Recursos Úteis

- [Documentação NestJS](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Docker Compose](https://docs.docker.com/compose/)

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com ❤️ usando NestJS**
