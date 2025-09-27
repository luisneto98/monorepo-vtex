import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionsList } from '@/components/sessions/SessionsList';
import { SessionsService } from '@/services/sessions.service';
import type { ISession } from '@shared/types/session.types';

vi.mock('@/services/sessions.service');
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('SessionsList', () => {
  const mockOnEdit = vi.fn();
  const mockOnAdd = vi.fn();
  const mockOnPreview = vi.fn();

  const mockSessions: ISession[] = [
    {
      _id: '1' as any,
      title: {
        'pt-BR': 'Palestra Teste',
        'en': 'Test Session',
      },
      description: {
        'pt-BR': 'Descrição teste',
        'en': 'Test description',
      },
      speakerIds: [],
      startTime: new Date('2025-09-27T10:00:00'),
      endTime: new Date('2025-09-27T11:00:00'),
      stage: 'Main Stage',
      tags: ['technical'],
      isHighlight: true,
      isVisible: true,
      capacity: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SessionsService.getSessions).mockResolvedValue({
      success: true,
      data: mockSessions,
      metadata: {
        total: 1,
        page: 1,
        limit: 10,
        hasNext: false,
        hasPrev: false,
      },
    });
  });

  it('should render sessions list', async () => {
    render(
      <SessionsList
        onEdit={mockOnEdit}
        onAdd={mockOnAdd}
        onPreview={mockOnPreview}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Session')).toBeInTheDocument();
    });

    expect(screen.getByText('Main Stage')).toBeInTheDocument();
    expect(screen.getByText('Highlight')).toBeInTheDocument();
  });

  it('should call onAdd when add button is clicked', () => {
    render(
      <SessionsList
        onEdit={mockOnEdit}
        onAdd={mockOnAdd}
        onPreview={mockOnPreview}
      />
    );

    const addButton = screen.getByText('Add Session');
    fireEvent.click(addButton);

    expect(mockOnAdd).toHaveBeenCalled();
  });

  it('should filter sessions by search term', async () => {
    render(
      <SessionsList
        onEdit={mockOnEdit}
        onAdd={mockOnAdd}
        onPreview={mockOnPreview}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search sessions...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(SessionsService.getSessions).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test',
        })
      );
    }, { timeout: 1000 });
  });

  it('should handle sorting', async () => {
    render(
      <SessionsList
        onEdit={mockOnEdit}
        onAdd={mockOnAdd}
        onPreview={mockOnPreview}
      />
    );

    const titleHeader = screen.getByText('Title');
    fireEvent.click(titleHeader);

    await waitFor(() => {
      expect(SessionsService.getSessions).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: 'title',
        })
      );
    });
  });

  it('should show loading skeleton initially', () => {
    vi.mocked(SessionsService.getSessions).mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <SessionsList
        onEdit={mockOnEdit}
        onAdd={mockOnAdd}
        onPreview={mockOnPreview}
      />
    );

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(SessionsService.getSessions).mockRejectedValue(new Error('Failed to fetch'));

    render(
      <SessionsList
        onEdit={mockOnEdit}
        onAdd={mockOnAdd}
        onPreview={mockOnPreview}
      />
    );

    await waitFor(() => {
      expect(SessionsService.getSessions).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle pagination', async () => {
    render(
      <SessionsList
        onEdit={mockOnEdit}
        onAdd={mockOnAdd}
        onPreview={mockOnPreview}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Session')).toBeInTheDocument();
    });

    const pageSizeSelector = screen.getByText('10 / page');
    fireEvent.click(pageSizeSelector);

    const option25 = await screen.findByText('25 / page');
    fireEvent.click(option25);

    await waitFor(() => {
      expect(SessionsService.getSessions).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 25,
        })
      );
    });
  });
});