import axios from 'axios';
import type { Speaker, CreateSpeakerDto, UpdateSpeakerDto } from '@shared/types/speaker.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

export interface SpeakersFilters {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  company?: string;
  isHighlight?: boolean;
}

class SpeakersService {
  private getAuthHeader() {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getSpeakers(filters: SpeakersFilters = {}): Promise<PaginatedResponse<Speaker>> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.search) params.append('search', filters.search);
    if (filters.company) params.append('company', filters.company);
    if (filters.isHighlight !== undefined)
      params.append('isHighlight', filters.isHighlight.toString());

    const response = await axios.get(`${API_URL}/speakers?${params}`, {
      headers: this.getAuthHeader(),
    });

    // Handle API response format: { data: { success: true, data: [...], metadata: {...} } }
    return response.data.data || response.data;
  }

  async getSpeaker(id: string): Promise<Speaker> {
    const response = await axios.get(`${API_URL}/speakers/${id}`, {
      headers: this.getAuthHeader(),
    });
    // Handle nested response structure
    return response.data.data?.data || response.data.data || response.data;
  }

  async createSpeaker(data: CreateSpeakerDto): Promise<Speaker> {
    const response = await axios.post(`${API_URL}/speakers`, data, {
      headers: this.getAuthHeader(),
    });
    // Handle nested response structure
    return response.data.data?.data || response.data.data || response.data;
  }

  async updateSpeaker(id: string, data: UpdateSpeakerDto): Promise<Speaker> {
    const response = await axios.patch(`${API_URL}/speakers/${id}`, data, {
      headers: this.getAuthHeader(),
    });
    // Handle nested response structure
    return response.data.data?.data || response.data.data || response.data;
  }

  async deleteSpeaker(id: string): Promise<void> {
    await axios.delete(`${API_URL}/speakers/${id}`, {
      headers: this.getAuthHeader(),
    });
  }

  async uploadPhoto(speakerId: string, file: File): Promise<{ photoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('access_token');

    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    console.log('🔑 Token presente:', !!token);
    console.log('📤 Uploading para:', `${API_URL}/speakers/${speakerId}/upload-photo`);
    console.log('🎫 Token (primeiros 20 chars):', token.substring(0, 20) + '...');

    try {
      const response = await axios.post(`${API_URL}/speakers/${speakerId}/upload-photo`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // NÃO defina Content-Type manualmente - deixe o axios fazer isso
        },
      });
      console.log('✅ Upload successful:', response.data);
      // Handle nested response structure
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('❌ Upload failed:', error.response?.data || error.message);
      console.error('Status:', error.response?.status);
      console.error('Headers enviados:', error.config?.headers);
      throw error;
    }
  }
}

export const speakersService = new SpeakersService();
