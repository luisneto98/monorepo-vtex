# Security and Performance

## Security Requirements

**Frontend Security:**
- CSP Headers: Default-src 'self'; script-src 'self' 'unsafe-inline'
- XSS Prevention: React automatic escaping, sanitize user inputs
- Secure Storage: Sensitive data in memory only, tokens in httpOnly cookies

**Backend Security:**
- Input Validation: class-validator on all DTOs
- Rate Limiting: 100 requests per minute per IP
- CORS Policy: Whitelist specific origins only

**Authentication Security:**
- Token Storage: HttpOnly cookies with Secure and SameSite flags
- Session Management: Redis with TTL, refresh token rotation
- Password Policy: Minimum 12 characters, complexity requirements

## Performance Optimization

**Frontend Performance:**
- Bundle Size Target: < 200KB initial JS
- Loading Strategy: Lazy loading for routes, code splitting
- Caching Strategy: Service worker for offline, browser cache for assets

**Backend Performance:**
- Response Time Target: p95 < 200ms
- Database Optimization: Indexes on all query fields, aggregation pipelines
- Caching Strategy: Redis for hot paths, 5-minute TTL for listings
