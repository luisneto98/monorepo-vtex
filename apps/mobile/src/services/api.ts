import { apiBaseUrl, apiTimeout, isDebugMode } from '../config/env';

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  success: false;
  message: string;
  error?: any;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;
  private timeout: number;
  private maxRetries: number = 3;
  private baseRetryDelay: number = 1000; // 1 second

  constructor() {
    this.baseUrl = apiBaseUrl;
    this.timeout = apiTimeout;

    if (isDebugMode()) {
      console.log('🌐 API Service initialized:', {
        baseUrl: this.baseUrl,
        timeout: this.timeout
      });
    }
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error.name === 'AbortError') return true;
    if (error.message?.includes('Network request failed')) return true;
    if (error.message?.includes('timeout')) return true;

    // Check for HTTP status codes
    const status = error.status || error.statusCode;
    if (status >= 500 && status < 600) return true;
    if (status === 429) return true; // Rate limiting

    return false;
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      const isLastAttempt = attempt >= this.maxRetries - 1;
      const shouldRetry = this.isRetryableError(error) && !isLastAttempt;

      if (!shouldRetry) {
        throw error;
      }

      // Calculate exponential backoff delay: 1s, 2s, 4s
      const delay = this.baseRetryDelay * Math.pow(2, attempt);

      if (isDebugMode()) {
        console.log(`🔄 Retry attempt ${attempt + 1}/${this.maxRetries} after ${delay}ms`);
      }

      await this.sleep(delay);
      return this.retryWithBackoff(operation, attempt + 1);
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.retryWithBackoff(async () => {
      try {
        const url = new URL(`${this.baseUrl}${endpoint}`);

        if (params) {
          Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
              url.searchParams.append(key, String(params[key]));
            }
          });
        }

        // Add timeout to fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: this.getHeaders(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text();
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorJson = JSON.parse(errorBody);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            // If not JSON, use the text body if available
            if (errorBody) errorMessage += `: ${errorBody}`;
          }
          const error: any = new Error(errorMessage);
          error.status = response.status;
          throw error;
        }

        return await response.json();
      } catch (error) {
        console.error('API GET Error:', error);
        throw error;
      }
    });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API PUT Error:', error);
      throw error;
    }
  }

  async delete<T>(endpoint: string): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API DELETE Error:', error);
      throw error;
    }
  }

  async getPaginated<T>(
    endpoint: string,
    page: number = 1,
    limit: number = 20,
    additionalParams?: Record<string, any>
  ): Promise<PaginatedResponse<T>> {
    return this.get<PaginatedResponse<T>>(endpoint, {
      page,
      limit,
      ...additionalParams
    });
  }
}

export default new ApiService();