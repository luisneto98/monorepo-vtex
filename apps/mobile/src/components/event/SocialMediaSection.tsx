import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { SocialMediaLinks } from '@monorepo-vtex/shared/types/event-settings';

interface SocialMediaSectionProps {
  socialMedia?: SocialMediaLinks;
}

// Social media platform configuration
const SOCIAL_PLATFORMS = {
  instagram: {
    icon: '📷',
    label: 'Instagram',
    allowedDomains: ['instagram.com', 'www.instagram.com'],
  },
  facebook: {
    icon: '👤',
    label: 'Facebook',
    allowedDomains: ['facebook.com', 'www.facebook.com', 'fb.com'],
  },
  linkedin: {
    icon: '💼',
    label: 'LinkedIn',
    allowedDomains: ['linkedin.com', 'www.linkedin.com'],
  },
  twitter: {
    icon: '🐦',
    label: 'Twitter',
    allowedDomains: ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'],
  },
  youtube: {
    icon: '▶️',
    label: 'YouTube',
    allowedDomains: ['youtube.com', 'www.youtube.com', 'youtu.be'],
  },
};

/**
 * Validate social media URL following Story 3.4 security patterns
 * - HTTPS enforcement
 * - Domain allowlist validation
 * - URL sanitization
 */
const validateSocialMediaUrl = (url: string, platform: keyof typeof SOCIAL_PLATFORMS): boolean => {
  if (!url) return false;

  try {
    const urlObj = new URL(url);

    // Enforce HTTPS
    if (urlObj.protocol !== 'https:') {
      console.warn(`Invalid protocol for ${platform}: ${urlObj.protocol}`);
      return false;
    }

    // Check domain is in allowlist
    const allowedDomains = SOCIAL_PLATFORMS[platform].allowedDomains;
    const hostname = urlObj.hostname.toLowerCase();

    const isAllowed = allowedDomains.some((domain) => hostname === domain);

    if (!isAllowed) {
      console.warn(`Invalid domain for ${platform}: ${hostname}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Invalid URL for ${platform}:`, error);
    return false;
  }
};

/**
 * Sanitize URL to prevent injection attacks
 */
const sanitizeUrl = (url: string): string => {
  // Remove any leading/trailing whitespace
  const sanitized = url.trim();

  // Ensure no javascript: or data: protocols
  if (
    sanitized.toLowerCase().startsWith('javascript:') ||
    sanitized.toLowerCase().startsWith('data:')
  ) {
    throw new Error('Invalid URL protocol');
  }

  return sanitized;
};

export const SocialMediaSection: React.FC<SocialMediaSectionProps> = ({ socialMedia }) => {
  if (!socialMedia) {
    return null;
  }

  const handleSocialPress = (platform: keyof typeof SOCIAL_PLATFORMS, url: string) => {
    try {
      const sanitizedUrl = sanitizeUrl(url);

      if (!validateSocialMediaUrl(sanitizedUrl, platform)) {
        Alert.alert('Erro', 'Link inválido. Por favor, contate o suporte.');
        return;
      }

      Linking.openURL(sanitizedUrl).catch((err) => {
        console.error(`Error opening ${platform}:`, err);
        Alert.alert('Erro', 'Não foi possível abrir o link.');
      });
    } catch (error) {
      console.error(`Error handling social press for ${platform}:`, error);
      Alert.alert('Erro', 'Link inválido.');
    }
  };

  // Filter out platforms without valid URLs
  const availablePlatforms = (Object.keys(SOCIAL_PLATFORMS) as Array<keyof typeof SOCIAL_PLATFORMS>)
    .filter((platform) => socialMedia[platform]);

  if (availablePlatforms.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>🌐</Text>
        <Text style={styles.title}>Redes Sociais</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.socialGrid}>
          {availablePlatforms.map((platform) => {
            const config = SOCIAL_PLATFORMS[platform];
            const url = socialMedia[platform];

            if (!url) return null;

            return (
              <TouchableOpacity
                key={platform}
                style={styles.socialButton}
                onPress={() => handleSocialPress(platform, url)}
                accessibilityRole="link"
                accessibilityLabel={`Abrir ${config.label} do evento`}
                accessibilityHint="Abre o perfil nas redes sociais"
              >
                <Text style={styles.socialIcon}>{config.icon}</Text>
                <Text style={styles.socialLabel}>{config.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    paddingLeft: 32,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  socialButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  socialIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  socialLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
  },
});