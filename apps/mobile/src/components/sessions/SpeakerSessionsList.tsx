import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ISession } from '@monorepo-vtex/shared';
import SpeakerService from '../../services/SpeakerService';
import { formatDate, formatTime } from '../../utils/dateUtils';

interface SpeakerSessionsListProps {
  speakerId: string;
  currentSessionId?: string;
  onSessionPress: (session: ISession) => void;
}

const SpeakerSessionsList: React.FC<SpeakerSessionsListProps> = ({
  speakerId,
  currentSessionId,
  onSessionPress,
}) => {
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakerId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await SpeakerService.getSpeakerSessions(speakerId);
      setSessions(data);
    } catch (err: any) {
      console.error('Error loading speaker sessions:', err);
      setError(err.message || 'Não foi possível carregar as palestras');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#0F47AF" />
        <Text style={styles.loadingText}>Carregando palestras...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadSessions}
          accessibilityLabel="Tentar novamente"
          accessibilityRole="button"
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>📭</Text>
        <Text style={styles.emptySubtext}>Sem outras palestras</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sessions.map((session) => {
        const isCurrentSession = session._id === currentSessionId;

        return (
          <TouchableOpacity
            key={session._id}
            style={[
              styles.sessionCard,
              isCurrentSession && styles.currentSessionCard,
            ]}
            onPress={() => onSessionPress(session)}
            disabled={isCurrentSession}
            accessibilityLabel={`Palestra: ${session.title['pt-BR']}`}
            accessibilityRole="button"
          >
            {isCurrentSession && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Palestra atual</Text>
              </View>
            )}

            <Text
              style={[
                styles.sessionTitle,
                isCurrentSession && styles.currentSessionTitle,
              ]}
              numberOfLines={2}
            >
              {session.title['pt-BR']}
            </Text>

            <View style={styles.sessionInfo}>
              <Text style={styles.sessionDate}>
                📅 {formatDate(session.startTime)}
              </Text>
              <Text style={styles.sessionTime}>
                🕐 {formatTime(session.startTime)} - {formatTime(session.endTime)}
              </Text>
            </View>

            <View style={styles.sessionFooter}>
              <View style={styles.stageBadge}>
                <Text style={styles.stageText}>{session.stage}</Text>
              </View>
              {session.technicalLevel && (
                <Text style={styles.levelText}>
                  {session.technicalLevel === 'beginner' ? '🟢 Iniciante' :
                   session.technicalLevel === 'intermediate' ? '🟡 Intermediário' :
                   '🔴 Avançado'}
                </Text>
              )}
            </View>

            {!isCurrentSession && <Text style={styles.chevron}>›</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
  },
  errorText: {
    fontSize: 14,
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0F47AF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666666',
  },
  sessionCard: {
    position: 'relative',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currentSessionCard: {
    backgroundColor: '#E8F0FE',
    borderColor: '#0F47AF',
    opacity: 0.7,
  },
  currentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#0F47AF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F47AF',
    marginBottom: 8,
    paddingRight: 100,
  },
  currentSessionTitle: {
    color: '#666666',
  },
  sessionInfo: {
    marginBottom: 8,
  },
  sessionDate: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 14,
    color: '#666666',
  },
  sessionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stageBadge: {
    backgroundColor: '#0F47AF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  levelText: {
    fontSize: 12,
    color: '#666666',
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    fontSize: 32,
    color: '#CCCCCC',
    transform: [{ translateY: -16 }],
  },
});

export default SpeakerSessionsList;