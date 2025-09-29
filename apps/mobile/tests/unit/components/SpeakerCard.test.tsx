import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SpeakerCard from '../../../src/components/cards/SpeakerCard';
import { Speaker } from '../../../../../packages/shared/src/types/speaker.types';

describe('SpeakerCard', () => {
  const mockSpeaker: Speaker = {
    _id: 'speaker1',
    name: 'João Silva',
    bio: {
      'pt-BR': 'Desenvolvedor especialista em React Native com mais de 5 anos de experiência',
      en: 'React Native developer specialist with over 5 years of experience',
    },
    photoUrl: 'https://example.com/photo.jpg',
    company: 'VTEX',
    position: {
      'pt-BR': 'Desenvolvedor Senior',
      en: 'Senior Developer',
    },
    socialLinks: {
      linkedin: 'https://linkedin.com/in/joaosilva',
      twitter: 'https://twitter.com/joaosilva',
    },
    priority: 1,
    isHighlight: true,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render speaker information correctly', () => {
    const { getByText } = render(
      <SpeakerCard speaker={mockSpeaker} onPress={mockOnPress} />
    );

    expect(getByText('João Silva')).toBeTruthy();
    expect(getByText('Desenvolvedor Senior')).toBeTruthy();
    expect(getByText('VTEX')).toBeTruthy();
    expect(getByText(/Desenvolvedor especialista em React Native/)).toBeTruthy();
  });

  it('should display speaker photo with correct source', () => {
    const { getByTestId } = render(
      <SpeakerCard speaker={mockSpeaker} onPress={mockOnPress} />
    );

    const photoElement = getByTestId('speaker-photo');
    expect(photoElement.props.source).toEqual({ uri: 'https://example.com/photo.jpg' });
  });

  it('should call onPress when card is pressed', () => {
    const { getByText } = render(
      <SpeakerCard speaker={mockSpeaker} onPress={mockOnPress} />
    );

    fireEvent.press(getByText('João Silva'));

    expect(mockOnPress).toHaveBeenCalledTimes(1);
    expect(mockOnPress).toHaveBeenCalledWith(mockSpeaker);
  });

  it('should truncate name to 2 lines', () => {
    const speakerWithLongName = {
      ...mockSpeaker,
      name: 'João Pedro da Silva Santos Junior dos Reis',
    };

    const { getByText } = render(
      <SpeakerCard speaker={speakerWithLongName} onPress={mockOnPress} />
    );

    const nameElement = getByText('João Pedro da Silva Santos Junior dos Reis');
    expect(nameElement.props.numberOfLines).toBe(2);
  });

  it('should truncate position to 1 line', () => {
    const speakerWithLongPosition = {
      ...mockSpeaker,
      position: {
        'pt-BR': 'Desenvolvedor Senior Full Stack especialista em React Native e Node.js',
        en: 'Senior Full Stack Developer specialist in React Native and Node.js',
      },
    };

    const { getByText } = render(
      <SpeakerCard speaker={speakerWithLongPosition} onPress={mockOnPress} />
    );

    const positionElement = getByText(/Desenvolvedor Senior Full Stack/);
    expect(positionElement.props.numberOfLines).toBe(1);
  });

  it('should truncate company to 1 line', () => {
    const speakerWithLongCompany = {
      ...mockSpeaker,
      company: 'VTEX - The Complete Commerce Platform Company',
    };

    const { getByText } = render(
      <SpeakerCard speaker={speakerWithLongCompany} onPress={mockOnPress} />
    );

    const companyElement = getByText('VTEX - The Complete Commerce Platform Company');
    expect(companyElement.props.numberOfLines).toBe(1);
  });

  it('should truncate bio to 3 lines', () => {
    const { getByText } = render(
      <SpeakerCard speaker={mockSpeaker} onPress={mockOnPress} />
    );

    const bioElement = getByText(/Desenvolvedor especialista em React Native/);
    expect(bioElement.props.numberOfLines).toBe(3);
  });

  it('should handle missing photo gracefully', () => {
    const speakerWithoutPhoto = {
      ...mockSpeaker,
      photoUrl: '',
    };

    const { getByTestId } = render(
      <SpeakerCard speaker={speakerWithoutPhoto} onPress={mockOnPress} />
    );

    const photoElement = getByTestId('speaker-photo');
    expect(photoElement.props.source).toEqual({ uri: '' });
  });

  it('should render card with correct fixed width', () => {
    const { getByTestId } = render(
      <SpeakerCard speaker={mockSpeaker} onPress={mockOnPress} />
    );

    const cardElement = getByTestId('speaker-card');
    expect(cardElement.props.style).toEqual(
      expect.objectContaining({
        width: 160,
      })
    );
  });

  it('should render with proper accessibility properties', () => {
    const { getByLabelText } = render(
      <SpeakerCard speaker={mockSpeaker} onPress={mockOnPress} />
    );

    // The TouchableOpacity should be accessible
    const cardElement = getByLabelText('João Silva');
    expect(cardElement).toBeTruthy();
  });

  it('should center align all text content', () => {
    const { getByText } = render(
      <SpeakerCard speaker={mockSpeaker} onPress={mockOnPress} />
    );

    const nameElement = getByText('João Silva');
    const positionElement = getByText('Desenvolvedor Senior');
    const companyElement = getByText('VTEX');
    const bioElement = getByText(/Desenvolvedor especialista em React Native/);

    expect(nameElement.props.style).toEqual(
      expect.objectContaining({
        textAlign: 'center',
      })
    );
    expect(positionElement.props.style).toEqual(
      expect.objectContaining({
        textAlign: 'center',
      })
    );
    expect(companyElement.props.style).toEqual(
      expect.objectContaining({
        textAlign: 'center',
      })
    );
    expect(bioElement.props.style).toEqual(
      expect.objectContaining({
        textAlign: 'center',
      })
    );
  });
});