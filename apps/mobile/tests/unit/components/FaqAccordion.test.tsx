import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FaqAccordion from '../../../src/components/faq/FaqAccordion';
import FaqService from '../../../src/services/FaqService';
import type { Faq } from '@vtexday26/shared';

jest.mock('../../../src/services/FaqService');

const mockFaqService = FaqService as jest.Mocked<typeof FaqService>;

describe('FaqAccordion', () => {
  const mockFaq: Faq = {
    _id: 'faq1',
    question: {
      'pt-BR': 'Qual é a pergunta?',
      en: 'What is the question?',
    },
    answer: {
      'pt-BR': '<p>Esta é a <b>resposta</b></p>',
      en: '<p>This is the <b>answer</b></p>',
    },
    category: 'cat1',
    order: 1,
    viewCount: 50,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFaqService.incrementViewCount.mockResolvedValue();
  });

  it('should render FAQ question', () => {
    const { getByText } = render(<FaqAccordion faq={mockFaq} />);

    expect(getByText('Qual é a pergunta?')).toBeTruthy();
  });

  it('should render question in specified language', () => {
    const { getByText } = render(<FaqAccordion faq={mockFaq} language="en" />);

    expect(getByText('What is the question?')).toBeTruthy();
  });

  it('should expand and show answer when pressed', () => {
    const { getByText, queryByText } = render(<FaqAccordion faq={mockFaq} />);

    // Initially collapsed
    expect(queryByText(/resposta/i)).toBeFalsy();

    // Tap to expand
    fireEvent.press(getByText('Qual é a pergunta?'));

    // Should show answer
    expect(queryByText(/resposta/i)).toBeTruthy();
  });

  it('should increment view count when expanded', async () => {
    const { getByText } = render(<FaqAccordion faq={mockFaq} />);

    fireEvent.press(getByText('Qual é a pergunta?'));

    await waitFor(() => {
      expect(mockFaqService.incrementViewCount).toHaveBeenCalledWith('faq1');
    });
  });

  it('should show popular badge when viewCount > 100', () => {
    const popularFaq: Faq = {
      ...mockFaq,
      viewCount: 150,
    };

    const { getByText } = render(<FaqAccordion faq={popularFaq} />);

    expect(getByText('Popular')).toBeTruthy();
  });

  it('should not show popular badge when viewCount <= 100', () => {
    const { queryByText } = render(<FaqAccordion faq={mockFaq} />);

    expect(queryByText('Popular')).toBeFalsy();
  });

  it('should have proper accessibility attributes', () => {
    const { getByLabelText } = render(<FaqAccordion faq={mockFaq} />);

    const button = getByLabelText('Pergunta: Qual é a pergunta?');
    expect(button).toBeTruthy();
  });
});