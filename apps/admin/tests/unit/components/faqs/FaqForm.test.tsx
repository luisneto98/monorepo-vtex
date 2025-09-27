import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FaqDialog } from '@/components/faqs/FaqDialog';
import type { Faq, FaqCategory } from '@shared/types/faq.types';

// Mock the RichTextEditor component
vi.mock('@/components/faqs/RichTextEditor', () => ({
  RichTextEditor: ({ content, onChange, placeholder }: any) => (
    <textarea
      data-testid="rich-text-editor"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: (html: string) => html,
  },
}));

const mockCategories: FaqCategory[] = [
  {
    _id: 'cat1',
    name: { 'pt-BR': 'Geral', 'en': 'General' },
    order: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    _id: 'cat2',
    name: { 'pt-BR': 'Técnico', 'en': 'Technical' },
    order: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

const mockFaq: Faq = {
  _id: 'faq1',
  question: {
    'pt-BR': 'Como participar?',
    'en': 'How to participate?',
  },
  answer: {
    'pt-BR': '<p>Resposta em português</p>',
    'en': '<p>Answer in English</p>',
  },
  category: 'cat1',
  order: 0,
  viewCount: 10,
  isVisible: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('FaqDialog', () => {
  const mockOnSave = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create form correctly', () => {
    render(
      <FaqDialog
        faq={null}
        categories={mockCategories}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Create FAQ')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByText('Português')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('renders edit form with existing data', () => {
    render(
      <FaqDialog
        faq={mockFaq}
        categories={mockCategories}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Edit FAQ')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Como participar?')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();

    render(
      <FaqDialog
        faq={null}
        categories={mockCategories}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const createButton = screen.getByRole('button', { name: 'Create' });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Question in Portuguese is required')).toBeInTheDocument();
      expect(screen.getByText('Answer in Portuguese is required')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('switches between language tabs', async () => {
    const user = userEvent.setup();

    render(
      <FaqDialog
        faq={null}
        categories={mockCategories}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    // Initially on Portuguese tab
    expect(screen.getByLabelText('Question (PT-BR)')).toBeInTheDocument();

    // Switch to English tab
    const englishTab = screen.getByRole('tab', { name: /English/i });
    await user.click(englishTab);

    expect(screen.getByLabelText('Question (EN)')).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();

    render(
      <FaqDialog
        faq={null}
        categories={mockCategories}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    // Fill in required fields
    const categorySelect = screen.getByRole('combobox');
    await user.click(categorySelect);
    const categoryOption = await screen.findByText('Geral');
    await user.click(categoryOption);

    const questionInput = screen.getByLabelText('Question (PT-BR)');
    await user.type(questionInput, 'Test question?');

    const answerTextarea = screen.getByTestId('rich-text-editor');
    await user.type(answerTextarea, 'Test answer');

    const createButton = screen.getByRole('button', { name: 'Create' });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          question: expect.objectContaining({
            'pt-BR': 'Test question?',
          }),
          answer: expect.objectContaining({
            'pt-BR': 'Test answer',
          }),
          category: 'cat1',
          isVisible: true,
        })
      );
    });
  });

  it('toggles visibility switch', async () => {
    const user = userEvent.setup();

    render(
      <FaqDialog
        faq={mockFaq}
        categories={mockCategories}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const visibilitySwitch = screen.getByRole('switch');
    expect(visibilitySwitch).toBeChecked();

    await user.click(visibilitySwitch);
    expect(visibilitySwitch).not.toBeChecked();
  });

  it('shows translation status correctly', () => {
    render(
      <FaqDialog
        faq={mockFaq}
        categories={mockCategories}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Translation Status')).toBeInTheDocument();
    expect(screen.getByText('100% Complete')).toBeInTheDocument();
  });

  it('handles cancel button', async () => {
    const user = userEvent.setup();

    render(
      <FaqDialog
        faq={null}
        categories={mockCategories}
        open={true}
        onOpenChange={mockOnOpenChange}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});