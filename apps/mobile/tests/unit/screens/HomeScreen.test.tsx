import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../../../src/screens/Home/HomeScreen';
import { useHomeData } from '../../../src/hooks/useHomeData';

// Mock the navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock the useHomeData hook
jest.mock('../../../src/hooks/useHomeData');
const mockUseHomeData = useHomeData as jest.MockedFunction<typeof useHomeData>;

// Mock the components to avoid deep rendering
jest.mock('../../../src/components/cards/HighlightCard', () => {
  return function HighlightCard({ session, onPress }: any) {
    return (
      <div testID="highlight-card" onClick={() => onPress(session)}>
        {session.title['pt-BR']}
      </div>
    );
  };
});

jest.mock('../../../src/components/cards/SpeakerCard', () => {
  return function SpeakerCard({ speaker, onPress }: any) {
    return (
      <div testID="speaker-card" onClick={() => onPress(speaker)}>
        {speaker.name}
      </div>
    );
  };
});

jest.mock('../../../src/components/skeleton/SkeletonCard', () => {
  return function SkeletonCard() {
    return <div testID="skeleton-card">Loading...</div>;
  };
});

jest.mock('../../../src/components/skeleton/SkeletonSpeaker', () => {
  return function SkeletonSpeaker() {
    return <div testID="skeleton-speaker">Loading...</div>;
  };
});

jest.mock('../../../src/components/skeleton/SkeletonLoader', () => {
  return function SkeletonLoader() {
    return <div testID="skeleton-loader">Loading...</div>;
  };
});

describe('HomeScreen', () => {
  const mockHomeData = {
    highlightSessions: [
      {
        _id: '1',
        title: { 'pt-BR': 'Palestra 1', en: 'Talk 1' },
        description: { 'pt-BR': 'Descrição 1', en: 'Description 1' },
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        stage: 'principal',
        speakerIds: ['speaker1'],
        tags: ['tech'],
        isHighlight: true,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    highlightSpeakers: [
      {
        _id: 'speaker1',
        name: 'João Silva',
        bio: { 'pt-BR': 'Bio', en: 'Bio' },
        photoUrl: 'https://example.com/photo.jpg',
        company: 'VTEX',
        position: { 'pt-BR': 'Desenvolvedor', en: 'Developer' },
        socialLinks: {},
        priority: 1,
        isHighlight: true,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    upcomingSessions: [],
  };

  const defaultMockReturn = {
    homeData: mockHomeData,
    homeLoading: false,
    homeError: null,
    refreshHomeData: jest.fn(),
    retryFetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHomeData.mockReturnValue(defaultMockReturn);
  });

  const renderWithNavigation = (component: React.ReactElement) => {
    return render(
      <NavigationContainer>
        {component}
      </NavigationContainer>
    );
  };

  it('should render home screen content correctly', () => {
    const { getByText } = renderWithNavigation(<HomeScreen />);

    expect(getByText('Bem-vindo ao')).toBeTruthy();
    expect(getByText('VTEX Events')).toBeTruthy();
    expect(getByText('Fique por dentro de tudo que está acontecendo')).toBeTruthy();
    expect(getByText('Próximas Palestras')).toBeTruthy();
    expect(getByText('Speakers em Destaque')).toBeTruthy();
    expect(getByText('Acesso Rápido')).toBeTruthy();
  });

  it('should show loading skeleton when homeLoading is true and no data', () => {
    mockUseHomeData.mockReturnValue({
      ...defaultMockReturn,
      homeData: null,
      homeLoading: true,
    });

    const { getAllByTestId } = renderWithNavigation(<HomeScreen />);

    expect(getAllByTestId('skeleton-card')).toHaveLength(2);
    expect(getAllByTestId('skeleton-speaker')).toHaveLength(4);
    expect(getAllByTestId('skeleton-loader')).toHaveLength(1);
  });

  it('should show error state when there is an error and no data', () => {
    mockUseHomeData.mockReturnValue({
      ...defaultMockReturn,
      homeData: null,
      homeError: 'Network error',
    });

    const { getByText } = renderWithNavigation(<HomeScreen />);

    expect(getByText('Erro ao Carregar Dados')).toBeTruthy();
    expect(getByText(/Network error/)).toBeTruthy();
  });

  it('should handle pull to refresh', async () => {
    const mockRefreshHomeData = jest.fn();
    mockUseHomeData.mockReturnValue({
      ...defaultMockReturn,
      refreshHomeData: mockRefreshHomeData,
    });

    const { getByTestId } = renderWithNavigation(<HomeScreen />);

    const scrollView = getByTestId('home-scroll-view');
    fireEvent(scrollView, 'onRefresh');

    await waitFor(() => {
      expect(mockRefreshHomeData).toHaveBeenCalledTimes(1);
    });
  });

  it('should navigate to session details when session card is pressed', async () => {
    const { getByTestId } = renderWithNavigation(<HomeScreen />);

    const highlightCard = getByTestId('highlight-card');
    fireEvent.press(highlightCard);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('SessionDetails', {
        sessionId: '1',
      });
    });
  });

  it('should navigate to speaker details when speaker card is pressed', async () => {
    const { getByTestId } = renderWithNavigation(<HomeScreen />);

    const speakerCard = getByTestId('speaker-card');
    fireEvent.press(speakerCard);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('SpeakerDetails', {
        speakerId: 'speaker1',
      });
    });
  });

  it('should navigate to sponsors when sponsors button is pressed', async () => {
    const { getByText } = renderWithNavigation(<HomeScreen />);

    const sponsorsButton = getByText('Patrocinadores');
    fireEvent.press(sponsorsButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Sponsors');
    });
  });

  it('should navigate to agenda when quick link is pressed', async () => {
    const { getByText } = renderWithNavigation(<HomeScreen />);

    const agendaLink = getByText('Agenda');
    fireEvent.press(agendaLink);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Agenda');
    });
  });

  it('should handle error retry', async () => {
    const mockRetryFetch = jest.fn();
    mockUseHomeData.mockReturnValue({
      ...defaultMockReturn,
      homeData: null,
      homeError: 'Network error',
      retryFetch: mockRetryFetch,
    });

    const { getByText } = renderWithNavigation(<HomeScreen />);

    const retryButton = getByText('Tentar Novamente');
    fireEvent.press(retryButton);

    await waitFor(() => {
      expect(mockRetryFetch).toHaveBeenCalledTimes(1);
    });
  });

  it('should show data when available', () => {
    const { getByTestId } = renderWithNavigation(<HomeScreen />);

    expect(getByTestId('highlight-card')).toBeTruthy();
    expect(getByTestId('speaker-card')).toBeTruthy();
  });
});