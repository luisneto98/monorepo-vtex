import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiService } from '@/services/api.service';

describe('apiService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set and get token', () => {
    const token = 'test-token-123';

    apiService.setToken(token);
    expect(apiService.getToken()).toBe(token);
    expect(localStorage.getItem('access_token')).toBe(token);
  });

  it('should clear token on logout', () => {
    apiService.setToken('test-token');
    apiService.setToken(null);

    expect(apiService.getToken()).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('should make GET request with proper headers', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { test: 'data' } }),
    });

    apiService.setToken('auth-token');
    const result = await apiService.get('/test');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer auth-token',
        }),
      }),
    );

    expect(result).toEqual({ success: true, data: { test: 'data' } });
  });

  it('should make POST request with body', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const data = { email: 'test@example.com', password: 'password' };
    await apiService.post('/auth/login', data);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(data),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('should handle network errors', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));

    const result = await apiService.get('/test');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NETWORK_ERROR');
  });
});
