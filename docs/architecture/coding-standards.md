# Coding Standards

## Critical Fullstack Rules

- **Type Sharing:** Always define types in packages/shared and import from there
- **API Calls:** Never make direct HTTP calls - use the service layer
- **Environment Variables:** Access only through config objects, never process.env directly
- **Error Handling:** All API routes must use the standard error handler
- **State Updates:** Never mutate state directly - use proper state management patterns
- **MongoDB Queries:** Always use indexes for queries, avoid full collection scans
- **Async Operations:** Use async/await consistently, handle all promise rejections
- **Security:** Never log sensitive data, sanitize all user inputs

## Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `UserProfile.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts` |
| API Routes | - | kebab-case | `/api/user-profile` |
| Database Collections | - | PascalCase singular | `Session` |
| Database Fields | - | camelCase | `startTime` |
| Environment Variables | - | SCREAMING_SNAKE_CASE | `MONGODB_URI` |
