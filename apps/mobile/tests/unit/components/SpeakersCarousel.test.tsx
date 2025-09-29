import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SpeakersCarousel from '../../../src/components/speakers/SpeakersCarousel';
import { Speaker } from '@monorepo-vtex/shared';

// Mock LazyImage component
jest.mock('../../../src/components/common/LazyImage', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { View, Text } = require('react-native');

  return {
    LazyImage: ({ source, containerStyle, accessibilityLabel }: {
      source: { uri: string };
      containerStyle: unknown;
      accessibilityLabel?: string;
    }) => (
      <View style={containerStyle} accessibilityLabel={accessibilityLabel}>
        <Text>Mock Image: {source.uri}</Text>
      </View>
    ),
  };
});

describe('SpeakersCarousel', () => {
  const mockOnSpeakerPress = jest.fn();

  const createMockSpeaker = (id: string, name: string, isHighlight = false): Speaker => ({
    _id: id,
    name,
    bio: { 'pt-BR': `Bio de ${name}`, en: `Bio of ${name}` },
    photoUrl: `https://example.com/${id}.jpg`,
    company: 'Tech Corp',
    position: { 'pt-BR': 'Desenvolvedor', en: 'Developer' },
    socialLinks: {},
    priority: 1,
    isHighlight,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should return null when speakers array is empty', () => {
      const { container } = render(
        <SpeakersCarousel speakers={[]} onSpeakerPress={mockOnSpeakerPress} />
      );

      expect(container.children.length).toBe(0);
    });
  });

  describe('Single Speaker', () => {
    it('should render a single speaker card without carousel', () => {
      const speakers = [createMockSpeaker('speaker-1', 'John Doe')];

      const { getByText } = render(
        <SpeakersCarousel speakers={speakers} onSpeakerPress={mockOnSpeakerPress} />
      );

      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Tech Corp')).toBeTruthy();
      expect(getByText('Desenvolvedor')).toBeTruthy();
    });

    it('should call onSpeakerPress when single speaker card is pressed', () => {
      const speakers = [createMockSpeaker('speaker-1', 'John Doe')];

      const { getByText } = render(
        <SpeakersCarousel speakers={speakers} onSpeakerPress={mockOnSpeakerPress} />
      );

      fireEvent.press(getByText('John Doe'));

      expect(mockOnSpeakerPress).toHaveBeenCalledTimes(1);
      expect(mockOnSpeakerPress).toHaveBeenCalledWith(speakers[0]);
    });

    it('should have proper accessibility label for single speaker', () => {
      const speakers = [createMockSpeaker('speaker-1', 'John Doe')];

      const { getByLabelText } = render(
        <SpeakersCarousel speakers={speakers} onSpeakerPress={mockOnSpeakerPress} />
      );

      expect(getByLabelText('Ver perfil de John Doe')).toBeTruthy();
    });
  });

  describe('Multiple Speakers Carousel', () => {
    const speakers = [
      createMockSpeaker('speaker-1', 'John Doe'),
      createMockSpeaker('speaker-2', 'Jane Smith', true),
      createMockSpeaker('speaker-3', 'Bob Johnson'),
    ];

    it('should render all speakers in the carousel', () => {
      const { getByText } = render(
        <SpeakersCarousel speakers={speakers} onSpeakerPress={mockOnSpeakerPress} />
      );

      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Jane Smith')).toBeTruthy();
      expect(getByText('Bob Johnson')).toBeTruthy();
    });

    it('should render pagination dots for multiple speakers', () => {
      const { getAllByLabelText } = render(
        <SpeakersCarousel speakers={speakers} onSpeakerPress={mockOnSpeakerPress} />
      );

      const dots = getAllByLabelText(/Ir para palestrante/);
      expect(dots).toHaveLength(3);
    });

    it('should call onSpeakerPress when a speaker card is pressed', () => {
      const { getByText } = render(
        <SpeakersCarousel speakers={speakers} onSpeakerPress={mockOnSpeakerPress} />
      );

      fireEvent.press(getByText('Jane Smith'));

      expect(mockOnSpeakerPress).toHaveBeenCalledTimes(1);
      expect(mockOnSpeakerPress).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Jane Smith' })
      );
    });

    it('should have proper accessibility labels for all speakers', () => {
      const { getByLabelText } = render(
        <SpeakersCarousel speakers={speakers} onSpeakerPress={mockOnSpeakerPress} />
      );

      expect(getByLabelText('Ver perfil de John Doe')).toBeTruthy();
      expect(getByLabelText('Ver perfil de Jane Smith')).toBeTruthy();
      expect(getByLabelText('Ver perfil de Bob Johnson')).toBeTruthy();
    });
  });

  describe('Highlight Badge', () => {
    it('should show highlight badge for highlighted speakers', () => {
      const speakers = [
        createMockSpeaker('speaker-1', 'John Doe'),
        createMockSpeaker('speaker-2', 'Jane Smith', true),
      ];

      const { getAllByText } = render(
        <SpeakersCarousel speakers={speakers} onSpeakerPress={mockOnSpeakerPress} />
      );

      const stars = getAllByText('⭐');
      // Only Jane Smith should have a star
      expect(stars).toHaveLength(1);
    });

    it('should not show highlight badge for non-highlighted speakers', () => {
      const speakers = [createMockSpeaker('speaker-1', 'John Doe', false)];

      const { queryByText } = render(
        <SpeakersCarousel speakers={speakers} onSpeakerPress={mockOnSpeakerPress} />
      );

      expect(queryByText('⭐')).toBeNull();
    });
  });

  describe('Images', () => {
    it('should render speaker photos with correct URIs', () => {
      const speakers = [
        createMockSpeaker('speaker-1', 'John Doe'),
        createMockSpeaker('speaker-2', 'Jane Smith'),
      ];

      const { getByText } = render(
        <SpeakersCarousel speakers={speakers} onSpeakerPress={mockOnSpeakerPress} />
      );

      expect(getByText('Mock Image: https://example.com/speaker-1.jpg')).toBeTruthy();
      expect(getByText('Mock Image: https://example.com/speaker-2.jpg')).toBeTruthy();
    });
  });

  describe('Speaker Information Display', () => {
    it('should display all speaker information correctly', () => {
      const speakers = [createMockSpeaker('speaker-1', 'John Doe')];

      const { getByText } = render(
        <SpeakersCarousel speakers={speakers} onSpeakerPress={mockOnSpeakerPress} />
      );

      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Tech Corp')).toBeTruthy();
      expect(getByText('Desenvolvedor')).toBeTruthy();
    });

    it('should use Portuguese localization for position', () => {
      const speaker = createMockSpeaker('speaker-1', 'John Doe');
      speaker.position = { 'pt-BR': 'Engenheiro de Software', en: 'Software Engineer' };

      const { getByText, queryByText } = render(
        <SpeakersCarousel speakers={[speaker]} onSpeakerPress={mockOnSpeakerPress} />
      );

      expect(getByText('Engenheiro de Software')).toBeTruthy();
      expect(queryByText('Software Engineer')).toBeNull();
    });
  });
});