import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Sponsor } from '@monorepo-vtex/shared/types/sponsor.types';
import { SponsorsService } from '../../services/SponsorsService';
import ErrorState from '../../components/error/ErrorState';
import { SafeAreaView } from 'react-native-safe-area-context';

type RootStackParamList = {
  SponsorDetails: { sponsorId: string };
};

type SponsorDetailsScreenRouteProp = RouteProp<RootStackParamList, 'SponsorDetails'>;

const SponsorDetailsScreen: React.FC = () => {
  const route = useRoute<SponsorDetailsScreenRouteProp>();
  const { sponsorId } = route.params;

  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSponsorDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await SponsorsService.fetchSponsorById(sponsorId);
      setSponsor(data);
    } catch (err: any) {
      console.error('Error loading sponsor details:', err);
      setError(err.message || 'Não foi possível carregar os detalhes do patrocinador');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSponsorDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sponsorId]);

  const handleOpenUrl = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const getLocalizedDescription = (description: { 'pt-BR': string; en: string }) => {
    // TODO: Get device locale and use it
    return description['pt-BR'];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !sponsor) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          error={error || 'Patrocinador não encontrado'}
          onRetry={() => loadSponsorDetails()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          {sponsor.logoUrl ? (
            <Image
              source={{ uri: sponsor.logoUrl }}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>
                {sponsor.name ? sponsor.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
        </View>

        {/* Name */}
        <Text style={styles.name}>{sponsor.name}</Text>

        {/* Stand Location */}
        {sponsor.standLocation && (
          <View style={styles.standBadge}>
            <Text style={styles.standText}>📍 Stand {sponsor.standLocation}</Text>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.description}>
            {getLocalizedDescription(sponsor.description)}
          </Text>
        </View>

        {/* Website */}
        {sponsor.websiteUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Website</Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => handleOpenUrl(sponsor.websiteUrl!)}
              accessibilityLabel={`Visitar website de ${sponsor.name}`}
              accessibilityRole="button"
            >
              <Text style={styles.linkIcon}>🌐</Text>
              <Text style={styles.linkText}>{sponsor.websiteUrl}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contact Email */}
        {sponsor.contactEmail && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contato</Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => handleOpenUrl(`mailto:${sponsor.contactEmail}`)}
              accessibilityLabel={`Enviar email para ${sponsor.name}`}
              accessibilityRole="button"
            >
              <Text style={styles.linkIcon}>📧</Text>
              <Text style={styles.linkText}>{sponsor.contactEmail}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Social Links */}
        {sponsor.socialLinks && Object.keys(sponsor.socialLinks).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Redes Sociais</Text>
            <View style={styles.socialLinksContainer}>
              {sponsor.socialLinks.linkedin && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleOpenUrl(sponsor.socialLinks!.linkedin!)}
                  accessibilityLabel="LinkedIn"
                  accessibilityRole="button"
                >
                  <Text style={styles.socialIcon}>💼</Text>
                  <Text style={styles.socialText}>LinkedIn</Text>
                </TouchableOpacity>
              )}
              {sponsor.socialLinks.instagram && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleOpenUrl(sponsor.socialLinks!.instagram!)}
                  accessibilityLabel="Instagram"
                  accessibilityRole="button"
                >
                  <Text style={styles.socialIcon}>📷</Text>
                  <Text style={styles.socialText}>Instagram</Text>
                </TouchableOpacity>
              )}
              {sponsor.socialLinks.facebook && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleOpenUrl(sponsor.socialLinks!.facebook!)}
                  accessibilityLabel="Facebook"
                  accessibilityRole="button"
                >
                  <Text style={styles.socialIcon}>📘</Text>
                  <Text style={styles.socialText}>Facebook</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Tags */}
        {sponsor.tags && sponsor.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categorias</Text>
            <View style={styles.tagsContainer}>
              {sponsor.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
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
    paddingBottom: 40,
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
  logoSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  logo: {
    width: 200,
    height: 120,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#F0F0F0',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#CCC',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  standBadge: {
    alignSelf: 'center',
    backgroundColor: '#D71921',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  standText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  linkIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  linkText: {
    fontSize: 14,
    color: '#D71921',
    flex: 1,
  },
  socialLinksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    margin: 6,
    minWidth: 120,
  },
  socialIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  socialText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  tag: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#D71921',
    fontWeight: '600',
  },
});

export default SponsorDetailsScreen;
