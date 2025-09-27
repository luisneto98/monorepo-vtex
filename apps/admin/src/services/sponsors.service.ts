import type { Sponsor } from '@shared/types/sponsor.types';

export interface ISponsorResponse {
  data: Sponsor;
  success: boolean;
  message?: string;
}

export interface ISponsorListResponse {
  data: Sponsor[];
  total: number;
  page: number;
  limit: number;
  success: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class SponsorsService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  static async getSponsors(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    tier?: string;
    category?: string;
  }): Promise<ISponsorListResponse> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_URL}/sponsors?${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sponsors');
    }

    return response.json();
  }

  static async getSponsor(id: string): Promise<ISponsorResponse> {
    const response = await fetch(`${API_URL}/sponsors/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sponsor');
    }

    return response.json();
  }

  static async createSponsor(sponsor: Omit<Sponsor, '_id' | 'createdAt' | 'updatedAt'>): Promise<ISponsorResponse> {
    const response = await fetch(`${API_URL}/sponsors`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(sponsor),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create sponsor');
    }

    return response.json();
  }

  static async updateSponsor(id: string, sponsor: Partial<Sponsor>): Promise<ISponsorResponse> {
    const response = await fetch(`${API_URL}/sponsors/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(sponsor),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update sponsor');
    }

    return response.json();
  }

  static async deleteSponsor(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/sponsors/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete sponsor');
    }

    return response.json();
  }

  static async getSponsorsByTier(tier: string): Promise<ISponsorListResponse> {
    return this.getSponsors({ tier });
  }

  static async getSponsorsByCategory(category: string): Promise<ISponsorListResponse> {
    return this.getSponsors({ category });
  }

  // Bulk actions
  static async bulkUpdateVisibility(ids: string[], visible: boolean): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/sponsors/bulk/visibility`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ ids, visible }),
    });

    if (!response.ok) {
      throw new Error('Failed to update sponsor visibility');
    }

    return response.json();
  }

  static async bulkChangeTier(ids: string[], tier: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/sponsors/bulk/tier`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ ids, tier }),
    });

    if (!response.ok) {
      throw new Error('Failed to change sponsor tiers');
    }

    return response.json();
  }

  static async bulkArchive(ids: string[]): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/sponsors/bulk/archive`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new Error('Failed to archive sponsors');
    }

    return response.json();
  }

  // Export functionality
  static async exportSponsors(ids: string[], format: 'csv' | 'excel'): Promise<string | ArrayBuffer> {
    const response = await fetch(`${API_URL}/sponsors/export`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ ids, format }),
    });

    if (!response.ok) {
      throw new Error('Failed to export sponsors');
    }

    if (format === 'csv') {
      return response.text();
    } else {
      return response.arrayBuffer();
    }
  }

  // Statistics
  static async getStatistics(): Promise<any> {
    const response = await fetch(`${API_URL}/sponsors/statistics`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sponsor statistics');
    }

    return response.json();
  }

  // Soft delete and recovery
  static async softDeleteSponsor(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/sponsors/${id}/soft-delete`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to soft delete sponsor');
    }

    return response.json();
  }

  static async recoverSponsor(id: string): Promise<ISponsorResponse> {
    const response = await fetch(`${API_URL}/sponsors/${id}/recover`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to recover sponsor');
    }

    return response.json();
  }

  static async getArchivedSponsors(): Promise<ISponsorListResponse> {
    const response = await fetch(`${API_URL}/sponsors/archived`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch archived sponsors');
    }

    return response.json();
  }
}