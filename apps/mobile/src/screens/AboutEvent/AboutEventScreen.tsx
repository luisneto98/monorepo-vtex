import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Localization from 'expo-localization';

import { useEventSettings } from '../../contexts/EventSettingsContext';
import ErrorState from '../../components/error/ErrorState';
import { EventDatesSection } from '../../components/event/EventDatesSection';
import { VenueSection } from '../../components/event/VenueSection';
import { ContactSection } from '../../components/event/ContactSection';
import { SocialMediaSection } from '../../components/event/SocialMediaSection';

export default function AboutEventScreen() {
  const { eventSettings, loading, error, refresh, getLocalizedEventName } = useEventSettings();

  // Get device locale for event name
  const deviceLocale = Localization.getLocales()[0]?.languageCode || 'pt';
  const eventName = getLocalizedEventName(deviceLocale);

  const handleRetry = async () => {
    await refresh();
  };

  // Loading state
  if (loading && !eventSettings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F47AF" />
          <Text style={styles.loadingText}>Carregando informações do evento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !eventSettings) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          error={{ message: error.message }}
          onRetry={handleRetry}
          title="Erro ao Carregar Informações"
        />
      </SafeAreaView>
    );
  }

  // No data state
  if (!eventSettings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>ℹ️</Text>
          <Text style={styles.emptyTitle}>Nenhuma informação disponível</Text>
          <Text style={styles.emptyText}>
            As informações do evento ainda não foram configuradas.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            colors={['#0F47AF']}
            tintColor="#0F47AF"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={styles.eventName}
            accessibilityRole="header"
            accessibilityLabel={`Evento: ${eventName}`}
          >
            {eventName}
          </Text>
        </View>

        {/* Event Dates Section */}
        <EventDatesSection
          startDate={eventSettings.startDate}
          endDate={eventSettings.endDate}
        />

        {/* Venue Section */}
        <VenueSection venue={eventSettings.venue} mapCoordinates={eventSettings.mapCoordinates} />

        {/* Contact Section */}
        <ContactSection contact={eventSettings.contact} />

        {/* Social Media Section */}
        <SocialMediaSection socialMedia={eventSettings.socialMedia} />

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
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
    padding: 16,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F47AF',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});