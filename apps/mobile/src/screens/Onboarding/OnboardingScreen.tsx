import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { NotificationPermissionService } from '../../services/NotificationPermissionService';

interface OnboardingScreenProps {
  onComplete: (permissionGranted: boolean) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);

  const handleAllowNotifications = async () => {
    setLoading(true);
    try {
      const result = await NotificationPermissionService.requestPermissions();
      const granted = result.status === 'granted';
      onComplete(granted);
    } catch (error) {
      console.error('Error requesting notifications:', error);
      onComplete(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onComplete(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔔</Text>
        </View>

        <Text style={styles.title}>Fique sempre informado</Text>

        <Text style={styles.description}>
          Receba notificações sobre:
        </Text>

        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Atualizações de sessões</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Lembretes importantes</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Novidades do evento</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleAllowNotifications}
          disabled={loading}
          accessibilityLabel="Permitir notificações"
          accessibilityHint="Toque para ativar as notificações"
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Permitir Notificações</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleSkip}
          disabled={loading}
          accessibilityLabel="Pular"
          accessibilityHint="Toque para pular e ativar notificações depois"
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Agora Não</Text>
        </TouchableOpacity>

        <Text style={styles.footnote}>
          Você pode alterar isso depois nas configurações
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  benefitsList: {
    marginBottom: 40,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  benefitIcon: {
    fontSize: 20,
    color: '#00b894',
    marginRight: 12,
    fontWeight: 'bold',
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#F71963',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  footnote: {
    fontSize: 12,
    textAlign: 'center',
    color: '#999',
    marginTop: 16,
  },
});