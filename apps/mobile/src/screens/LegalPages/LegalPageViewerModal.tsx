import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  Linking,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { SupportedLanguage } from '@shared/types/legal-pages';
import { LegalPagesService } from '../../services/LegalPagesService';
import { getDeviceLanguage } from '../../utils/localeUtils';

type RootStackParamList = {
  LegalPageViewer: { slug: string; language: SupportedLanguage; title: string };
};

type LegalPageViewerModalRouteProp = RouteProp<RootStackParamList, 'LegalPageViewer'>;

const LegalPageViewerModal: React.FC = () => {
  const route = useRoute<LegalPageViewerModalRouteProp>();
  const navigation = useNavigation();
  const { slug, language, title } = route.params;

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useWebView, setUseWebView] = useState(false);

  const deviceLanguage = getDeviceLanguage();

  const loadPdfUrl = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[LegalPageViewerModal] Fetching signed URL for:', slug, language);
      const response = await LegalPagesService.getSignedDownloadUrl(slug, language);
      console.log('[LegalPageViewerModal] Received signed URL:', response.url);

      setPdfUrl(response.url);

      // Try to open PDF in native viewer (iOS/Android default PDF app)
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const canOpen = await Linking.canOpenURL(response.url);
        if (canOpen) {
          // Try to open with native viewer
          const opened = await Linking.openURL(response.url);
          if (opened) {
            // Successfully opened in native viewer - close modal
            navigation.goBack();
            return;
          }
        }
      }

      // If native viewer failed, use WebView fallback
      setUseWebView(true);
    } catch (err: any) {
      console.error('[LegalPageViewerModal] Error loading PDF:', err);
      setError(err.message || 'Não foi possível carregar o documento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPdfUrl();
  }, [slug, language]);

  const handleShare = async () => {
    if (!pdfUrl) return;

    try {
      const message =
        deviceLanguage === SupportedLanguage.PT
          ? `Confira: ${title}`
          : deviceLanguage === SupportedLanguage.ES
          ? `Mira: ${title}`
          : `Check out: ${title}`;

      await Share.share({
        message,
        url: pdfUrl,
      });
    } catch (err: any) {
      console.error('[LegalPageViewerModal] Error sharing PDF:', err);
      Alert.alert(
        deviceLanguage === SupportedLanguage.PT
          ? 'Erro'
          : deviceLanguage === SupportedLanguage.ES
          ? 'Error'
          : 'Error',
        deviceLanguage === SupportedLanguage.PT
          ? 'Não foi possível compartilhar o documento'
          : deviceLanguage === SupportedLanguage.ES
          ? 'No se pudo compartir el documento'
          : 'Could not share document'
      );
    }
  };

  const handleRetry = () => {
    loadPdfUrl();
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        accessibilityLabel={
          deviceLanguage === SupportedLanguage.PT
            ? 'Fechar'
            : deviceLanguage === SupportedLanguage.ES
            ? 'Cerrar'
            : 'Close'
        }
        accessibilityRole="button"
      >
        <Ionicons name="close" size={28} color="#1A1A1A" />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShare}
        disabled={!pdfUrl}
        accessibilityLabel={
          deviceLanguage === SupportedLanguage.PT
            ? 'Compartilhar'
            : deviceLanguage === SupportedLanguage.ES
            ? 'Compartir'
            : 'Share'
        }
        accessibilityRole="button"
      >
        <Ionicons name="share-outline" size={24} color={pdfUrl ? '#D71921' : '#CCC'} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {renderHeader()}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D71921" />
          <Text style={styles.loadingText}>
            {deviceLanguage === SupportedLanguage.PT
              ? 'Abrindo documento...'
              : deviceLanguage === SupportedLanguage.ES
              ? 'Abriendo documento...'
              : 'Opening document...'}
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>
              {deviceLanguage === SupportedLanguage.PT
                ? 'Tentar Novamente'
                : deviceLanguage === SupportedLanguage.ES
                ? 'Intentar de Nuevo'
                : 'Try Again'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && useWebView && pdfUrl && (
        <WebView
          source={{ uri: pdfUrl }}
          style={styles.webview}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('[LegalPageViewerModal] WebView error:', nativeEvent);
            setError(
              deviceLanguage === SupportedLanguage.PT
                ? 'Não foi possível carregar o PDF'
                : deviceLanguage === SupportedLanguage.ES
                ? 'No se pudo cargar el PDF'
                : 'Could not load PDF'
            );
          }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webviewLoadingContainer}>
              <ActivityIndicator size="large" color="#D71921" />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  shareButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#D71921',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
  webviewLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default LegalPageViewerModal;
