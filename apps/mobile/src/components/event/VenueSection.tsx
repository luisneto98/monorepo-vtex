import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { VenueInfo, MapCoordinates } from '@monorepo-vtex/shared/types/event-settings';
import { EventSettingsService } from '../../services/EventSettingsService';

interface VenueSectionProps {
  venue: VenueInfo;
  mapCoordinates: MapCoordinates;
}

export const VenueSection: React.FC<VenueSectionProps> = ({ venue, mapCoordinates }) => {
  const handleOpenMaps = () => {
    // Validate coordinates before opening
    if (!EventSettingsService.validateCoordinates(mapCoordinates)) {
      console.error('Invalid coordinates');
      return;
    }

    const { latitude, longitude } = mapCoordinates;
    const label = encodeURIComponent(venue.name);

    let url: string;

    if (Platform.OS === 'ios') {
      url = `http://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    }

    Linking.openURL(url).catch((err) => {
      console.error('Error opening maps:', err);
    });
  };

  const fullAddress = [
    venue.address,
    venue.complement,
    venue.city,
    venue.state,
    venue.zipCode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.title}>Local do Evento</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.venueName}>{venue.name}</Text>
        <Text style={styles.address}>{fullAddress}</Text>
        <TouchableOpacity
          style={styles.mapsButton}
          onPress={handleOpenMaps}
          accessibilityRole="button"
          accessibilityLabel="Abrir localização no aplicativo de mapas"
          accessibilityHint="Abre o aplicativo de mapas com a localização do evento"
        >
          <Text style={styles.mapsButtonIcon}>🗺️</Text>
          <Text style={styles.mapsButtonText}>Abrir no Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    paddingLeft: 32,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F47AF',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F47AF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  mapsButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  mapsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});