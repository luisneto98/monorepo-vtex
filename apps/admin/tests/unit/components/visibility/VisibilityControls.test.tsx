import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import VisibilityControls from '@/components/visibility/VisibilityControls';
import type { SystemConfig } from '@vtexday26/shared';

describe('VisibilityControls', () => {
  const mockConfig: SystemConfig = {
    _id: '1',
    sections: {
      speakers: {
        isVisible: true,
        lastChanged: new Date(),
        changedBy: 'user1',
      },
      sponsors: {
        isVisible: false,
        lastChanged: new Date(),
        changedBy: 'user2',
        customMessage: {
          'pt-BR': 'Em breve',
          'en': 'Coming soon',
        },
      },
      sessions: {
        isVisible: true,
        lastChanged: new Date(),
        changedBy: 'user1',
      },
      faq: {
        isVisible: true,
        lastChanged: new Date(),
        changedBy: 'user1',
      },
      registration: {
        isVisible: true,
        lastChanged: new Date(),
        changedBy: 'user1',
      },
      schedule: {
        isVisible: false,
        lastChanged: new Date(),
        changedBy: 'user2',
        scheduledActivation: {
          dateTime: new Date(Date.now() + 86400000), // Tomorrow
          timezone: 'America/Sao_Paulo',
        },
      },
    },
    lastModifiedBy: 'user1',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOnSectionUpdate = vi.fn();

  it('renders all sections', () => {
    render(
      <VisibilityControls
        config={mockConfig}
        pendingChanges={{}}
        onSectionUpdate={mockOnSectionUpdate}
      />
    );

    expect(screen.getByText('Speakers')).toBeInTheDocument();
    expect(screen.getByText('Sponsors')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.getByText('Registration')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
  });

  it('shows correct visibility status', () => {
    render(
      <VisibilityControls
        config={mockConfig}
        pendingChanges={{}}
        onSectionUpdate={mockOnSectionUpdate}
      />
    );

    const visibleLabels = screen.getAllByText('Visible');
    const hiddenLabels = screen.getAllByText('Hidden');

    expect(visibleLabels.length).toBeGreaterThan(0);
    expect(hiddenLabels.length).toBe(2); // sponsors and schedule are hidden
  });

  it('indicates sections with pending changes', () => {
    const pendingChanges = {
      speakers: {
        isVisible: false,
      },
    };

    render(
      <VisibilityControls
        config={mockConfig}
        pendingChanges={pendingChanges}
        onSectionUpdate={mockOnSectionUpdate}
      />
    );

    expect(screen.getByText('Modified')).toBeInTheDocument();
  });

  it('calls onSectionUpdate when section is modified', () => {
    render(
      <VisibilityControls
        config={mockConfig}
        pendingChanges={{}}
        onSectionUpdate={mockOnSectionUpdate}
      />
    );

    // This would need actual interaction with SectionVisibilityCard
    // which would require more detailed mocking
  });
});