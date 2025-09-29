import axios from 'axios';
import type { Faq } from '@shared/types/faq.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface FaqQuery {
  search?: string;
  category?: string;
  isVisible?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

export const faqService = {
  async getAll(query?: FaqQuery): Promise<Faq[]> {
    const { data } = await axios.get(`${API_URL}/faq`, {
      params: query,
      headers: getAuthHeader(),
    });
    // Handle nested data structure from API response
    if (data.data && data.data.data) {
      return data.data.data || [];
    }
    return data.data || [];
  },

  async getById(id: string): Promise<Faq> {
    const { data } = await axios.get(`${API_URL}/faq/${id}`, {
      headers: getAuthHeader(),
    });
    // Handle nested data structure
    return data.data?.data || data.data;
  },

  async create(faqData: Partial<Faq>): Promise<Faq> {
    const { data } = await axios.post(`${API_URL}/faq`, faqData, {
      headers: getAuthHeader(),
    });
    // Handle nested data structure
    return data.data?.data || data.data;
  },

  async update(id: string, faqData: Partial<Faq>): Promise<Faq> {
    const { data } = await axios.patch(`${API_URL}/faq/${id}`, faqData, {
      headers: getAuthHeader(),
    });
    // Handle nested data structure
    return data.data?.data || data.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_URL}/faq/${id}`, {
      headers: getAuthHeader(),
    });
  },

  // Note: Order updates should be done through the regular update endpoint
  async updateOrder(id: string, order: number): Promise<Faq> {
    const { data } = await axios.patch(
      `${API_URL}/faq/${id}`,
      { order },
      {
        headers: getAuthHeader(),
      },
    );
    // Handle nested data structure
    return data.data?.data || data.data || data;
  },

  // Note: View tracking will be implemented later with proper rate limiting
  async incrementView(id: string): Promise<void> {
    // Temporarily disabled until backend endpoint is implemented with rate limiting
    console.log('View increment temporarily disabled for FAQ:', id);
  },
};
