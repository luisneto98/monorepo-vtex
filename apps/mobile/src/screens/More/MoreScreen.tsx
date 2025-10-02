import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { NotificationPermissionService } from '../../services/NotificationPermissionService';
import { useNotifications } from '../../contexts/NotificationContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MoreScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { unreadCount } = useNotifications();
  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');

  useEffect(() => {
    loadPermissionStatus();
  }, []);

  const loadPermissionStatus = async () => {
    const result = await NotificationPermissionService.checkPermissionStatus();
    setPermissionStatus(result.status);
  };

  const handleNotificationsList = () => {
    navigation.navigate('NotificationsList');
  };

  const handleAboutEvent = () => {
    navigation.navigate('AboutEvent');
  };

  const handleNotificationSettings = async () => {
    const result = await NotificationPermissionService.checkPermissionStatus();

    if (result.status === 'granted') {
      Alert.alert(
        'Notificações Ativadas',
        'Você já está recebendo notificações. Para alterar, acesse as configurações do sistema.',
        [{ text: 'OK' }]
      );
    } else if (result.canAskAgain) {
      const requestResult = await NotificationPermissionService.requestPermissions();
      setPermissionStatus(requestResult.status);

      if (requestResult.status === 'granted') {
        Alert.alert('Sucesso', 'Notificações ativadas com sucesso!');
      }
    } else {
      Alert.alert(
        'Permissão Negada',
        'Para ativar notificações, você precisa acessar as configurações do sistema.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configurações', onPress: () => NotificationPermissionService.openAppSettings() }
        ]
      );
    }
  };

  const handleLegalPages = () => {
    navigation.navigate('LegalPages');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mais</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleAboutEvent}
          accessibilityLabel="Ver informações sobre o evento"
          accessibilityHint="Toque para ver detalhes do evento, local, contatos e redes sociais"
          accessibilityRole="button"
        >
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>ℹ️</Text>
            <View>
              <Text style={styles.menuItemTitle}>Sobre o Evento</Text>
              <Text style={styles.menuItemSubtitle}>
                Informações, local e contatos
              </Text>
            </View>
          </View>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleNotificationsList}
          accessibilityLabel="Ver notificações"
          accessibilityHint="Toque para ver todas as notificações"
          accessibilityRole="button"
        >
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>🔔</Text>
            <View>
              <Text style={styles.menuItemTitle}>Notificações</Text>
              <Text style={styles.menuItemSubtitle}>
                {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
              </Text>
            </View>
          </View>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleNotificationSettings}
          accessibilityLabel="Configurações de notificações"
          accessibilityHint="Toque para gerenciar suas notificações"
          accessibilityRole="button"
        >
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <View>
              <Text style={styles.menuItemTitle}>Configurações de Notificações</Text>
              <Text style={styles.menuItemSubtitle}>
                {permissionStatus === 'granted'
                  ? 'Ativadas'
                  : permissionStatus === 'denied'
                  ? 'Desativadas'
                  : 'Não configuradas'}
              </Text>
            </View>
          </View>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleLegalPages}
          accessibilityLabel="Ver termos e privacidade"
          accessibilityHint="Toque para ver documentos legais do evento"
          accessibilityRole="button"
        >
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>📄</Text>
            <View>
              <Text style={styles.menuItemTitle}>Termos e Privacidade</Text>
              <Text style={styles.menuItemSubtitle}>
                Documentos legais do evento
              </Text>
            </View>
          </View>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0F47AF',
  },
  menuContainer: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  menuItemArrow: {
    fontSize: 24,
    color: '#999',
  },
});