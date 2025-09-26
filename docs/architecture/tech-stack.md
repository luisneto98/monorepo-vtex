# Tech Stack

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.0+ | Type-safe development across all frontends | Prevents runtime errors, improves maintainability with shared types |
| Frontend Framework | React | 18.2+ | Web application UI framework | Mature ecosystem, component reusability with React Native |
| UI Component Library | Tailwind CSS + shadcn/ui | 3.3+ / latest | Styling and pre-built components | Rapid development with utility-first CSS, customizable components |
| State Management | Zustand | 4.4+ | Client state management | Simpler than Redux, TypeScript support, works web and mobile |
| Backend Language | TypeScript | 5.0+ | Type-safe backend development | Consistency with frontend, prevents type errors |
| Backend Framework | NestJS | 10.0+ | Enterprise Node.js framework | Modular architecture, built-in DI, decorators, as specified in PRD |
| API Style | REST | - | HTTP-based API architecture | Simple, well-understood, easy to cache and document |
| Database | MongoDB | 6.0+ | NoSQL document database | Flexible schema for rapid iteration as specified in PRD |
| Cache | Redis | 7.0+ | In-memory data store | Session management, query caching for <200ms response times |
| File Storage | AWS S3 | - | Object storage service | Scalable media storage, CDN integration, cost-effective |
| Authentication | JWT + Passport | Latest | Token-based auth | Stateless, scalable, works across web/mobile |
| Frontend Testing | Jest + React Testing Library | 29+ / 14+ | Unit and integration testing | Standard React testing stack, good coverage tools |
| Backend Testing | Jest + Supertest | 29+ / 6+ | API and unit testing | NestJS native support, E2E testing capability |
| E2E Testing | Playwright | 1.40+ | Cross-browser testing | Modern, fast, supports mobile viewports |
| Build Tool | Vite | 5.0+ | Frontend build tool | Fast HMR, optimized builds, better DX than Webpack |
| Bundler | Vite (web) / Metro (mobile) | 5.0+ / 0.76+ | Asset bundling | Vite for web speed, Metro required for React Native |
| IaC Tool | Docker + Docker Compose | 24+ / 2.20+ | Containerization | Local dev parity, easy deployment to ECS/Railway |
| CI/CD | GitHub Actions | - | Automated deployment | Native GitHub integration, free for public repos |
| Monitoring | Winston + Sentry | 3.11+ / 7.0+ | Logging and error tracking | Structured logging, real-time error alerts |
| Logging | Winston | 3.11+ | Application logging | Flexible log levels, multiple transports |
| CSS Framework | Tailwind CSS | 3.3+ | Utility-first CSS | Rapid styling, consistent design system, small bundle |
