import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpeakersList } from '@/components/speakers/SpeakersList';
import { speakersService } from '@/services/speakers.service';
import type { Speaker } from '@shared/types/speaker.types';

vi.mock('@/services/speakers.service');

const mockSpeakers: Speaker[] = [
  {
    _id: '1',
    name: 'John Doe',
    bio: { 'pt-BR': 'Bio PT', 'en': 'Bio EN' },
    photoUrl: 'https://example.com/photo1.jpg',
    company: 'Company A',
    position: { 'pt-BR': 'Diretor', 'en': 'Director' },
    socialLinks: { linkedin: 'https://linkedin.com/john' },
    priority: 1,
    isHighlight: true,
    isVisible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '2',
    name: 'Jane Smith',
    bio: { 'pt-BR': 'Bio PT 2', 'en': 'Bio EN 2' },
    photoUrl: 'https://example.com/photo2.jpg',
    company: 'Company B',
    position: { 'pt-BR': 'Gerente', 'en': 'Manager' },
    socialLinks: { twitter: '@jane' },
    priority: 2,
    isHighlight: false,
    isVisible: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

describe('SpeakersList', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnAdd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(speakersService.getSpeakers).mockResolvedValue({
      success: true,
      data: mockSpeakers,
      metadata: {
        total: 2,
        page: 1,
        limit: 10,
        hasNext: false,
        hasPrev: false
      }
    });
  });

  it('renders speakers list with data', async () => {
    render(
      <SpeakersList
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAdd={mockOnAdd}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('displays company names', async () => {
    render(
      <SpeakersList
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAdd={mockOnAdd}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Company A')).toBeInTheDocument();
      expect(screen.getByText('Company B')).toBeInTheDocument();
    });
  });

  it('shows highlight badge for highlighted speakers', async () => {
    render(
      <SpeakersList
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAdd={mockOnAdd}
      />
    );

    await waitFor(() => {
      const badges = screen.getAllByText('Highlight');
      expect(badges).toHaveLength(1);
    });
  });

  it('shows visibility status', async () => {
    render(
      <SpeakersList
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAdd={mockOnAdd}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Visible')).toBeInTheDocument();
      expect(screen.getByText('Hidden')).toBeInTheDocument();
    });
  });

  it('calls onAdd when Add Speaker button is clicked', async () => {
    render(
      <SpeakersList
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAdd={mockOnAdd}
      />
    );

    const addButton = screen.getByText('Add Speaker');
    fireEvent.click(addButton);

    expect(mockOnAdd).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit when edit button is clicked', async () => {
    render(
      <SpeakersList
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAdd={mockOnAdd}
      />
    );

    await waitFor(() => {
      const editButtons = screen.getAllByLabelText(/Edit/);
      fireEvent.click(editButtons[0]);
    });

    expect(mockOnEdit).toHaveBeenCalledWith(mockSpeakers[0]);
  });

  it('calls onDelete when delete button is clicked', async () => {
    render(
      <SpeakersList
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAdd={mockOnAdd}
      />
    );

    await waitFor(() => {
      const deleteButtons = screen.getAllByLabelText(/Delete/);
      fireEvent.click(deleteButtons[0]);
    });

    expect(mockOnDelete).toHaveBeenCalledWith(mockSpeakers[0]);
  });

  it('filters speakers on search', async () => {
    render(
      <SpeakersList
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAdd={mockOnAdd}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search speakers...');
    await userEvent.type(searchInput, 'John');

    await waitFor(() => {
      expect(speakersService.getSpeakers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'John' })
      );
    }, { timeout: 1000 });
  });

  it('shows loading state initially', () => {
    render(
      <SpeakersList
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAdd={mockOnAdd}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error message on API failure', async () => {
    vi.mocked(speakersService.getSpeakers).mockRejectedValueOnce(
      new Error('API Error')
    );

    render(
      <SpeakersList
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAdd={mockOnAdd}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load speakers')).toBeInTheDocument();
    });
  });

  it('shows empty state when no speakers', async () => {
    vi.mocked(speakersService.getSpeakers).mockResolvedValueOnce({
      success: true,
      data: [],
      metadata: {
        total: 0,
        page: 1,
        limit: 10,
        hasNext: false,
        hasPrev: false
      }
    });

    render(
      <SpeakersList
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAdd={mockOnAdd}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No speakers found.')).toBeInTheDocument();
    });
  });

  it('handles pagination correctly', async () => {
    vi.mocked(speakersService.getSpeakers).mockResolvedValueOnce({
      success: true,
      data: mockSpeakers,
      metadata: {
        total: 20,
        page: 1,
        limit: 10,
        hasNext: true,
        hasPrev: false
      }
    });

    render(
      <SpeakersList
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAdd={mockOnAdd}
      />
    );

    await waitFor(() => {
      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();

      const prevButton = screen.getByText('Previous');
      expect(prevButton).toBeDisabled();
    });

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(speakersService.getSpeakers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });
});