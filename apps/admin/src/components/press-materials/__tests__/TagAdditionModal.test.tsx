import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { TagAdditionModal } from '../TagAdditionModal';

describe('TagAdditionModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(
      <TagAdditionModal
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Add Tags')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter tags separated by commas')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <TagAdditionModal
        open={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByText('Add Tags')).not.toBeInTheDocument();
  });

  it('validates tag length', async () => {
    render(
      <TagAdditionModal
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByPlaceholderText('Enter tags separated by commas');
    const veryLongTag = 'a'.repeat(51); // Over 50 character limit

    fireEvent.change(input, { target: { value: veryLongTag } });

    await waitFor(() => {
      expect(screen.getByText(/Tags must be 50 characters or less/)).toBeInTheDocument();
    });
  });

  it('validates tag characters', async () => {
    render(
      <TagAdditionModal
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByPlaceholderText('Enter tags separated by commas');

    fireEvent.change(input, { target: { value: 'test<script>' } });

    await waitFor(() => {
      expect(screen.getByText(/Invalid characters in tags/)).toBeInTheDocument();
    });
  });

  it('sanitizes input and confirms valid tags', async () => {
    render(
      <TagAdditionModal
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByPlaceholderText('Enter tags separated by commas');
    const confirmButton = screen.getByText('Add Tags');

    fireEvent.change(input, { target: { value: 'tag1, tag2, tag3' } });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(['tag1', 'tag2', 'tag3']);
    });
  });

  it('calls onClose when cancel is clicked', () => {
    render(
      <TagAdditionModal
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('trims whitespace from tags', async () => {
    render(
      <TagAdditionModal
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByPlaceholderText('Enter tags separated by commas');
    const confirmButton = screen.getByText('Add Tags');

    fireEvent.change(input, { target: { value: '  tag1  ,   tag2   ' } });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(['tag1', 'tag2']);
    });
  });

  it('filters out empty tags', async () => {
    render(
      <TagAdditionModal
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByPlaceholderText('Enter tags separated by commas');
    const confirmButton = screen.getByText('Add Tags');

    fireEvent.change(input, { target: { value: 'tag1,,,tag2,' } });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(['tag1', 'tag2']);
    });
  });
});