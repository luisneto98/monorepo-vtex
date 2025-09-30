import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { runValidation } from './src/config/validate-env';
import { OnboardingScreen } from './src/screens/Onboarding/OnboardingScreen';
import { NotificationPermissionService } from './src/services/NotificationPermissionService';
import { NotificationService, PushNotificationData } from './src/services/NotificationService';
import { NotificationBanner } from './src/components/notifications/NotificationBanner';
import { NotificationProvider, useNotifications } from './src/contexts/NotificationContext';
import { NetworkProvider } from './src/contexts/NetworkContext';
import { EventSettingsProvider } from './src/contexts/EventSettingsContext';
import { OfflineIndicator } from './src/components/common/OfflineIndicator';
import { SyncService } from './src/services/SyncService';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<PushNotificationData | null>(null);
  const { addNotification } = useNotifications();

  useEffect(() => {
    async function prepare() {
      try {
        // Validate environment configuration
        runValidation();

        // Check if we should show onboarding
        const shouldShow = await NotificationPermissionService.shouldShowPermissionRequest();
        setShowOnboarding(shouldShow);

        // Initialize notifications if permission granted
        if (!shouldShow) {
          await NotificationService.initialize();
        }

        // Pre-load fonts, make API calls, etc.
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();

      // Setup notification listeners
      NotificationService.setupListeners(
        (notification) => {
          // Handle foreground notification
          const parsed = NotificationService.parseNotification(notification);
          setCurrentNotification(parsed);
          addNotification(parsed);
        },
        (response) => {
          // Handle notification tap
          const parsed = NotificationService.parseNotificationResponse(response);
          addNotification(parsed);
          handleNotificationPress(parsed);
        }
      );

      // Initialize sync service
      SyncService.initialize();

      return () => {
        NotificationService.removeListeners();
        SyncService.cleanup();
      };
    }
  }, [appIsReady]);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  const handleOnboardingComplete = async (permissionGranted: boolean) => {
    setShowOnboarding(false);

    // Initialize notifications if permission was granted
    if (permissionGranted) {
      await NotificationService.initialize();
    }
  };

  const handleNotificationPress = (notification: PushNotificationData) => {
    const deepLink = NotificationService.getDeepLink(notification);

    if (deepLink && NotificationService.isValidDeepLink(deepLink)) {
      // Deep link will be handled by React Navigation linking config
      console.log('Opening deep link:', deepLink);
    }

    setCurrentNotification(null);
  };

  const handleNotificationDismiss = () => {
    setCurrentNotification(null);
  };

  if (!appIsReady) {
    return null;
  }

  if (showOnboarding) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator />
      <OfflineIndicator />
      {currentNotification && (
        <NotificationBanner
          notification={currentNotification}
          onPress={handleNotificationPress}
          onDismiss={handleNotificationDismiss}
        />
      )}
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <NetworkProvider>
      <EventSettingsProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </EventSettingsProvider>
    </NetworkProvider>
  );
}
