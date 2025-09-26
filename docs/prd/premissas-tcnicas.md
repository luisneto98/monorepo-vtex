# Premissas Técnicas

## Estrutura de Repositório: Monorepo
Utilizaremos **Monorepo** com workspaces para gerenciar frontend web, apps mobile e backend em um único repositório, facilitando compartilhamento de código, tipos TypeScript e deploy coordenado.

## Arquitetura de Serviços
Adotaremos arquitetura **Monolítica Modular** para acelerar desenvolvimento:
- **API Monolítica:** Aplicação NestJS única com módulos bem definidos
- **Estrutura Modular:** Separação por domínios (auth, content, notifications, analytics) usando módulos do NestJS
- **RESTful API:** Endpoints versionados com documentação Swagger automática
- **Background Jobs:** Bull queues integradas com NestJS para processamento assíncrono
- **Database NoSQL:** MongoDB com Mongoose para flexibilidade de schema
Esta abordagem permite rápida iteração e futura migração para microserviços se necessário.

## Requisitos de Testes
Implementaremos **Testes Focados no Crítico**:
- **Testes Unitários:** 60% cobertura focada em services e guards críticos
- **Testes de Integração:** Controllers principais e integração com ticketeira
- **Testes E2E:** Fluxos essenciais usando Jest e Supertest
- **Testes Manuais:** Checklist de QA para funcionalidades secundárias
- **Smoke Tests:** Suite rápida para validar deploys em produção

## Premissas Técnicas Adicionais

**Stack de Desenvolvimento:**
- **Frontend Web:** React 18 com Vite, TypeScript, Tailwind CSS, Axios para APIs
- **Mobile:** React Native com Expo para máximo reuso de lógica e componentes
- **Backend:** NestJS com decorators, pipes de validação, interceptors
- **Database:** MongoDB com Mongoose ODM, schemas tipados com TypeScript
- **Cache:** Redis para cache de queries e sessões via @nestjs/cache-manager
- **File Storage:** AWS S3 com multer-s3 para uploads

**Infraestrutura Pragmática:**
- **Deploy:** Docker containers em AWS ECS ou Railway para simplicidade
- **Database:** MongoDB Atlas (managed) para alta disponibilidade
- **CDN:** CloudFlare para assets estáticos e cache de API
- **CI/CD:** GitHub Actions com stages para dev/staging/prod
- **Monitoramento:** Winston logger integrado, Sentry para error tracking

**Integrações com NestJS:**
- **Push Notifications:** Firebase Admin SDK como NestJS service
- **Analytics:** Custom middleware para Google Analytics
- **Email:** @nestjs-modules/mailer com SendGrid
- **WebSockets:** @nestjs/websockets para atualizações real-time (Fase 2)
- **Swagger:** @nestjs/swagger para documentação automática da API

**Patterns NestJS e MongoDB:**
- **DTOs:** Class-validator para validação de entrada
- **Schemas:** Mongoose schemas com @nestjs/mongoose decorators
- **Guards:** JWT auth guard global com roles
- **Interceptors:** Transform response e logging
- **Exception Filters:** Tratamento padronizado de erros
- **Aggregation Pipeline:** Para queries complexas e analytics

**Segurança com NestJS:**
- **Helmet:** Proteção headers HTTP via @nestjs/helmet
- **Rate Limiting:** @nestjs/throttler para proteção contra abuse
- **CORS:** Configuração restritiva por ambiente
- **Validation Pipe:** Global validation com whitelist
- **Mongoose Plugins:** Para audit trails e soft deletes

**Justificativa das Escolhas:**
- **NestJS:** Framework enterprise-ready com arquitetura clara, dependency injection e suporte TypeScript nativo
- **MongoDB:** Flexibilidade para mudanças de schema durante desenvolvimento rápido, ótimo para dados semi-estruturados do evento
- **Mongoose:** ODM maduro com validações, middleware e virtual properties
- **Monolito Modular:** Complexidade gerenciável com benefícios de modularização do NestJS
- **Docker + MongoDB Atlas:** Deploy simples com database gerenciado, reduz overhead operacional
