import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Speaker } from '../../../../../packages/shared/src/types/speaker.types';
import { LazyImage } from '../common/LazyImage';

interface SpeakerCardProps {
  speaker: Speaker;
  onPress: (speaker: Speaker) => void;
}

export default function SpeakerCard({ speaker, onPress }: SpeakerCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(speaker)}
      activeOpacity={0.7}
      accessibilityLabel={speaker.name}
      testID="speaker-card"
    >
      <View style={styles.imageContainer}>
        <LazyImage
          source={{ uri: speaker.photoUrl }}
          thumbnailSource={{
            uri: speaker.photoUrl + '?w=20&q=10'
          }}
          imageStyle={styles.photo}
          containerStyle={styles.photoContainer}
          resizeMode="cover"
          testID="speaker-photo"
          fadeDuration={500}
          showLoadingIndicator={true}
          loadingIndicatorColor="#0F47AF"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {speaker.name}
        </Text>

        <Text style={styles.position} numberOfLines={1}>
          {speaker.position['pt-BR']}
        </Text>

        <Text style={styles.company} numberOfLines={1}>
          {speaker.company}
        </Text>

        <Text style={styles.bio} numberOfLines={3}>
          {speaker.bio['pt-BR']}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 8,
    width: 160,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  photoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  position: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F47AF',
    marginBottom: 2,
    textAlign: 'center',
  },
  company: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  bio: {
    fontSize: 11,
    color: '#666666',
    lineHeight: 14,
    textAlign: 'center',
  },
});