import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConflictIndicator, ConflictBadge, ScheduleValidationSummary } from '@/components/sessions/ConflictIndicator';
import type { ISession } from '@shared/types/session.types';

describe('ConflictIndicator', () => {
  const mockConflict: ISession = {
    _id: '1' as any,
    title: {
      'pt-BR': 'Palestra Conflitante',
      'en': 'Conflicting Session',
    },
    description: {
      'pt-BR': 'Descrição',
      'en': 'Description',
    },
    speakerIds: ['speaker1'] as any[],
    startTime: new Date('2025-09-27T10:00:00'),
    endTime: new Date('2025-09-27T11:00:00'),
    stage: 'Main Stage',
    tags: [],
    isHighlight: false,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should show checking state', () => {
    render(<ConflictIndicator conflicts={[]} isChecking={true} />);
    expect(screen.getByText('Checking for conflicts...')).toBeInTheDocument();
  });

  it('should show no conflicts message', () => {
    render(<ConflictIndicator conflicts={[]} isChecking={false} />);
    expect(screen.getByText('No Conflicts')).toBeInTheDocument();
    expect(screen.getByText('This schedule slot is available')).toBeInTheDocument();
  });

  it('should display conflicts', () => {
    render(<ConflictIndicator conflicts={[mockConflict]} isChecking={false} />);
    expect(screen.getByText('Schedule Conflicts Detected')).toBeInTheDocument();
    expect(screen.getByText(/Conflicting Session/)).toBeInTheDocument();
    expect(screen.getByText(/Main Stage/)).toBeInTheDocument();
  });

  it('should indicate stage conflict', () => {
    render(<ConflictIndicator conflicts={[mockConflict]} isChecking={false} />);
    expect(screen.getByText('Stage Conflict')).toBeInTheDocument();
    expect(screen.getByText('The selected stage is already booked for this time')).toBeInTheDocument();
  });

  it('should indicate speaker conflict', () => {
    render(<ConflictIndicator conflicts={[mockConflict]} isChecking={false} />);
    expect(screen.getByText('Speaker Conflict')).toBeInTheDocument();
    expect(screen.getByText('One or more speakers have another session at this time')).toBeInTheDocument();
  });
});

describe('ConflictBadge', () => {
  it('should not render when no conflict', () => {
    const { container } = render(<ConflictBadge hasConflict={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should show conflict count', () => {
    render(<ConflictBadge hasConflict={true} conflictCount={3} />);
    expect(screen.getByText('3 conflicts')).toBeInTheDocument();
  });

  it('should show singular for one conflict', () => {
    render(<ConflictBadge hasConflict={true} conflictCount={1} />);
    expect(screen.getByText('1 conflict')).toBeInTheDocument();
  });
});

describe('ScheduleValidationSummary', () => {
  const defaultProps = {
    startTime: new Date('2025-09-27T10:00:00'),
    endTime: new Date('2025-09-27T11:30:00'),
    stage: 'Main Stage',
    speakerCount: 2,
    conflicts: [],
  };

  it('should display schedule summary', () => {
    render(<ScheduleValidationSummary {...defaultProps} />);
    expect(screen.getByText('Schedule Validation Summary')).toBeInTheDocument();
    expect(screen.getByText('1h 30min')).toBeInTheDocument();
    expect(screen.getByText('Main Stage')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // speaker count
  });

  it('should show invalid duration for bad times', () => {
    render(
      <ScheduleValidationSummary
        {...defaultProps}
        endTime={new Date('2025-09-27T09:00:00')} // End before start
      />
    );
    expect(screen.getByText('Invalid')).toBeInTheDocument();
    expect(screen.getByText('Please ensure the end time is after the start time and the duration is reasonable.')).toBeInTheDocument();
  });

  it('should indicate conflicts count', () => {
    const conflicts = [
      {
        _id: '1' as any,
        title: { 'pt-BR': 'Test', 'en': 'Test' },
        description: { 'pt-BR': 'Test', 'en': 'Test' },
        speakerIds: [],
        startTime: new Date(),
        endTime: new Date(),
        stage: 'Main Stage',
        tags: [],
        isHighlight: false,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ISession,
    ];

    render(<ScheduleValidationSummary {...defaultProps} conflicts={conflicts} />);
    const conflictCount = screen.getAllByText('1')[0]; // First '1' should be conflict count
    expect(conflictCount).toHaveClass('text-amber-600');
  });

  it('should show "Not selected" when no stage', () => {
    render(<ScheduleValidationSummary {...defaultProps} stage="" />);
    expect(screen.getByText('Not selected')).toBeInTheDocument();
  });
});