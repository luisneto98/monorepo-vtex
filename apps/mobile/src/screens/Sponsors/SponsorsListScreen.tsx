import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SponsorsService, TierGroupedSponsors } from '../../services/SponsorsService';
import ErrorState from '../../components/error/ErrorState';
import { SafeAreaView } from 'react-native-safe-area-context';

type RootStackParamList = {
  Sponsors: undefined;
  SponsorDetails: { sponsorId: string };
};

type SponsorsListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SponsorsListScreen: React.FC = () => {
  const navigation = useNavigation<SponsorsListScreenNavigationProp>();

  const [sponsorsByTier, setSponsorsByTier] = useState<TierGroupedSponsors[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSponsors = async (useCache: boolean = true) => {
    try {
      setError(null);
      if (!useCache) {
        setLoading(true);
      }

      const data = await SponsorsService.fetchSponsorsByTier(useCache);
      setSponsorsByTier(data);
    } catch (err: any) {
      console.error('Error loading sponsors:', err);
      setError(err.message || 'Não foi possível carregar os patrocinadores');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSponsors(false);
  };

  useEffect(() => {
    loadSponsors();
  }, []);

  const handleSponsorPress = (sponsorId: string) => {
    navigation.navigate('SponsorDetails', { sponsorId });
  };

  const getLocalizedTierName = (tierDisplayName: { 'pt-BR': string; en: string }) => {
    // TODO: Get device locale and use it
    return tierDisplayName['pt-BR'];
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando patrocinadores...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && sponsorsByTier.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          error={error}
          onRetry={() => loadSponsors(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#D71921"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Patrocinadores</Text>
          <Text style={styles.headerSubtitle}>
            Conheça nossos parceiros e visite seus estandes
          </Text>
        </View>

        {/* Sponsors by Tier */}
        {sponsorsByTier.map((tierGroup) => (
          <View key={tierGroup.tier._id} style={styles.tierSection}>
            {/* Tier Header */}
            <View style={styles.tierHeader}>
              <Text style={styles.tierName}>
                {getLocalizedTierName(tierGroup.tier.displayName)}
              </Text>
              <View style={styles.tierBadge}>
                <Text style={styles.tierBadgeText}>
                  {tierGroup.sponsors.length} {tierGroup.sponsors.length === 1 ? 'Patrocinador' : 'Patrocinadores'}
                </Text>
              </View>
            </View>

            {/* Sponsors Grid */}
            <View style={styles.sponsorsGrid}>
              {tierGroup.sponsors.map((sponsor) => (
                <TouchableOpacity
                  key={sponsor._id}
                  style={styles.sponsorCard}
                  onPress={() => handleSponsorPress(sponsor._id)}
                  accessibilityLabel={`Ver detalhes de ${sponsor.name}`}
                  accessibilityRole="button"
                >
                  {sponsor.logoUrl ? (
                    <Image
                      source={{ uri: sponsor.logoUrl }}
                      style={styles.sponsorLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.sponsorLogoPlaceholder}>
                      <Text style={styles.sponsorLogoPlaceholderText}>
                        {sponsor.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.sponsorName} numberOfLines={2}>
                    {sponsor.name}
                  </Text>
                  {sponsor.standLocation && (
                    <Text style={styles.sponsorStand}>
                      📍 Stand {sponsor.standLocation}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {sponsorsByTier.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Nenhum patrocinador disponível no momento
            </Text>
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
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tierSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tierName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D71921',
  },
  tierBadge: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tierBadgeText: {
    fontSize: 12,
    color: '#D71921',
    fontWeight: '600',
  },
  sponsorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  sponsorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 6,
    width: '47%',
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sponsorLogo: {
    width: 100,
    height: 60,
    marginBottom: 12,
  },
  sponsorLogoPlaceholder: {
    width: 100,
    height: 60,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sponsorLogoPlaceholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#CCC',
  },
  sponsorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },
  sponsorStand: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default SponsorsListScreen;
