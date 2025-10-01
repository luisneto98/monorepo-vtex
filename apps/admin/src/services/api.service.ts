import { config } from '../config/config';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;
  private csrfToken: string | null = null;

  constructor() {
    this.baseUrl = config.apiUrl;
    this.token = localStorage.getItem('access_token');
    this.initializeCsrfToken();
  }

  private async initializeCsrfToken() {
    try {
      const metaTag = document.querySelector('meta[name="csrf-token"]');
      if (metaTag) {
        this.csrfToken = metaTag.getAttribute('content');
      } else {
        await this.fetchCsrfToken();
      }
    } catch (error) {
      console.error('Failed to initialize CSRF token:', error);
    }
  }

  private async fetchCsrfToken() {
    try {
      const response = await fetch(`${this.baseUrl}/csrf-token`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.token;
        this.setCsrfMetaTag(data.token);
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  }

  private setCsrfMetaTag(token: string) {
    let metaTag = document.querySelector('meta[name="csrf-token"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'csrf-token');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', token);
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Don't set Content-Type for FormData - let browser set it with boundary
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Add CSRF token for state-changing requests
    const method = options.method?.toUpperCase();
    if (this.csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method || '')) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // Include cookies for CSRF protection
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          await this.handleUnauthorized();
        } else if (response.status === 403 && data.error?.code === 'CSRF_INVALID') {
          // CSRF token is invalid, fetch a new one and retry
          await this.fetchCsrfToken();
          if (this.csrfToken) {
            // Retry the request once with new CSRF token
            if (options.headers) {
              (options.headers as Record<string, string>)['X-CSRF-Token'] = this.csrfToken;
            }
            return this.request<T>(endpoint, options);
          }
        }
        return {
          success: false,
          error: {
            code: data.error?.code || 'REQUEST_FAILED',
            message: data.error?.message || data.message || 'Request failed',
            details: data,
          },
        };
      }

      // Update CSRF token from response header if provided
      const newCsrfToken = response.headers.get('X-CSRF-Token');
      if (newCsrfToken) {
        this.csrfToken = newCsrfToken;
        this.setCsrfMetaTag(newCsrfToken);
      }

      // Handle different response formats
      // If the response has a statusCode field, it's the direct API response
      if ('statusCode' in data && data.statusCode >= 200 && data.statusCode < 300) {
        return {
          success: true,
          data: data.data as T,
          metadata: data.metadata,
        };
      }

      // If it already has the success field, return as is
      if ('success' in data) {
        return data;
      }

      // Otherwise, wrap it in the expected format
      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred',
          details: error,
        },
      };
    }
  }

  private async handleUnauthorized() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      this.logout();
      return;
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.csrfToken) {
        headers['X-CSRF-Token'] = this.csrfToken;
      }

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both possible field names
        const accessToken = data.data?.accessToken || data.data?.access_token;
        const refreshToken = data.data?.refreshToken || data.data?.refresh_token;

        if (accessToken) {
          this.setToken(accessToken);
        }
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
      } else {
        this.logout();
      }
    } catch {
      this.logout();
    }
  }

  private logout() {
    this.setToken(null);
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<ApiResponse<T>> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(Object.entries(params).reduce((acc, [key, value]) => ({ ...acc, [key]: String(value) }), {})).toString()}`
      : endpoint;
    return this.request<T>(url);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const isFormData = data instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      headers: isFormData ? {} : undefined, // Let browser set Content-Type for FormData
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const isFormData = data instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data),
      headers: isFormData ? {} : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    const isFormData = data instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: isFormData ? data : JSON.stringify(data),
      headers: isFormData ? {} : undefined,
    });
  }

  get apiBaseUrl(): string {
    return this.baseUrl;
  }

  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    return headers;
  }
}

export const apiService = new ApiService();
