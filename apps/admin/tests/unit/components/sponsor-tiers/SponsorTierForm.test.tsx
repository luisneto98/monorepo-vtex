import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SponsorTierForm } from '../../../../src/components/sponsor-tiers/SponsorTierForm';

describe('SponsorTierForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultTier = {
    _id: '1',
    name: 'gold',
    displayName: { 'pt-BR': 'Ouro', en: 'Gold' },
    order: 1,
    maxPosts: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    render(<SponsorTierForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/tier name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/maximum posts/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/order/i)).toBeInTheDocument();
  });

  it('displays multilingual tabs', () => {
    render(<SponsorTierForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByRole('tab', { name: /português/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /english/i })).toBeInTheDocument();
  });

  it('populates form with existing tier data', () => {
    render(<SponsorTierForm tier={defaultTier} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByDisplayValue('gold');
    expect(nameInput).toBeInTheDocument();

    const maxPostsInput = screen.getByDisplayValue('10');
    expect(maxPostsInput).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<SponsorTierForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates maxPosts is positive number', async () => {
    render(<SponsorTierForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const maxPostsInput = screen.getByLabelText(/maximum posts/i);
    fireEvent.change(maxPostsInput, { target: { value: '-5' } });

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/must be positive/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(<SponsorTierForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const nameInput = screen.getByLabelText(/tier name/i);
    fireEvent.change(nameInput, { target: { value: 'platinum' } });

    const maxPostsInput = screen.getByLabelText(/maximum posts/i);
    fireEvent.change(maxPostsInput, { target: { value: '20' } });

    const ptDisplayInput = screen.getByPlaceholderText(/nome em português/i);
    fireEvent.change(ptDisplayInput, { target: { value: 'Platina' } });

    const enTab = screen.getByRole('tab', { name: /english/i });
    fireEvent.click(enTab);

    const enDisplayInput = screen.getByPlaceholderText(/name in english/i);
    fireEvent.change(enDisplayInput, { target: { value: 'Platinum' } });

    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'platinum',
        displayName: { 'pt-BR': 'Platina', en: 'Platinum' },
        maxPosts: 20,
        order: expect.any(Number)
      });
    });
  });

  it('handles cancel button click', () => {
    render(<SponsorTierForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});