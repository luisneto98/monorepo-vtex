import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../../contexts/NotificationContext';
import { PushNotificationData, NotificationService } from '../../services/NotificationService';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NotificationsListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications } =
    useNotifications();

  const handleNotificationPress = async (notification: PushNotificationData) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Handle deep link
    const deepLink = NotificationService.getDeepLink(notification);

    if (deepLink && NotificationService.isValidDeepLink(deepLink)) {
      // Extract route from deep link
      if (deepLink.includes('/session/')) {
        const sessionId = deepLink.split('/session/')[1];
        navigation.navigate('SessionDetails', { sessionId });
      } else if (deepLink.includes('/speaker/')) {
        const speakerId = deepLink.split('/speaker/')[1];
        navigation.navigate('SpeakerProfile', { speakerId });
      }
    }
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) {
      Alert.alert('Informação', 'Não há notificações não lidas');
      return;
    }

    Alert.alert('Marcar todas como lidas', 'Deseja marcar todas as notificações como lidas?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sim', onPress: markAllAsRead },
    ]);
  };

  const handleClearAll = () => {
    if (notifications.length === 0) {
      Alert.alert('Informação', 'Não há notificações para limpar');
      return;
    }

    Alert.alert(
      'Limpar notificações',
      'Deseja limpar todas as notificações? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpar', style: 'destructive', onPress: clearAllNotifications },
      ]
    );
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderNotification = ({ item }: { item: PushNotificationData }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
      accessibilityLabel={`Notificação: ${item.title}`}
      accessibilityHint={item.read ? 'Lida' : 'Não lida. Toque para visualizar'}
      accessibilityRole="button"
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
            {item.title}
          </Text>
          {!item.read && <View style={styles.unreadBadge} />}
        </View>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>{formatTimestamp(item.timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
      <Text style={styles.emptySubtitle}>Você receberá notificações aqui quando houver atualizações</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {notifications.length > 0 && (
        <View style={styles.actionsBar}>
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            style={styles.actionButton}
            accessibilityLabel="Marcar todas como lidas"
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>Marcar todas como lidas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClearAll}
            style={styles.actionButton}
            accessibilityLabel="Limpar todas"
            accessibilityRole="button"
          >
            <Text style={[styles.actionButtonText, styles.clearButtonText]}>Limpar</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  actionButton: {
    padding: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#0F47AF',
    fontWeight: '500',
  },
  clearButtonText: {
    color: '#F71963',
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  unreadItem: {
    backgroundColor: '#F0F7FF',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F71963',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});