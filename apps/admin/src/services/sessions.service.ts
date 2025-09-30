import type { ISession, ISessionResponse, ISessionListResponse } from '@shared/types/session.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class SessionsService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  static async getSessions(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    search?: string;
    stage?: string;
    date?: string;
    tags?: string;
    speakerId?: string;
  }): Promise<ISessionListResponse> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_URL}/sessions?${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }

    const json = await response.json();
    // Backend returns { data: { success, data, metadata } }, unwrap it
    return json.data || json;
  }

  static async getSession(id: string): Promise<ISessionResponse> {
    const response = await fetch(`${API_URL}/sessions/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch session');
    }

    const json = await response.json();
    return json.data || json;
  }

  static async createSession(
    session: Omit<ISession, '_id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ISessionResponse> {
    const response = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(session),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || error.message || 'Failed to create session');
    }

    const json = await response.json();
    return json.data || json;
  }

  static async updateSession(id: string, session: Partial<ISession>): Promise<ISessionResponse> {
    const response = await fetch(`${API_URL}/sessions/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(session),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || error.message || 'Failed to update session');
    }

    const json = await response.json();
    return json.data || json;
  }

  static async deleteSession(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/sessions/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete session');
    }

    // DELETE returns 204 No Content
    return { success: true };
  }
}
