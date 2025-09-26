# Testing Strategy

## Testing Pyramid

```
        E2E Tests (10%)
       /              \
    Integration (30%)
   /                  \
Unit Tests (60%)
```

## Test Organization

### Frontend Tests
```
apps/web/tests/
├── unit/
│   ├── components/
│   ├── hooks/
│   └── utils/
├── integration/
│   └── services/
└── e2e/
    └── user-flows/
```

### Backend Tests
```
apps/api/tests/
├── unit/
│   ├── services/
│   └── guards/
├── integration/
│   └── controllers/
└── e2e/
    └── api-flows/
```

## Test Examples

### Frontend Component Test
```typescript
describe('SessionCard', () => {
  it('should display session information', () => {
    const session = mockSession();
    render(<SessionCard session={session} />);
    expect(screen.getByText(session.title['pt-BR'])).toBeInTheDocument();
  });
});
```

### Backend API Test
```typescript
describe('SessionsController', () => {
  it('should return filtered sessions', async () => {
    const response = await request(app.getHttpServer())
      .get('/sessions?stage=main')
      .expect(200);

    expect(response.body.data).toHaveLength(5);
    expect(response.body.data[0].stage).toBe('main');
  });
});
```
