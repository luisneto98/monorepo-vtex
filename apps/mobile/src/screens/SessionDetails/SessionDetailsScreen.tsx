import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ISession, Speaker } from '@monorepo-vtex/shared';
import { LazyImage } from '../../components/common/LazyImage';
import ErrorState from '../../components/error/ErrorState';
import { SkeletonSessionDetails } from '../../components/skeleton/SkeletonSessionDetails';
import SpeakersCarousel from '../../components/speakers/SpeakersCarousel';
import SessionDetailsService from '../../services/SessionDetailsService';
import { formatDate, formatTime, calculateDuration } from '../../utils/dateUtils';

type RootStackParamList = {
  SessionDetails: { sessionId: string };
  SpeakerProfile: { speakerId: string; sessionId?: string };
};

type SessionDetailsScreenRouteProp = RouteProp<RootStackParamList, 'SessionDetails'>;
type SessionDetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SessionDetailsScreen: React.FC = () => {
  const route = useRoute<SessionDetailsScreenRouteProp>();
  const navigation = useNavigation<SessionDetailsScreenNavigationProp>();
  const { sessionId } = route.params;

  const [session, setSession] = useState<ISession | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessionDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await SessionDetailsService.getSessionById(sessionId);
      setSession(data.session);
      setSpeakers(data.speakers);
    } catch (err: any) {
      console.error('Error loading session details:', err);
      setError(err.message || 'Não foi possível carregar os detalhes da sessão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessionDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const sanitizeSessionId = (id: string): string => {
    // Only allow alphanumeric characters and hyphens for MongoDB ObjectId format
    return id.replace(/[^a-zA-Z0-9-]/g, '');
  };

  const handleShare = async () => {
    if (!session) return;

    const sanitizedId = sanitizeSessionId(session._id);
    const speakerNames = speakers.map(s => s.name).join(', ');
    const message = `${session.title['pt-BR']}\n` +
                   `Palestrantes: ${speakerNames}\n` +
                   `${formatDate(session.startTime)} às ${formatTime(session.startTime)}\n` +
                   `vtexevents://session/${sanitizedId}`;

    try {
      await Share.share({
        message,
        title: session.title['pt-BR'],
      });
    } catch (error: any) {
      console.error('Share failed:', error);
    }
  };

  const handleSpeakerPress = (speakerId: string) => {
    navigation.navigate('SpeakerProfile', { speakerId, sessionId: session?._id });
  };

  if (loading) {
    return <SkeletonSessionDetails />;
  }

  if (error || !session) {
    return (
      <ErrorState
        error={error || 'Sessão não encontrada'}
        onRetry={() => loadSessionDetails()}
      />
    );
  }

  const duration = calculateDuration(session.startTime, session.endTime);
  const availableSpots = session.capacity && session.registeredCount
    ? session.capacity - session.registeredCount
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header with Share Button */}
      <View style={styles.header}>
        <Text style={styles.title}>{session.title['pt-BR']}</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          accessibilityLabel="Compartilhar sessão"
          accessibilityRole="button"
        >
          <Text style={styles.shareIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      {/* Time Information */}
      <View style={styles.section}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📅 Data:</Text>
          <Text style={styles.infoValue}>{formatDate(session.startTime)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🕐 Horário:</Text>
          <Text style={styles.infoValue}>
            {formatTime(session.startTime)} - {formatTime(session.endTime)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>⏱️ Duração:</Text>
          <Text style={styles.infoValue}>{duration}</Text>
        </View>
      </View>

      {/* Stage */}
      <View style={styles.section}>
        <View style={styles.stageBadge}>
          <Text style={styles.stageText}>{session.stage}</Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descrição</Text>
        <Text style={styles.description}>{session.description['pt-BR']}</Text>
      </View>

      {/* Technical Level & Language */}
      {(session.technicalLevel || session.language) && (
        <View style={styles.section}>
          {session.technicalLevel && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📊 Nível:</Text>
              <Text style={styles.infoValue}>
                {session.technicalLevel === 'beginner' ? 'Iniciante' :
                 session.technicalLevel === 'intermediate' ? 'Intermediário' : 'Avançado'}
              </Text>
            </View>
          )}
          {session.language && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🌐 Idioma:</Text>
              <Text style={styles.infoValue}>
                {session.language === 'pt-BR' ? 'Português' :
                 session.language === 'en' ? 'Inglês' : 'Espanhol'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Materials/Resources */}
      {session.materials && session.materials.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materiais</Text>
          {session.materials.map((material, index) => (
            <View key={index} style={styles.materialItem}>
              <Text style={styles.materialType}>
                {material.type === 'pdf' ? '📄' : material.type === 'video' ? '🎥' : '🔗'}
              </Text>
              <Text style={styles.materialTitle}>{material.title}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Capacity */}
      {session.capacity && (
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>👥 Capacidade:</Text>
            <Text style={styles.infoValue}>{session.capacity} pessoas</Text>
          </View>
          {availableSpots !== null && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>✅ Vagas disponíveis:</Text>
              <Text style={[
                styles.infoValue,
                availableSpots === 0 && styles.noSpotsText
              ]}>
                {availableSpots > 0 ? `${availableSpots} vagas` : 'Esgotado'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Speakers */}
      {speakers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {speakers.length === 1 ? 'Palestrante' : 'Palestrantes'}
          </Text>
          {speakers.length === 1 ? (
            <TouchableOpacity
              style={styles.speakerCard}
              onPress={() => handleSpeakerPress(speakers[0]._id)}
              accessibilityLabel={`Ver perfil de ${speakers[0].name}`}
              accessibilityRole="button"
            >
              <LazyImage
                source={{ uri: speakers[0].photoUrl }}
                containerStyle={styles.speakerPhotoContainer}
                imageStyle={styles.speakerPhoto}
                showLoadingIndicator
              />
              <View style={styles.speakerInfo}>
                <Text style={styles.speakerName}>{speakers[0].name}</Text>
                <Text style={styles.speakerCompany}>{speakers[0].company}</Text>
                <Text style={styles.speakerPosition}>{speakers[0].position['pt-BR']}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ) : (
            <SpeakersCarousel
              speakers={speakers}
              onSpeakerPress={(speaker) => handleSpeakerPress(speaker._id)}
            />
          )}
        </View>
      )}

      {/* Floating Share Button */}
      <TouchableOpacity
        style={styles.floatingShareButton}
        onPress={handleShare}
        accessibilityLabel="Compartilhar sessão"
        accessibilityRole="button"
      >
        <Text style={styles.floatingShareIcon}>📤</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingBottom: 100,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F47AF',
    marginRight: 12,
  },
  shareButton: {
    padding: 8,
  },
  shareIcon: {
    fontSize: 24,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666666',
    width: 140,
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  noSpotsText: {
    color: '#FF0000',
  },
  stageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0F47AF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  stageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F47AF',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  materialType: {
    fontSize: 20,
    marginRight: 8,
  },
  materialTitle: {
    fontSize: 16,
    color: '#333333',
  },
  speakerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 12,
  },
  speakerPhotoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  speakerPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  speakerInfo: {
    flex: 1,
  },
  speakerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F47AF',
    marginBottom: 2,
  },
  speakerCompany: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  speakerPosition: {
    fontSize: 14,
    color: '#999999',
  },
  chevron: {
    fontSize: 32,
    color: '#CCCCCC',
  },
  floatingShareButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0F47AF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingShareIcon: {
    fontSize: 24,
  },
});

export default SessionDetailsScreen;