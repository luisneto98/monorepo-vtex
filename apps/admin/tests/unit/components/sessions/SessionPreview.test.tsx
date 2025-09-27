import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionPreview } from '@/components/sessions/SessionPreview';
import type { ISession } from '@shared/types/session.types';

describe('SessionPreview', () => {
  const mockSession: ISession = {
    _id: '1' as any,
    title: {
      'pt-BR': 'Palestra Teste',
      'en': 'Test Session',
    },
    description: {
      'pt-BR': 'Descrição da palestra teste',
      'en': 'Test session description',
    },
    speakerIds: ['speaker1', 'speaker2'] as any[],
    sponsorIds: ['sponsor1'] as any[],
    startTime: new Date('2025-09-27T10:00:00'),
    endTime: new Date('2025-09-27T11:30:00'),
    stage: 'Main Stage',
    tags: ['technical', 'workshop'],
    technicalLevel: 'intermediate',
    language: 'pt-BR',
    isHighlight: true,
    isVisible: true,
    capacity: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOnOpenChange = vi.fn();

  it('should render session preview dialog', () => {
    render(
      <SessionPreview
        open={true}
        onOpenChange={mockOnOpenChange}
        session={mockSession}
      />
    );

    expect(screen.getByText('Session Preview')).toBeInTheDocument();
    expect(screen.getByText('See how your session will appear to attendees')).toBeInTheDocument();
  });

  it('should display session in Portuguese by default', () => {
    render(
      <SessionPreview
        open={true}
        onOpenChange={mockOnOpenChange}
        session={mockSession}
      />
    );

    expect(screen.getByText('Palestra Teste')).toBeInTheDocument();
    expect(screen.getByText('Descrição da palestra teste')).toBeInTheDocument();
  });

  it('should switch to English language', () => {
    render(
      <SessionPreview
        open={true}
        onOpenChange={mockOnOpenChange}
        session={mockSession}
      />
    );

    const englishButton = screen.getByRole('button', { name: 'English' });
    fireEvent.click(englishButton);

    expect(screen.getByText('Test Session')).toBeInTheDocument();
    expect(screen.getByText('Test session description')).toBeInTheDocument();
  });

  it('should switch between desktop and mobile views', () => {
    render(
      <SessionPreview
        open={true}
        onOpenChange={mockOnOpenChange}
        session={mockSession}
      />
    );

    const mobileButton = screen.getByRole('button', { name: /Mobile/i });
    expect(mobileButton).toBeInTheDocument();

    fireEvent.click(mobileButton);

    // Mobile view should have different styling (max-w-sm class)
    const agendaTab = screen.getByRole('tab', { name: 'Agenda View' });
    fireEvent.click(agendaTab);

    // Check that mobile-specific styles are applied
    const cardElements = document.querySelectorAll('.max-w-sm');
    expect(cardElements.length).toBeGreaterThan(0);
  });

  it('should display highlight badge when session is highlighted', () => {
    render(
      <SessionPreview
        open={true}
        onOpenChange={mockOnOpenChange}
        session={mockSession}
      />
    );

    expect(screen.getByText('Destaque')).toBeInTheDocument();
  });

  it('should display session metadata', () => {
    render(
      <SessionPreview
        open={true}
        onOpenChange={mockOnOpenChange}
        session={mockSession}
      />
    );

    // Check for stage
    expect(screen.getByText('Main Stage')).toBeInTheDocument();

    // Check for capacity
    expect(screen.getByText(/100/)).toBeInTheDocument();
    expect(screen.getByText(/vagas/)).toBeInTheDocument();

    // Check for tags
    expect(screen.getByText('technical')).toBeInTheDocument();
    expect(screen.getByText('workshop')).toBeInTheDocument();
  });

  it('should display speakers section when speakers exist', () => {
    render(
      <SessionPreview
        open={true}
        onOpenChange={mockOnOpenChange}
        session={mockSession}
      />
    );

    expect(screen.getByText('Palestrantes')).toBeInTheDocument();
    expect(screen.getByText('Speaker 1')).toBeInTheDocument();
    expect(screen.getByText('Speaker 2')).toBeInTheDocument();
  });

  it('should display sponsors section when sponsors exist', () => {
    render(
      <SessionPreview
        open={true}
        onOpenChange={mockOnOpenChange}
        session={mockSession}
      />
    );

    expect(screen.getByText('Patrocinadores')).toBeInTheDocument();
    expect(screen.getByText('Sponsor 1')).toBeInTheDocument();
  });

  it('should switch between different view tabs', () => {
    render(
      <SessionPreview
        open={true}
        onOpenChange={mockOnOpenChange}
        session={mockSession}
      />
    );

    // Check Agenda View tab
    const agendaTab = screen.getByRole('tab', { name: 'Agenda View' });
    expect(agendaTab).toBeInTheDocument();

    // Switch to Detail View
    const detailTab = screen.getByRole('tab', { name: 'Detail View' });
    fireEvent.click(detailTab);
    expect(screen.getByText(/Informações/)).toBeInTheDocument();

    // Switch to Card View
    const cardTab = screen.getByRole('tab', { name: 'Card View' });
    fireEvent.click(cardTab);

    // Card view shows abbreviated content
    const cards = document.querySelectorAll('.text-sm');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should display correct duration', () => {
    render(
      <SessionPreview
        open={true}
        onOpenChange={mockOnOpenChange}
        session={mockSession}
      />
    );

    // Switch to detail view to see duration
    const detailTab = screen.getByRole('tab', { name: 'Detail View' });
    fireEvent.click(detailTab);

    expect(screen.getByText(/1h 30min/)).toBeInTheDocument();
  });

  it('should not display highlight badge when session is not highlighted', () => {
    const nonHighlightedSession = {
      ...mockSession,
      isHighlight: false,
    };

    render(
      <SessionPreview
        open={true}
        onOpenChange={mockOnOpenChange}
        session={nonHighlightedSession}
      />
    );

    expect(screen.queryByText('Destaque')).not.toBeInTheDocument();
  });
});