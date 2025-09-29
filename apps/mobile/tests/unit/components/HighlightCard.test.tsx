import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HighlightCard from '../../../src/components/cards/HighlightCard';
import { ISession } from '../../../../../packages/shared/src/types/session.types';

describe('HighlightCard', () => {
  const mockSession: ISession = {
    _id: '1',
    title: {
      'pt-BR': 'Palestra Incrível',
      en: 'Amazing Talk',
    },
    description: {
      'pt-BR': 'Uma descrição detalhada sobre a palestra incrível',
      en: 'A detailed description about the amazing talk',
    },
    startTime: new Date('2024-01-01T10:00:00Z'),
    endTime: new Date('2024-01-01T11:00:00Z'),
    stage: 'principal',
    speakerIds: ['speaker1'],
    tags: ['tech', 'innovation', 'future'],
    isHighlight: true,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render session information correctly', () => {
    const { getByText } = render(
      <HighlightCard session={mockSession} onPress={mockOnPress} />
    );

    expect(getByText('Palestra Incrível')).toBeTruthy();
    expect(getByText('Uma descrição detalhada sobre a palestra incrível')).toBeTruthy();
    expect(getByText('PRINCIPAL')).toBeTruthy();
    expect(getByText('tech')).toBeTruthy();
    expect(getByText('innovation')).toBeTruthy();
  });

  it('should format time correctly', () => {
    const { getByText } = render(
      <HighlightCard session={mockSession} onPress={mockOnPress} />
    );

    // Time should be formatted as HH:mm - HH:mm
    expect(getByText(/\d{2}:\d{2} - \d{2}:\d{2}/)).toBeTruthy();
  });

  it('should format date correctly', () => {
    const { getByText } = render(
      <HighlightCard session={mockSession} onPress={mockOnPress} />
    );

    // Date should be formatted as dd/mm
    expect(getByText(/\d{2}\/\d{2}/)).toBeTruthy();
  });

  it('should display only first 2 tags and show count for remaining', () => {
    const { getByText, queryByText } = render(
      <HighlightCard session={mockSession} onPress={mockOnPress} />
    );

    expect(getByText('tech')).toBeTruthy();
    expect(getByText('innovation')).toBeTruthy();
    expect(queryByText('future')).toBeFalsy();
    expect(getByText('+1')).toBeTruthy();
  });

  it('should not show +count when there are 2 or fewer tags', () => {
    const sessionWithFewTags = {
      ...mockSession,
      tags: ['tech', 'innovation'],
    };

    const { queryByText } = render(
      <HighlightCard session={sessionWithFewTags} onPress={mockOnPress} />
    );

    expect(queryByText(/^\+\d+$/)).toBeFalsy();
  });

  it('should handle empty tags array', () => {
    const sessionWithoutTags = {
      ...mockSession,
      tags: [],
    };

    const { queryByTestId } = render(
      <HighlightCard session={sessionWithoutTags} onPress={mockOnPress} />
    );

    // Tags container should not be rendered when there are no tags
    expect(queryByTestId('tags-container')).toBeFalsy();
  });

  it('should call onPress when card is pressed', () => {
    const { getByText } = render(
      <HighlightCard session={mockSession} onPress={mockOnPress} />
    );

    fireEvent.press(getByText('Palestra Incrível'));

    expect(mockOnPress).toHaveBeenCalledTimes(1);
    expect(mockOnPress).toHaveBeenCalledWith(mockSession);
  });

  it('should truncate title to 2 lines', () => {
    const sessionWithLongTitle = {
      ...mockSession,
      title: {
        'pt-BR': 'Este é um título muito longo que deveria ser truncado após duas linhas para manter o layout consistente',
        en: 'This is a very long title that should be truncated after two lines to maintain consistent layout',
      },
    };

    const { getByText } = render(
      <HighlightCard session={sessionWithLongTitle} onPress={mockOnPress} />
    );

    const titleElement = getByText(/Este é um título muito longo/);
    expect(titleElement.props.numberOfLines).toBe(2);
  });

  it('should truncate description to 3 lines', () => {
    const { getByText } = render(
      <HighlightCard session={mockSession} onPress={mockOnPress} />
    );

    const descriptionElement = getByText('Uma descrição detalhada sobre a palestra incrível');
    expect(descriptionElement.props.numberOfLines).toBe(3);
  });

  it('should render with proper accessibility properties', () => {
    const { getByLabelText } = render(
      <HighlightCard session={mockSession} onPress={mockOnPress} />
    );

    // The TouchableOpacity should be accessible
    const cardElement = getByLabelText('Palestra Incrível');
    expect(cardElement).toBeTruthy();
  });
});