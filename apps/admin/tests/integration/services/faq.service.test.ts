import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { faqService } from '@/services/faq.service';
import type { Faq } from '@shared/types/faq.types';

vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FaqService', () => {
  const mockToken = 'test-token';
  const mockFaq: Faq = {
    _id: '1',
    question: {
      'pt-BR': 'Pergunta teste?',
      en: 'Test question?',
    },
    answer: {
      'pt-BR': '<p>Resposta teste</p>',
      en: '<p>Test answer</p>',
    },
    category: 'cat1',
    order: 0,
    viewCount: 0,
    isVisible: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    localStorage.setItem('access_token', mockToken);
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getAll', () => {
    it('fetches all FAQs successfully', async () => {
      const mockFaqs = [mockFaq];
      mockedAxios.get.mockResolvedValue({ data: mockFaqs });

      const result = await faqService.getAll();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/faq'),
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(mockFaqs);
    });

    it('fetches FAQs with query parameters', async () => {
      const mockFaqs = [mockFaq];
      mockedAxios.get.mockResolvedValue({ data: mockFaqs });

      const query = {
        search: 'test',
        category: 'cat1',
        isVisible: true,
      };

      const result = await faqService.getAll(query);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/faq'),
        expect.objectContaining({
          params: query,
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(mockFaqs);
    });
  });

  describe('getById', () => {
    it('fetches a single FAQ successfully', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockFaq });

      const result = await faqService.getById('1');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/faq/1'),
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(mockFaq);
    });
  });

  describe('create', () => {
    it('creates a new FAQ successfully', async () => {
      const newFaqData = {
        question: mockFaq.question,
        answer: mockFaq.answer,
        category: mockFaq.category,
        isVisible: mockFaq.isVisible,
      };

      mockedAxios.post.mockResolvedValue({ data: mockFaq });

      const result = await faqService.create(newFaqData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/faq'),
        newFaqData,
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(mockFaq);
    });
  });

  describe('update', () => {
    it('updates an FAQ successfully', async () => {
      const updateData = {
        question: { ...mockFaq.question, 'pt-BR': 'Pergunta atualizada?' },
      };

      const updatedFaq = { ...mockFaq, ...updateData };
      mockedAxios.put.mockResolvedValue({ data: updatedFaq });

      const result = await faqService.update('1', updateData);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/faq/1'),
        updateData,
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(updatedFaq);
    });
  });

  describe('delete', () => {
    it('deletes an FAQ successfully', async () => {
      mockedAxios.delete.mockResolvedValue({});

      await faqService.delete('1');

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/faq/1'),
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
    });
  });

  describe('updateOrder', () => {
    it('updates FAQ order successfully', async () => {
      const updatedFaq = { ...mockFaq, order: 2 };
      mockedAxios.put.mockResolvedValue({ data: updatedFaq });

      const result = await faqService.updateOrder('1', 2);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/faq/1/order'),
        { order: 2 },
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
      expect(result).toEqual(updatedFaq);
    });
  });

  describe('incrementView', () => {
    it('increments FAQ view count successfully', async () => {
      mockedAxios.put.mockResolvedValue({});

      await faqService.incrementView('1');

      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/faq/1/view'),
        {},
        expect.objectContaining({
          headers: { Authorization: `Bearer ${mockToken}` },
        }),
      );
    });
  });

  describe('error handling', () => {
    it('handles API errors correctly', async () => {
      const errorMessage = 'API Error';
      mockedAxios.get.mockRejectedValue(new Error(errorMessage));

      await expect(faqService.getAll()).rejects.toThrow(errorMessage);
    });

    it('works without authentication token', async () => {
      localStorage.removeItem('access_token');
      mockedAxios.get.mockResolvedValue({ data: [] });

      await faqService.getAll();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/faq'),
        expect.objectContaining({
          headers: {},
        }),
      );
    });
  });
});
