import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SpeakerSocialLinks } from '@monorepo-vtex/shared';

interface SocialLinksBarProps {
  socialLinks: SpeakerSocialLinks;
  speakerName: string;
}

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
  color: string;
}

const SocialLinksBar: React.FC<SocialLinksBarProps> = ({
  socialLinks,
  speakerName,
}) => {
  // URL validation allowlist for social media platforms
  const ALLOWED_DOMAINS = [
    'linkedin.com',
    'twitter.com',
    'x.com',
    'github.com',
    'facebook.com',
    'instagram.com',
  ];

  const isValidUrl = (url: string, platform: string): boolean => {
    try {
      const urlObj = new URL(url);

      // Check protocol - only allow https
      if (urlObj.protocol !== 'https:') {
        return false;
      }

      // For known platforms, validate against allowlist
      if (platform !== 'Website') {
        const hostname = urlObj.hostname.toLowerCase();
        const isAllowed = ALLOWED_DOMAINS.some(domain =>
          hostname === domain || hostname.endsWith(`.${domain}`)
        );
        return isAllowed;
      }

      // For generic websites, allow any https URL
      return true;
    } catch {
      return false;
    }
  };

  const openSocialLink = async (url: string, platform: string) => {
    // Validate URL before attempting to open
    if (!isValidUrl(url, platform)) {
      Alert.alert(
        'Link inválido',
        `O link fornecido para ${platform} não é válido ou não é seguro.`
      );
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          'Link inválido',
          `Não foi possível abrir o link para ${platform}.`
        );
        return;
      }

      Alert.alert(
        'Abrir link externo',
        `Você será redirecionado para ${platform}. Deseja continuar?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Abrir',
            onPress: async () => {
              try {
                await Linking.openURL(url);
                // Analytics tracking could be added here
                if (__DEV__) {
                  console.log(`📊 Social link opened: ${platform} for ${speakerName}`);
                }
              } catch (error) {
                console.error('Error opening link:', error);
                Alert.alert(
                  'Erro',
                  'Não foi possível abrir o link. Tente novamente mais tarde.'
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error checking URL:', error);
      Alert.alert(
        'Erro',
        'Não foi possível verificar o link. Tente novamente mais tarde.'
      );
    }
  };

  const availableLinks: SocialLink[] = [];

  if (socialLinks.linkedin) {
    availableLinks.push({
      platform: 'LinkedIn',
      url: socialLinks.linkedin,
      icon: '🔗',
      color: '#0077B5',
    });
  }

  if (socialLinks.twitter) {
    availableLinks.push({
      platform: 'Twitter',
      url: socialLinks.twitter,
      icon: '🐦',
      color: '#1DA1F2',
    });
  }

  if (socialLinks.github) {
    availableLinks.push({
      platform: 'GitHub',
      url: socialLinks.github,
      icon: '💻',
      color: '#333333',
    });
  }

  if (socialLinks.website) {
    availableLinks.push({
      platform: 'Website',
      url: socialLinks.website,
      icon: '🌐',
      color: '#0F47AF',
    });
  }

  if (availableLinks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Redes Sociais</Text>
      <View style={styles.linksContainer}>
        {availableLinks.map((link) => (
          <TouchableOpacity
            key={link.platform}
            style={[styles.linkButton, { borderColor: link.color }]}
            onPress={() => openSocialLink(link.url, link.platform)}
            accessibilityLabel={`Abrir ${link.platform} de ${speakerName}`}
            accessibilityHint={`Abrirá ${link.platform} no navegador`}
            accessibilityRole="button"
          >
            <Text style={styles.linkIcon}>{link.icon}</Text>
            <Text style={[styles.linkText, { color: link.color }]}>
              {link.platform}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F47AF',
    marginBottom: 12,
  },
  linksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  linkIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SocialLinksBar;