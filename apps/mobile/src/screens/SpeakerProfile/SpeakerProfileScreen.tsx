import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Speaker } from '@monorepo-vtex/shared';
import { LazyImage } from '../../components/common/LazyImage';
import ErrorState from '../../components/error/ErrorState';
import { SkeletonSpeakerProfile } from '../../components/skeleton/SkeletonSpeakerProfile';
import SpeakerService from '../../services/SpeakerService';
import SocialLinksBar from '../../components/social/SocialLinksBar';
import SpeakerSessionsList from '../../components/sessions/SpeakerSessionsList';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  SpeakerProfile: { speakerId: string; sessionId?: string };
  SessionDetails: { sessionId: string };
};

type SpeakerProfileScreenRouteProp = RouteProp<RootStackParamList, 'SpeakerProfile'>;
type SpeakerProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SpeakerProfileScreen: React.FC = () => {
  const route = useRoute<SpeakerProfileScreenRouteProp>();
  const navigation = useNavigation<SpeakerProfileScreenNavigationProp>();
  const { speakerId, sessionId } = route.params;

  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);

  const loadSpeakerProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await SpeakerService.getSpeakerById(speakerId);
      setSpeaker(data);
    } catch (err: any) {
      console.error('Error loading speaker profile:', err);
      setError(err.message || 'Não foi possível carregar o perfil do palestrante');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpeakerProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakerId]);

  const toggleBio = () => {
    setBioExpanded(!bioExpanded);
  };

  if (loading) {
    return <SkeletonSpeakerProfile />;
  }

  if (error || !speaker) {
    return (
      <ErrorState
        error={error || 'Palestrante não encontrado'}
        onRetry={loadSpeakerProfile}
      />
    );
  }

  const bio = speaker.bio['pt-BR'];
  const isBioLong = bio.length > 200;
  const displayBio = bioExpanded || !isBioLong ? bio : `${bio.substring(0, 200)}...`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header with Large Photo */}
      <View style={styles.header}>
        <LazyImage
          source={{ uri: speaker.photoUrl }}
          containerStyle={styles.photoContainer}
          imageStyle={styles.photo}
          showLoadingIndicator
        />
        {speaker.isHighlight && (
          <View style={styles.highlightBadge}>
            <Text style={styles.highlightText}>⭐ Destaque</Text>
          </View>
        )}
      </View>

      {/* Name, Company, and Position */}
      <View style={styles.infoSection}>
        <Text style={styles.name}>{speaker.name}</Text>
        <Text style={styles.company}>{speaker.company}</Text>
        <Text style={styles.position}>{speaker.position['pt-BR']}</Text>
      </View>

      {/* Social Links */}
      <SocialLinksBar
        socialLinks={speaker.socialLinks}
        speakerName={speaker.name}
      />

      {/* Biography */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Biografia</Text>
        <Text style={styles.bioText}>{displayBio}</Text>
        {isBioLong && (
          <TouchableOpacity
            onPress={toggleBio}
            style={styles.expandButton}
            accessibilityLabel={bioExpanded ? 'Mostrar menos' : 'Mostrar mais'}
            accessibilityRole="button"
          >
            <Text style={styles.expandButtonText}>
              {bioExpanded ? 'Mostrar menos' : 'Ler mais'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Other Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Outras Palestras</Text>
        <SpeakerSessionsList
          speakerId={speakerId}
          currentSessionId={sessionId}
          onSessionPress={(session) => {
            navigation.navigate('SessionDetails', { sessionId: session._id });
          }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  header: {
    position: 'relative',
    width: '100%',
    height: width * 0.6,
    backgroundColor: '#F5F5F5',
  },
  photoContainer: {
    width: '100%',
    height: '100%',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  highlightBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  highlightText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F47AF',
    marginBottom: 8,
  },
  company: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  position: {
    fontSize: 16,
    color: '#666666',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F47AF',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  expandButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  expandButtonText: {
    fontSize: 16,
    color: '#0F47AF',
    fontWeight: '600',
  },
});

export default SpeakerProfileScreen;