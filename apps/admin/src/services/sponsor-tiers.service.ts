import type { SponsorTier } from '@shared/types/sponsor.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ISponsorTierResponse {
  data: SponsorTier;
  success: boolean;
  message?: string;
}

export interface ISponsorTierListResponse {
  success: boolean;
  data: SponsorTier[] | { data: SponsorTier[] };
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
}

export class SponsorTiersService {
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  static async getSponsorTiers(params?: {
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<ISponsorTierListResponse> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_URL}/sponsors/tiers?${queryParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sponsor tiers');
    }

    return response.json();
  }

  static async getSponsorTier(id: string): Promise<ISponsorTierResponse> {
    const response = await fetch(`${API_URL}/sponsors/tiers/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sponsor tier');
    }

    return response.json();
  }

  static async createSponsorTier(
    tier: Omit<SponsorTier, '_id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ISponsorTierResponse> {
    const response = await fetch(`${API_URL}/sponsors/tiers`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(tier),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create sponsor tier');
    }

    return response.json();
  }

  static async updateSponsorTier(
    id: string,
    tier: Partial<SponsorTier>,
  ): Promise<ISponsorTierResponse> {
    const response = await fetch(`${API_URL}/sponsors/tiers/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(tier),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update sponsor tier');
    }

    return response.json();
  }

  static async deleteSponsorTier(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/sponsors/tiers/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete sponsor tier');
    }

    // DELETE returns 204 No Content, so we need to handle the empty response
    if (response.status === 204) {
      return { success: true };
    }

    return response.json();
  }

  static async updateTierOrder(id: string, order: number): Promise<ISponsorTierResponse> {
    const response = await fetch(`${API_URL}/sponsors/tiers/${id}/order`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ order }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update tier order');
    }

    return response.json();
  }

  static async reorderTiers(tierIds: string[]): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/sponsors/tiers/reorder`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ tierIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reorder tiers');
    }

    return response.json();
  }
}
