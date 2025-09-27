import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpeakerForm } from '@/components/speakers/SpeakerForm';
import type { Speaker } from '@shared/types/speaker.types';

const mockSpeaker: Speaker = {
  _id: '1',
  name: 'John Doe',
  bio: { 'pt-BR': 'Biografia em português', 'en': 'Biography in English' },
  photoUrl: 'https://example.com/photo.jpg',
  company: 'Tech Corp',
  position: { 'pt-BR': 'Diretor', 'en': 'Director' },
  socialLinks: {
    linkedin: 'https://linkedin.com/john',
    twitter: '@johndoe',
    instagram: '@johndoe',
    github: 'https://github.com/johndoe',
    website: 'https://johndoe.com'
  },
  priority: 5,
  isHighlight: true,
  isVisible: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('SpeakerForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(
      <SpeakerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Company/)).toBeInTheDocument();
    expect(screen.getByText(/Position/)).toBeInTheDocument();
    expect(screen.getByText(/Bio/)).toBeInTheDocument();
    expect(screen.getByText(/Social Links/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Priority/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Highlight/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Visible/)).toBeInTheDocument();
  });

  it('populates form with speaker data when editing', () => {
    render(
      <SpeakerForm
        speaker={mockSpeaker}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tech Corp')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <SpeakerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByText('Create Speaker');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Name must be at least 3 characters/)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates name length', async () => {
    render(
      <SpeakerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText(/Name/);
    await userEvent.type(nameInput, 'Jo');

    const submitButton = screen.getByText('Create Speaker');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Name must be at least 3 characters/)).toBeInTheDocument();
    });
  });

  it('validates bio minimum length', async () => {
    render(
      <SpeakerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText(/Name/);
    await userEvent.type(nameInput, 'John Doe');

    const submitButton = screen.getByText('Create Speaker');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Portuguese bio must be at least 10 characters/)).toBeInTheDocument();
    });
  });

  it('validates URL formats', async () => {
    render(
      <SpeakerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const linkedinInput = screen.getByPlaceholderText('LinkedIn URL');
    await userEvent.type(linkedinInput, 'invalid-url');

    const submitButton = screen.getByText('Create Speaker');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please enter valid URLs for social links/)).toBeInTheDocument();
    });
  });

  it('validates priority range', async () => {
    render(
      <SpeakerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const priorityInput = screen.getByLabelText(/Priority/);
    await userEvent.clear(priorityInput);
    await userEvent.type(priorityInput, '1000');

    const submitButton = screen.getByText('Create Speaker');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Priority must be less than 1000/)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(
      <SpeakerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const nameInput = screen.getByLabelText(/Name/);
    await userEvent.type(nameInput, 'John Doe');

    const companyInput = screen.getByLabelText(/Company/);
    await userEvent.type(companyInput, 'Tech Corp');

    const photoUrlInput = screen.getByPlaceholderText('https://example.com/photo.jpg');
    await userEvent.type(photoUrlInput, 'https://example.com/photo.jpg');

    const ptBRTab = screen.getByText('Portuguese');
    fireEvent.click(ptBRTab);

    const bioPtInput = screen.getByPlaceholderText('Biografia em português');
    await userEvent.type(bioPtInput, 'Esta é uma biografia em português');

    const positionPtInput = screen.getByPlaceholderText('Cargo em português');
    await userEvent.type(positionPtInput, 'Diretor');

    const enTab = screen.getAllByText('English')[0];
    fireEvent.click(enTab);

    const bioEnInput = screen.getByPlaceholderText('Biography in English');
    await userEvent.type(bioEnInput, 'This is a biography in English');

    const positionEnInput = screen.getByPlaceholderText('Position in English');
    await userEvent.type(positionEnInput, 'Director');

    const submitButton = screen.getByText('Create Speaker');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          company: 'Tech Corp',
          photoUrl: 'https://example.com/photo.jpg'
        })
      );
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <SpeakerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('shows update button when editing', () => {
    render(
      <SpeakerForm
        speaker={mockSpeaker}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Update Speaker')).toBeInTheDocument();
    expect(screen.queryByText('Create Speaker')).not.toBeInTheDocument();
  });

  it('shows create button when adding new', () => {
    render(
      <SpeakerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Create Speaker')).toBeInTheDocument();
    expect(screen.queryByText('Update Speaker')).not.toBeInTheDocument();
  });

  it('disables form fields when loading', () => {
    render(
      <SpeakerForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={true}
      />
    );

    const nameInput = screen.getByLabelText(/Name/);
    expect(nameInput).toBeDisabled();

    const submitButton = screen.getByText('Saving...');
    expect(submitButton).toBeDisabled();
  });
});