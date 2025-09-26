# Monitoring and Observability

## Monitoring Stack

- **Frontend Monitoring:** Sentry for error tracking, Google Analytics for user behavior
- **Backend Monitoring:** Winston for structured logging, Sentry for exceptions
- **Error Tracking:** Sentry with source maps for both frontend and backend
- **Performance Monitoring:** Custom metrics to CloudWatch, APM with DataDog (optional)

## Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP, FID, CLS)
- JavaScript error rate
- API response times from client perspective
- User interaction events

**Backend Metrics:**
- Request rate per endpoint
- Error rate (4xx, 5xx)
- Response time percentiles (p50, p95, p99)
- Database query performance
- Cache hit ratio
- Queue processing times
