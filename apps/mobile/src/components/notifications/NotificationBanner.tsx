import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { PushNotificationData } from '../../services/NotificationService';

interface NotificationBannerProps {
  notification: PushNotificationData;
  onPress?: (notification: PushNotificationData) => void;
  onDismiss?: () => void;
  autoHideDuration?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onPress,
  onDismiss,
  autoHideDuration = 5000,
}) => {
  const [translateY] = useState(new Animated.Value(-200));

  useEffect(() => {
    // Slide in animation
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();

    // Auto-hide after duration
    const timer = setTimeout(() => {
      handleDismiss();
    }, autoHideDuration);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) {
        onDismiss();
      }
    });
  };

  const handlePress = () => {
    if (onPress) {
      handleDismiss();
      setTimeout(() => onPress(notification), 300);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.9}
        accessibilityLabel={`Nova notificação: ${notification.title}`}
        accessibilityHint="Toque para visualizar detalhes"
        accessibilityRole="button"
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔔</Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Fechar notificação"
          accessibilityRole="button"
        >
          <Text style={styles.closeIcon}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 24,
    color: '#999',
    fontWeight: 'bold',
  },
});