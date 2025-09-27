import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FaqCategoriesList } from '@/components/faq-categories/FaqCategoriesList';
import type { FaqCategory } from '@shared/types/faq.types';

const mockCategories: FaqCategory[] = [
  {
    _id: '1',
    name: { 'pt-BR': 'Inscrições', 'en': 'Registration' },
    order: 0,
    faqCount: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    _id: '2',
    name: { 'pt-BR': 'Pagamentos', 'en': 'Payments' },
    order: 1,
    faqCount: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

describe('FaqCategoriesList', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnOrderChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders categories list correctly', () => {
    render(
      <FaqCategoriesList
        categories={mockCategories}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onOrderChange={mockOnOrderChange}
      />
    );

    expect(screen.getByText('Inscrições')).toBeInTheDocument();
    expect(screen.getByText('Registration')).toBeInTheDocument();
    expect(screen.getByText('Pagamentos')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
    expect(screen.getByText('5 FAQs')).toBeInTheDocument();
    expect(screen.getByText('3 FAQs')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = render(
      <FaqCategoriesList
        categories={[]}
        loading={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onOrderChange={mockOnOrderChange}
      />
    );

    const skeletons = container.querySelectorAll('[class*="Skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no categories', () => {
    render(
      <FaqCategoriesList
        categories={[]}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onOrderChange={mockOnOrderChange}
      />
    );

    expect(screen.getByText(/No FAQ categories found/i)).toBeInTheDocument();
  });

  it('calls onEdit when edit is clicked', async () => {
    render(
      <FaqCategoriesList
        categories={mockCategories}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onOrderChange={mockOnOrderChange}
      />
    );

    const menuButtons = screen.getAllByRole('button', { name: /open menu/i });
    await userEvent.click(menuButtons[0]);

    const editButton = await screen.findByText('Edit');
    await userEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('shows delete confirmation dialog', async () => {
    render(
      <FaqCategoriesList
        categories={mockCategories}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onOrderChange={mockOnOrderChange}
      />
    );

    const menuButtons = screen.getAllByRole('button', { name: /open menu/i });
    await userEvent.click(menuButtons[0]);

    const deleteButton = await screen.findByText('Delete');
    await userEvent.click(deleteButton);

    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText(/This will permanently delete the FAQ category/i)).toBeInTheDocument();
  });

  it('calls onDelete when delete is confirmed', async () => {
    render(
      <FaqCategoriesList
        categories={mockCategories}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onOrderChange={mockOnOrderChange}
      />
    );

    const menuButtons = screen.getAllByRole('button', { name: /open menu/i });
    await userEvent.click(menuButtons[0]);

    const deleteButton = await screen.findByText('Delete');
    await userEvent.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: 'Delete' });
    await userEvent.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('handles move up and down buttons correctly', async () => {
    render(
      <FaqCategoriesList
        categories={mockCategories}
        loading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onOrderChange={mockOnOrderChange}
      />
    );

    // First item should have disabled up arrow
    const upButtons = screen.getAllByLabelText('Move up');
    expect(upButtons[0]).toBeDisabled();
    expect(upButtons[1]).not.toBeDisabled();

    // Last item should have disabled down arrow
    const downButtons = screen.getAllByLabelText('Move down');
    expect(downButtons[0]).not.toBeDisabled();
    expect(downButtons[1]).toBeDisabled();

    // Click move down on first item
    await userEvent.click(downButtons[0]);

    expect(mockOnOrderChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ _id: '2', order: 0 }),
        expect.objectContaining({ _id: '1', order: 1 }),
      ])
    );
  });
});