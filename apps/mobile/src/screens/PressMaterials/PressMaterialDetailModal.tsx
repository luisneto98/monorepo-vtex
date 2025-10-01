import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
  Share,
  Alert,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PressMaterial } from '@monorepo-vtex/shared/types/press-materials';
import { PressMaterialsService } from '../../services/PressMaterialsService';
import {
  formatFileSize,
  getMaterialTypeLabel,
  isLargeFile,
  getFileExtension,
} from '../../utils/fileUtils';

type RootStackParamList = {
  PressMaterialDetail: { material: PressMaterial };
};

type PressMaterialDetailModalRouteProp = RouteProp<RootStackParamList, 'PressMaterialDetail'>;

const PressMaterialDetailModal: React.FC = () => {
  const route = useRoute<PressMaterialDetailModalRouteProp>();
  const navigation = useNavigation();
  const { material } = route.params;

  const [downloading, setDownloading] = useState(false);

  // Device locale - defaulting to pt-BR (TODO: integrate with i18n)
  const locale = 'pt-BR';

  const handleDownload = async () => {
    try {
      setDownloading(true);

      // Check if file is large and warn user
      if (isLargeFile(material.metadata.size)) {
        Alert.alert(
          'Arquivo Grande',
          `Este arquivo tem ${formatFileSize(material.metadata.size)}. O download pode levar alguns minutos e consumir dados móveis.`,
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => setDownloading(false) },
            { text: 'Continuar', onPress: () => proceedWithDownload() },
          ]
        );
      } else {
        await proceedWithDownload();
      }
    } catch (error: any) {
      console.error('Error downloading material:', error);
      Alert.alert(
        'Erro no Download',
        error.message || 'Não foi possível fazer o download. Verifique sua conexão e tente novamente.',
        [{ text: 'OK' }]
      );
      setDownloading(false);
    }
  };

  const proceedWithDownload = async () => {
    try {
      // Track download and get signed URL
      const downloadUrl = await PressMaterialsService.trackDownload(material._id!);

      // Open URL in device browser/viewer
      const canOpen = await Linking.canOpenURL(downloadUrl);
      if (canOpen) {
        await Linking.openURL(downloadUrl);
      } else {
        throw new Error('Não foi possível abrir o arquivo.');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      const title = PressMaterialsService.getLocalizedString(material.title, locale);
      const description = PressMaterialsService.getLocalizedString(material.description, locale);

      await Share.share({
        message: `${title}\n\n${description}\n\nTipo: ${getMaterialTypeLabel(material.type, locale)}\nTamanho: ${formatFileSize(material.metadata.size)}`,
        title: title,
      });
    } catch (error: any) {
      console.error('Error sharing material:', error);
    }
  };

  const getMetadataDisplay = () => {
    const items: { icon: string; label: string; value: string }[] = [
      {
        icon: 'document-text-outline',
        label: 'Formato',
        value: getFileExtension(material.metadata.format),
      },
      {
        icon: 'resize-outline',
        label: 'Tamanho',
        value: formatFileSize(material.metadata.size),
      },
    ];

    // Add dimensions for images
    if (material.metadata.width && material.metadata.height) {
      items.push({
        icon: 'expand-outline',
        label: 'Dimensões',
        value: `${material.metadata.width} × ${material.metadata.height}px`,
      });
    }

    // Add duration for videos
    if (material.metadata.duration) {
      const minutes = Math.floor(material.metadata.duration / 60);
      const seconds = material.metadata.duration % 60;
      items.push({
        icon: 'time-outline',
        label: 'Duração',
        value: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      });
    }

    return items;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Fechar"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={28} color="#666" />
        </TouchableOpacity>

        {/* Thumbnail/Preview */}
        <View style={styles.previewSection}>
          {material.thumbnailUrl ? (
            <Image
              source={{ uri: material.thumbnailUrl }}
              style={styles.preview}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Ionicons name="document-outline" size={80} color="#CCC" />
            </View>
          )}
        </View>

        {/* Material Type Badge */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>
            {getMaterialTypeLabel(material.type, locale)}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {PressMaterialsService.getLocalizedString(material.title, locale)}
        </Text>

        {/* Description */}
        {material.description && (
          <Text style={styles.description}>
            {PressMaterialsService.getLocalizedString(material.description, locale)}
          </Text>
        )}

        {/* Metadata */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Arquivo</Text>
          <View style={styles.metadataContainer}>
            {getMetadataDisplay().map((item, index) => (
              <View key={index} style={styles.metadataItem}>
                <Ionicons name={item.icon as any} size={20} color="#666" style={styles.metadataIcon} />
                <View style={styles.metadataContent}>
                  <Text style={styles.metadataLabel}>{item.label}</Text>
                  <Text style={styles.metadataValue}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Download Count */}
        {material.downloadCount > 0 && (
          <View style={styles.statsSection}>
            <Ionicons name="download-outline" size={20} color="#666" />
            <Text style={styles.statsText}>
              {material.downloadCount} {material.downloadCount === 1 ? 'download' : 'downloads'}
            </Text>
          </View>
        )}

        {/* Tags */}
        {material.tags && material.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {material.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Download Button */}
          <TouchableOpacity
            style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]}
            onPress={handleDownload}
            disabled={downloading}
            accessibilityLabel={downloading ? 'Baixando...' : 'Baixar arquivo'}
            accessibilityRole="button"
          >
            <Ionicons
              name={downloading ? 'hourglass-outline' : 'download-outline'}
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.downloadButtonText}>
              {downloading ? 'Baixando...' : 'Baixar'}
            </Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            accessibilityLabel="Compartilhar"
            accessibilityRole="button"
          >
            <Ionicons name="share-social-outline" size={24} color="#D71921" />
            <Text style={styles.shareButtonText}>Compartilhar</Text>
          </TouchableOpacity>
        </View>
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
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  preview: {
    width: '100%',
    height: 200,
  },
  previewPlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  typeBadge: {
    alignSelf: 'center',
    backgroundColor: '#D71921',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginTop: 12,
    paddingHorizontal: 20,
    textAlign: 'center',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  metadataContainer: {
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataIcon: {
    marginRight: 12,
  },
  metadataContent: {
    flex: 1,
  },
  metadataLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
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
  actionsContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
    gap: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D71921',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  downloadButtonDisabled: {
    backgroundColor: '#999',
    opacity: 0.7,
  },
  downloadButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D71921',
    gap: 12,
  },
  shareButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D71921',
  },
});

export default PressMaterialDetailModal;
