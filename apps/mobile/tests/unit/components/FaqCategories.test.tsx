import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FaqCategories from '../../../src/components/faq/FaqCategories';
import FaqService from '../../../src/services/FaqService';

jest.mock('../../../src/services/FaqService');

const mockFaqService = FaqService as jest.Mocked<typeof FaqService>;

describe('FaqCategories', () => {
  const mockCategories = [
    {
      _id: 'cat1',
      name: { 'pt-BR': 'Categoria 1', en: 'Category 1' },
      order: 1,
      faqCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: 'cat2',
      name: { 'pt-BR': 'Categoria 2', en: 'Category 2' },
      order: 2,
      faqCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockFaqService.getFAQCategories.mockImplementation(() => new Promise(() => {}));

    const { UNSAFE_getByType } = render(
      <FaqCategories selectedCategory={null} onCategorySelect={jest.fn()} />
    );

    // Loading indicator should be present
    const ActivityIndicator = require('react-native').ActivityIndicator;
    expect(() => UNSAFE_getByType(ActivityIndicator)).not.toThrow();
  });

  it('should render categories after loading', async () => {
    mockFaqService.getFAQCategories.mockResolvedValue({
      success: true,
      data: mockCategories,
      metadata: {
        total: 2,
        page: 1,
        limit: 100,
        hasNext: false,
        hasPrev: false,
      },
    });

    const { getByText } = render(
      <FaqCategories selectedCategory={null} onCategorySelect={jest.fn()} />
    );

    await waitFor(() => {
      expect(getByText('Categoria 1')).toBeTruthy();
      expect(getByText('Categoria 2')).toBeTruthy();
    });
  });

  it('should handle empty array response gracefully', async () => {
    mockFaqService.getFAQCategories.mockResolvedValue({
      success: true,
      data: [],
      metadata: {
        total: 0,
        page: 1,
        limit: 100,
        hasNext: false,
        hasPrev: false,
      },
    });

    const { getByText } = render(
      <FaqCategories selectedCategory={null} onCategorySelect={jest.fn()} />
    );

    await waitFor(() => {
      // Should still show "Todas" button
      expect(getByText('Todas')).toBeTruthy();
    });
  });

  it('should handle error gracefully without crashing', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockFaqService.getFAQCategories.mockRejectedValue(new Error('Network error'));

    const { getByText } = render(
      <FaqCategories selectedCategory={null} onCategorySelect={jest.fn()} />
    );

    await waitFor(() => {
      // Should still render "Todas" without crashing
      expect(getByText('Todas')).toBeTruthy();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle non-array response gracefully', async () => {
    mockFaqService.getFAQCategories.mockResolvedValue({
      success: true,
      data: null as any, // Invalid response
      metadata: {
        total: 0,
        page: 1,
        limit: 100,
        hasNext: false,
        hasPrev: false,
      },
    });

    const { getByText } = render(
      <FaqCategories selectedCategory={null} onCategorySelect={jest.fn()} />
    );

    await waitFor(() => {
      // Should not crash, should show "Todas"
      expect(getByText('Todas')).toBeTruthy();
    });
  });

  it('should call onCategorySelect when category is tapped', async () => {
    mockFaqService.getFAQCategories.mockResolvedValue({
      success: true,
      data: mockCategories,
      metadata: {
        total: 2,
        page: 1,
        limit: 100,
        hasNext: false,
        hasPrev: false,
      },
    });

    const onCategorySelect = jest.fn();
    const { getByText } = render(
      <FaqCategories selectedCategory={null} onCategorySelect={onCategorySelect} />
    );

    await waitFor(() => {
      expect(getByText('Categoria 1')).toBeTruthy();
    });

    fireEvent.press(getByText('Categoria 1'));

    expect(onCategorySelect).toHaveBeenCalledWith('cat1');
  });

  it('should show category count badge', async () => {
    mockFaqService.getFAQCategories.mockResolvedValue({
      success: true,
      data: mockCategories,
      metadata: {
        total: 2,
        page: 1,
        limit: 100,
        hasNext: false,
        hasPrev: false,
      },
    });

    const { getByText } = render(
      <FaqCategories selectedCategory={null} onCategorySelect={jest.fn()} />
    );

    await waitFor(() => {
      expect(getByText('5')).toBeTruthy(); // faqCount for cat1
      expect(getByText('3')).toBeTruthy(); // faqCount for cat2
    });
  });
});
