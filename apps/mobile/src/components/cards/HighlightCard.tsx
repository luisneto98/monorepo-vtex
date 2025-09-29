import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ISession } from '../../../../../packages/shared/src/types/session.types';

interface HighlightCardProps {
  session: ISession;
  onPress: (session: ISession) => void;
}

export default function HighlightCard({ session, onPress }: HighlightCardProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(session)}
      activeOpacity={0.7}
      accessibilityLabel={session.title['pt-BR']}
      testID="highlight-card"
    >
      <View style={styles.header}>
        <View style={styles.timeContainer}>
          <Text style={styles.time}>
            {formatTime(session.startTime)} - {formatTime(session.endTime)}
          </Text>
          <Text style={styles.date}>{formatDate(session.startTime)}</Text>
        </View>
        <View style={styles.stageContainer}>
          <Text style={styles.stage}>{session.stage.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {session.title['pt-BR']}
      </Text>

      <Text style={styles.description} numberOfLines={3}>
        {session.description['pt-BR']}
      </Text>

      {session.tags && session.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {session.tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {session.tags.length > 2 && (
            <Text style={styles.moreTagsText}>+{session.tags.length - 2}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#0F47AF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timeContainer: {
    flex: 1,
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F47AF',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#666666',
  },
  stageContainer: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stage: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0F47AF',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#999999',
    fontStyle: 'italic',
  },
});