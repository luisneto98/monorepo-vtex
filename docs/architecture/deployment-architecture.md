# Deployment Architecture

## Deployment Strategy

**Frontend Deployment:**
- **Platform:** CloudFlare Pages or Vercel
- **Build Command:** `npm run build:web`
- **Output Directory:** `apps/web/dist`
- **CDN/Edge:** CloudFlare global network

**Backend Deployment:**
- **Platform:** AWS ECS ou Railway
- **Build Command:** `npm run build:api`
- **Deployment Method:** Docker containers with auto-scaling

## CI/CD Pipeline
```yaml
name: Deploy

on:
  push:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e

  deploy-api:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -f infrastructure/docker/Dockerfile.api -t vtexday26-api .
      - name: Push to Registry
        run: docker push ${{ secrets.REGISTRY }}/vtexday26-api
      - name: Deploy to ECS
        run: aws ecs update-service --cluster vtexday26 --service api

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build:web
      - name: Deploy to CloudFlare
        run: npx wrangler pages publish apps/web/dist
```

## Environments

| Environment | Frontend URL | Backend URL | Purpose |
|------------|--------------|-------------|---------|
| Development | http://localhost:5173 | http://localhost:3000 | Local development |
| Staging | https://staging.vtexday.com.br | https://api-staging.vtexday.com.br | Pre-production testing |
| Production | https://vtexday.com.br | https://api.vtexday.com.br | Live environment |
