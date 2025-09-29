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

    return response.json();
  }

  static async getSession(id: string): Promise<ISessionResponse> {
    const response = await fetch(`${API_URL}/sessions/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch session');
    }

    return response.json();
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
      throw new Error(error.message || 'Failed to create session');
    }

    return response.json();
  }

  static async updateSession(id: string, session: Partial<ISession>): Promise<ISessionResponse> {
    const response = await fetch(`${API_URL}/sessions/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(session),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update session');
    }

    return response.json();
  }

  static async deleteSession(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/sessions/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete session');
    }

    return response.json();
  }

  static async checkConflicts(sessionData: {
    startTime: Date;
    endTime: Date;
    stage: string;
    speakerIds?: string[];
    excludeId?: string;
  }): Promise<{ hasConflicts: boolean; conflicts: ISession[] }> {
    const response = await fetch(`${API_URL}/sessions/check-conflicts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      throw new Error('Failed to check conflicts');
    }

    return response.json();
  }

  static async getAvailableFilters(): Promise<{
    stages: string[];
    tags: string[];
    technicalLevels: string[];
    languages: string[];
  }> {
    const response = await fetch(`${API_URL}/sessions/filters`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch filters');
    }

    return response.json();
  }

  static async bulkDelete(ids: string[]): Promise<{ success: boolean; deleted: number }> {
    const response = await fetch(`${API_URL}/sessions/bulk-delete`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete sessions');
    }

    return response.json();
  }

  static async bulkUpdateVisibility(
    ids: string[],
    isVisible: boolean,
  ): Promise<{ success: boolean; updated: number }> {
    const response = await fetch(`${API_URL}/sessions/bulk-visibility`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ ids, isVisible }),
    });

    if (!response.ok) {
      throw new Error('Failed to update visibility');
    }

    return response.json();
  }
}
