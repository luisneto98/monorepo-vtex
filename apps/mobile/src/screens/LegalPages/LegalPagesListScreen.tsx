import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PublicLegalPage, SupportedLanguage } from '@shared/types/legal-pages';
import { LegalPagesService } from '../../services/LegalPagesService';
import ErrorState from '../../components/error/ErrorState';
import {
  getDeviceLanguage,
  getAvailableLanguageForDocument,
  getLegalPageIcon,
  getLanguageDisplayName,
} from '../../utils/localeUtils';

type RootStackParamList = {
  LegalPages: undefined;
  LegalPageViewer: { slug: string; language: SupportedLanguage; title: string };
};

type LegalPagesListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LegalPagesListScreen: React.FC = () => {
  const navigation = useNavigation<LegalPagesListScreenNavigationProp>();

  const [legalPages, setLegalPages] = useState<PublicLegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deviceLanguage = getDeviceLanguage();

  const loadLegalPages = async (useCache: boolean = true) => {
    try {
      setError(null);
      if (!useCache) {
        setLoading(true);
      }

      console.log('[LegalPagesListScreen] Fetching legal pages...');
      const data = await LegalPagesService.fetchPublicLegalPages(useCache);
      console.log('[LegalPagesListScreen] Received data:', data);
      setLegalPages(data);
    } catch (err: any) {
      console.error('[LegalPagesListScreen] Error loading legal pages:', err);
      setError(err.message || 'Não foi possível carregar os documentos legais');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLegalPages(false);
  };

  useEffect(() => {
    loadLegalPages();
  }, []);

  const handlePagePress = (page: PublicLegalPage) => {
    const selectedLanguage = getAvailableLanguageForDocument(
      page.availableLanguages,
      deviceLanguage
    );

    // Get localized title
    const title = page.title[deviceLanguage] || page.title.pt || page.title.en || page.slug;

    navigation.navigate('LegalPageViewer', {
      slug: page.slug,
      language: selectedLanguage,
      title,
    });
  };

  const getLocalizedTitle = (page: PublicLegalPage): string => {
    return page.title[deviceLanguage] || page.title.pt || page.title.en || page.slug;
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D71921" />
          <Text style={styles.loadingText}>
            {deviceLanguage === SupportedLanguage.PT
              ? 'Carregando documentos...'
              : deviceLanguage === SupportedLanguage.ES
              ? 'Cargando documentos...'
              : 'Loading documents...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && legalPages.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState error={error} onRetry={() => loadLegalPages(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D71921" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {deviceLanguage === SupportedLanguage.PT
              ? 'Termos e Privacidade'
              : deviceLanguage === SupportedLanguage.ES
              ? 'Términos y Privacidad'
              : 'Terms & Privacy'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {deviceLanguage === SupportedLanguage.PT
              ? 'Acesse os documentos legais do evento'
              : deviceLanguage === SupportedLanguage.ES
              ? 'Acceda a los documentos legales del evento'
              : 'Access event legal documents'}
          </Text>
        </View>

        {/* Legal Pages List */}
        {legalPages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateText}>
              {deviceLanguage === SupportedLanguage.PT
                ? 'Nenhum documento legal disponível'
                : deviceLanguage === SupportedLanguage.ES
                ? 'No hay documentos legales disponibles'
                : 'No legal documents available'}
            </Text>
          </View>
        ) : (
          <View style={styles.pagesContainer}>
            {legalPages.map((page) => (
              <TouchableOpacity
                key={page.slug}
                style={styles.pageCard}
                onPress={() => handlePagePress(page)}
                accessibilityLabel={`Ver ${getLocalizedTitle(page)}`}
                accessibilityRole="button"
              >
                {/* Icon */}
                <View style={styles.pageIconContainer}>
                  <Ionicons
                    name={getLegalPageIcon(page.type) as any}
                    size={32}
                    color="#D71921"
                  />
                </View>

                {/* Page Info */}
                <View style={styles.pageInfo}>
                  <Text style={styles.pageTitle}>{getLocalizedTitle(page)}</Text>

                  {/* Available Languages */}
                  <View style={styles.languageBadges}>
                    {page.availableLanguages.map((lang) => (
                      <View key={lang} style={styles.languageBadge}>
                        <Text style={styles.languageBadgeText}>
                          {getLanguageDisplayName(lang)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Chevron */}
                <Ionicons name="chevron-forward" size={24} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
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
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  pagesContainer: {
    paddingHorizontal: 16,
  },
  pageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pageIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pageInfo: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  languageBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  languageBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  languageBadgeText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default LegalPagesListScreen;
