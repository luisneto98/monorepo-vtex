import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Localization from 'expo-localization';

import { useHomeData } from '../../hooks/useHomeData';
import { useEventSettings } from '../../contexts/EventSettingsContext';
import ErrorBoundary from '../../components/error/ErrorBoundary';
import ErrorState from '../../components/error/ErrorState';
import HighlightCard from '../../components/cards/HighlightCard';
import SpeakerCard from '../../components/cards/SpeakerCard';
import QuickLinksSection from '../../components/sections/QuickLinksSection';
import SponsorsButton from '../../components/buttons/SponsorsButton';
import SkeletonCard from '../../components/skeleton/SkeletonCard';
import SkeletonSpeaker from '../../components/skeleton/SkeletonSpeaker';
import SkeletonLoader from '../../components/skeleton/SkeletonLoader';

import { ISession } from '../../../../../packages/shared/src/types/session.types';
import { Speaker } from '../../../../../packages/shared/src/types/speaker.types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { homeData, homeLoading, homeError, refreshHomeData, retryFetch } = useHomeData();
  const { getLocalizedEventName, loading: eventSettingsLoading } = useEventSettings();

  // Get device locale for event name
  const deviceLocale = Localization.getLocales()[0]?.languageCode || 'pt';
  const eventName = getLocalizedEventName(deviceLocale);

  const handleRefresh = useCallback(async () => {
    await refreshHomeData();
  }, [refreshHomeData]);

  const handleSessionPress = useCallback((session: ISession) => {
    // Navigate to session details
    navigation.navigate('SessionDetails', { sessionId: session._id });
  }, [navigation]);

  const handleSpeakerPress = useCallback((speaker: Speaker) => {
    // Navigate to speaker details
    navigation.navigate('SpeakerDetails', { speakerId: speaker._id });
  }, [navigation]);

  const handleSponsorsPress = useCallback(() => {
    // Navigate to sponsors page
    navigation.navigate('Sponsors');
  }, [navigation]);

  const quickLinks = [
    {
      id: 'agenda',
      title: 'Agenda',
      subtitle: 'Veja todas as palestras e workshops',
      icon: '📅',
      onPress: () => navigation.navigate('Agenda'),
    },
    {
      id: 'speakers',
      title: 'Speakers',
      subtitle: 'Conheça nossos palestrantes',
      icon: '👥',
      onPress: () => navigation.navigate('Speakers'),
    },
    {
      id: 'location',
      title: 'Local e Mapas',
      subtitle: 'Encontre salas e espaços',
      icon: '📍',
      onPress: () => navigation.navigate('Location'),
    },
    {
      id: 'networking',
      title: 'Networking',
      subtitle: 'Conecte-se com outros participantes',
      icon: '🤝',
      onPress: () => navigation.navigate('Networking'),
    },
  ];

  const renderHighlightSession = ({ item }: { item: ISession }) => (
    <HighlightCard session={item} onPress={handleSessionPress} />
  );

  const renderSpeaker = ({ item }: { item: Speaker }) => (
    <SpeakerCard speaker={item} onPress={handleSpeakerPress} />
  );

  // Error state
  if (homeError && !homeData) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          error={homeError}
          onRetry={retryFetch}
          title="Erro ao Carregar Dados"
        />
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          testID="home-scroll-view"
          refreshControl={
            <RefreshControl
              refreshing={homeLoading}
              onRefresh={handleRefresh}
              colors={['#0F47AF']}
              tintColor="#0F47AF"
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Bem-vindo ao</Text>
            {eventSettingsLoading || !eventName ? (
              <View style={styles.titleSkeleton} />
            ) : (
              <Text
                style={styles.titleText}
                numberOfLines={2}
                accessibilityRole="header"
                accessibilityLabel={`Evento: ${eventName}`}
              >
                {eventName}
              </Text>
            )}
            <Text style={styles.subtitleText}>
              Fique por dentro de tudo que está acontecendo
            </Text>
          </View>

          {/* Highlight Sessions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Próximas Palestras</Text>
            {homeLoading && !homeData ? (
              <View>
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : (
              <FlatList
                data={homeData?.highlightSessions || []}
                renderItem={renderHighlightSession}
                keyExtractor={(item) => item._id || ''}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            )}
          </View>

          {/* Highlight Speakers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Speakers em Destaque</Text>
            {homeLoading && !homeData ? (
              <View style={styles.speakersContainer}>
                <SkeletonSpeaker />
                <SkeletonSpeaker />
                <SkeletonSpeaker />
                <SkeletonSpeaker />
              </View>
            ) : (
              <FlatList
                data={homeData?.highlightSpeakers || []}
                renderItem={renderSpeaker}
                keyExtractor={(item) => item._id || ''}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.speakersContainer}
              />
            )}
          </View>

          {/* Quick Links */}
          {homeLoading && !homeData ? (
            <SkeletonLoader count={4} variant="quickLinks" />
          ) : (
            <QuickLinksSection links={quickLinks} />
          )}

          {/* Sponsors Button */}
          <SponsorsButton onPress={handleSponsorsPress} />

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F47AF',
    marginBottom: 8,
  },
  titleSkeleton: {
    height: 32,
    width: '80%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  speakersContainer: {
    paddingHorizontal: 8,
    flexDirection: 'row',
  },
  bottomSpacing: {
    height: 20,
  },
});