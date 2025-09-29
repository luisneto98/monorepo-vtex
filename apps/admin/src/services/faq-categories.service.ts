import axios from 'axios';
import type { FaqCategory } from '@shared/types/faq.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const faqCategoriesService = {
  async getAll(): Promise<FaqCategory[]> {
    const { data } = await axios.get(`${API_URL}/faq/categories`, {
      headers: getAuthHeader(),
    });
    // Handle nested data structure from API response
    if (data.data && data.data.data) {
      return data.data.data || [];
    }
    return data.data || [];
  },

  async getById(id: string): Promise<FaqCategory> {
    const { data } = await axios.get(`${API_URL}/faq/categories/${id}`, {
      headers: getAuthHeader(),
    });
    // Handle nested data structure
    return data.data?.data || data.data;
  },

  async create(categoryData: Partial<FaqCategory>): Promise<FaqCategory> {
    const { data } = await axios.post(`${API_URL}/faq/categories`, categoryData, {
      headers: getAuthHeader(),
    });
    // Handle nested data structure
    return data.data?.data || data.data;
  },

  async update(id: string, categoryData: Partial<FaqCategory>): Promise<FaqCategory> {
    const { data } = await axios.patch(`${API_URL}/faq/categories/${id}`, categoryData, {
      headers: getAuthHeader(),
    });
    // Handle nested data structure
    return data.data?.data || data.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_URL}/faq/categories/${id}`, {
      headers: getAuthHeader(),
    });
  },

  // Note: Order updates should be done through the regular update endpoint
  async updateOrder(id: string, order: number): Promise<FaqCategory> {
    const { data } = await axios.patch(
      `${API_URL}/faq/categories/${id}`,
      { order },
      {
        headers: getAuthHeader(),
      },
    );
    // Handle nested data structure
    return data.data?.data || data.data;
  },
};
