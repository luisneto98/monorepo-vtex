import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SpeakerSessionsList from '../../../src/components/sessions/SpeakerSessionsList';
import SpeakerService from '../../../src/services/SpeakerService';
import { ISession } from '@monorepo-vtex/shared';

jest.mock('../../../src/services/SpeakerService');
jest.mock('../../../src/utils/dateUtils', () => ({
  formatDate: jest.fn((date) => '01/10/2025'),
  formatTime: jest.fn((date) => '10:00'),
}));

describe('SpeakerSessionsList', () => {
  const mockOnSessionPress = jest.fn();
  const mockSpeakerId = 'speaker-1';

  const createMockSession = (id: string, title: string): ISession => ({
    _id: id,
    title: { 'pt-BR': title, en: title },
    description: { 'pt-BR': 'Description', en: 'Description' },
    type: 'talk',
    startTime: new Date('2025-10-01T10:00:00Z'),
    endTime: new Date('2025-10-01T11:00:00Z'),
    stage: 'Principal',
    speakerIds: [mockSpeakerId],
    tags: ['tech'],
    isHighlight: false,
    isVisible: true,
    technicalLevel: 'intermediate',
    language: 'pt-BR',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading indicator while fetching sessions', () => {
      (SpeakerService.getSpeakerSessions as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { getByText } = render(
        <SpeakerSessionsList
          speakerId={mockSpeakerId}
          onSessionPress={mockOnSessionPress}
        />
      );

      expect(getByText('Carregando palestras...')).toBeTruthy();
    });
  });

  describe('Error State', () => {
    it('should display error message when fetching fails', async () => {
      (SpeakerService.getSpeakerSessions as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { getByText } = render(
        <SpeakerSessionsList
          speakerId={mockSpeakerId}
          onSessionPress={mockOnSessionPress}
        />
      );

      await waitFor(() => {
        expect(getByText('Network error')).toBeTruthy();
      });
    });

    it('should show retry button on error', async () => {
      (SpeakerService.getSpeakerSessions as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { getByText } = render(
        <SpeakerSessionsList
          speakerId={mockSpeakerId}
          onSessionPress={mockOnSessionPress}
        />
      );

      await waitFor(() => {
        expect(getByText('Tentar novamente')).toBeTruthy();
      });
    });

    it('should retry fetching when retry button is pressed', async () => {
      const mockSessions = [createMockSession('session-1', 'Session 1')];

      (SpeakerService.getSpeakerSessions as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSessions);

      const { getByText } = render(
        <SpeakerSessionsList
          speakerId={mockSpeakerId}
          onSessionPress={mockOnSessionPress}
        />
      );

      await waitFor(() => {
        expect(getByText('Tentar novamente')).toBeTruthy();
      });

      fireEvent.press(getByText('Tentar novamente'));

      await waitFor(() => {
        expect(getByText('Session 1')).toBeTruthy();
      });

      expect(SpeakerService.getSpeakerSessions).toHaveBeenCalledTimes(2);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no sessions are found', async () => {
      (SpeakerService.getSpeakerSessions as jest.Mock).mockResolvedValue([]);

      const { getByText } = render(
        <SpeakerSessionsList
          speakerId={mockSpeakerId}
          onSessionPress={mockOnSessionPress}
        />
      );

      await waitFor(() => {
        expect(getByText('📭')).toBeTruthy();
        expect(getByText('Sem outras palestras')).toBeTruthy();
      });
    });
  });

  describe('Sessions Rendering', () => {
    it('should render list of sessions successfully', async () => {
      const mockSessions = [
        createMockSession('session-1', 'First Session'),
        createMockSession('session-2', 'Second Session'),
      ];

      (SpeakerService.getSpeakerSessions as jest.Mock).mockResolvedValue(mockSessions);

      const { getByText } = render(
        <SpeakerSessionsList
          speakerId={mockSpeakerId}
          onSessionPress={mockOnSessionPress}
        />
      );

      await waitFor(() => {
        expect(getByText('First Session')).toBeTruthy();
        expect(getByText('Second Session')).toBeTruthy();
      });
    });

    it('should display session metadata correctly', async () => {
      const mockSessions = [createMockSession('session-1', 'Test Session')];

      (SpeakerService.getSpeakerSessions as jest.Mock).mockResolvedValue(mockSessions);

      const { getByText } = render(
        <SpeakerSessionsList
          speakerId={mockSpeakerId}
          onSessionPress={mockOnSessionPress}
        />
      );

      await waitFor(() => {
        expect(getByText('Test Session')).toBeTruthy();
        expect(getByText('Principal')).toBeTruthy();
        expect(getByText('🟡 Intermediário')).toBeTruthy();
      });
    });

    it('should call onSessionPress when a session is pressed', async () => {
      const mockSessions = [createMockSession('session-1', 'Test Session')];

      (SpeakerService.getSpeakerSessions as jest.Mock).mockResolvedValue(mockSessions);

      const { getByText } = render(
        <SpeakerSessionsList
          speakerId={mockSpeakerId}
          onSessionPress={mockOnSessionPress}
        />
      );

      await waitFor(() => {
        expect(getByText('Test Session')).toBeTruthy();
      });

      fireEvent.press(getByText('Test Session'));

      expect(mockOnSessionPress).toHaveBeenCalledTimes(1);
      expect(mockOnSessionPress).toHaveBeenCalledWith(mockSessions[0]);
    });
  });

  describe('Current Session Indicator', () => {
    it('should mark current session with badge', async () => {
      const mockSessions = [
        createMockSession('session-1', 'Current Session'),
        createMockSession('session-2', 'Other Session'),
      ];

      (SpeakerService.getSpeakerSessions as jest.Mock).mockResolvedValue(mockSessions);

      const { getByText } = render(
        <SpeakerSessionsList
          speakerId={mockSpeakerId}
          currentSessionId="session-1"
          onSessionPress={mockOnSessionPress}
        />
      );

      await waitFor(() => {
        expect(getByText('Palestra atual')).toBeTruthy();
      });
    });

    it('should disable current session card', async () => {
      const mockSessions = [
        createMockSession('session-1', 'Current Session'),
        createMockSession('session-2', 'Other Session'),
      ];

      (SpeakerService.getSpeakerSessions as jest.Mock).mockResolvedValue(mockSessions);

      const { getByText } = render(
        <SpeakerSessionsList
          speakerId={mockSpeakerId}
          currentSessionId="session-1"
          onSessionPress={mockOnSessionPress}
        />
      );

      await waitFor(() => {
        expect(getByText('Current Session')).toBeTruthy();
      });

      fireEvent.press(getByText('Current Session'));

      // Should not trigger onSessionPress for current session
      expect(mockOnSessionPress).not.toHaveBeenCalled();
    });

    it('should allow pressing non-current sessions', async () => {
      const mockSessions = [
        createMockSession('session-1', 'Current Session'),
        createMockSession('session-2', 'Other Session'),
      ];

      (SpeakerService.getSpeakerSessions as jest.Mock).mockResolvedValue(mockSessions);

      const { getByText } = render(
        <SpeakerSessionsList
          speakerId={mockSpeakerId}
          currentSessionId="session-1"
          onSessionPress={mockOnSessionPress}
        />
      );

      await waitFor(() => {
        expect(getByText('Other Session')).toBeTruthy();
      });

      fireEvent.press(getByText('Other Session'));

      expect(mockOnSessionPress).toHaveBeenCalledTimes(1);
      expect(mockOnSessionPress).toHaveBeenCalledWith(mockSessions[1]);
    });
  });

  describe('Technical Level Display', () => {
    it('should display beginner level correctly', async () => {
      const session = createMockSession('session-1', 'Test Session');
      session.technicalLevel = 'beginner';

      (SpeakerService.getSpeakerSessions as jest.Mock).mockResolvedValue([session]);

      const { getByText } = render(
        <SpeakerSessionsList
          speakerId={mockSpeakerId}
          onSessionPress={mockOnSessionPress}
        />
      );

      await waitFor(() => {
        expect(getByText('🟢 Iniciante')).toBeTruthy();
      });
    });

    it('should display advanced level correctly', async () => {
      const session = createMockSession('session-1', 'Test Session');
      session.technicalLevel = 'advanced';

      (SpeakerService.getSpeakerSessions as jest.Mock).mockResolvedValue([session]);

      const { getByText } = render(
        <SpeakerSessionsList
          speakerId={mockSpeakerId}
          onSessionPress={mockOnSessionPress}
        />
      );

      await waitFor(() => {
        expect(getByText('🔴 Avançado')).toBeTruthy();
      });
    });

    it('should handle sessions without technical level', async () => {
      const session = createMockSession('session-1', 'Test Session');
      session.technicalLevel = undefined;

      (SpeakerService.getSpeakerSessions as jest.Mock).mockResolvedValue([session]);

      const { getByText, queryByText } = render(
        <SpeakerSessionsList
          speakerId={mockSpeakerId}
          onSessionPress={mockOnSessionPress}
        />
      );

      await waitFor(() => {
        expect(getByText('Test Session')).toBeTruthy();
      });

      expect(queryByText(/Iniciante|Intermediário|Avançado/)).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', async () => {
      const mockSessions = [createMockSession('session-1', 'Test Session')];

      (SpeakerService.getSpeakerSessions as jest.Mock).mockResolvedValue(mockSessions);

      const { getByLabelText } = render(
        <SpeakerSessionsList
          speakerId={mockSpeakerId}
          onSessionPress={mockOnSessionPress}
        />
      );

      await waitFor(() => {
        expect(getByLabelText('Palestra: Test Session')).toBeTruthy();
      });
    });
  });
});