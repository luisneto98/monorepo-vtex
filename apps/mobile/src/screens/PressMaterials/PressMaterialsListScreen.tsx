import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PressMaterial, PressMaterialType } from '@monorepo-vtex/shared/types/press-materials';
import { PressMaterialsService } from '../../services/PressMaterialsService';
import ErrorState from '../../components/error/ErrorState';
import {
  formatFileSize,
  getMaterialTypeLabel,
  getMaterialTypeIcon,
  getFileExtension,
} from '../../utils/fileUtils';

type RootStackParamList = {
  PressMaterials: undefined;
  PressMaterialDetail: { material: PressMaterial };
};

type PressMaterialsListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FilterType = 'all' | PressMaterialType;

const PressMaterialsListScreen: React.FC = () => {
  const navigation = useNavigation<PressMaterialsListScreenNavigationProp>();
  const { width } = useWindowDimensions();

  const [materials, setMaterials] = useState<PressMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  // Device locale - defaulting to pt-BR (TODO: integrate with i18n)
  const locale = 'pt-BR';

  const loadPressMaterials = async (useCache: boolean = true) => {
    try {
      setError(null);
      if (!useCache) {
        setLoading(true);
      }

      console.log('[PressMaterialsListScreen] Fetching press materials...');
      const data = await PressMaterialsService.fetchPublicPressMaterials(useCache);
      console.log('[PressMaterialsListScreen] Received data:', data);
      console.log('[PressMaterialsListScreen] Data is array?', Array.isArray(data));
      console.log('[PressMaterialsListScreen] Data length:', data?.length);
      setMaterials(data);
      console.log('[PressMaterialsListScreen] Materials state updated');
    } catch (err: any) {
      console.error('[PressMaterialsListScreen] Error loading press materials:', err);
      setError(err.message || 'Não foi possível carregar os materiais de imprensa');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPressMaterials(false);
  };

  useEffect(() => {
    loadPressMaterials();
  }, []);

  const handleMaterialPress = (material: PressMaterial) => {
    navigation.navigate('PressMaterialDetail', { material });
  };

  // Filter materials based on selected type
  const filteredMaterials = useMemo(() => {
    console.log('[PressMaterialsListScreen] Filtering materials:', materials?.length, 'filter:', selectedFilter);
    const filtered = PressMaterialsService.filterByType(materials, selectedFilter);
    console.log('[PressMaterialsListScreen] Filtered result:', filtered?.length);
    return filtered;
  }, [materials, selectedFilter]);

  // Group materials by type for display
  const groupedMaterials = useMemo(() => {
    console.log('[PressMaterialsListScreen] Grouping materials:', filteredMaterials?.length);

    if (selectedFilter !== 'all') {
      // If filtered, show as single group
      const result = [
        {
          type: selectedFilter as PressMaterialType,
          materials: filteredMaterials,
        },
      ];
      console.log('[PressMaterialsListScreen] Grouped (filtered):', result);
      return result;
    }

    // Group by type
    const grouped = PressMaterialsService.groupByType(filteredMaterials);
    const result = Array.from(grouped.entries()).map(([type, mats]) => ({
      type,
      materials: mats,
    }));
    console.log('[PressMaterialsListScreen] Grouped (all):', result);
    return result;
  }, [filteredMaterials, selectedFilter]);

  const filters: { type: FilterType; label: string; icon: string }[] = [
    { type: 'all', label: locale.startsWith('pt') ? 'Todos' : 'All', icon: 'grid-outline' },
    { type: 'press_kit', label: getMaterialTypeLabel('press_kit', locale), icon: getMaterialTypeIcon('press_kit') },
    { type: 'logo_package', label: getMaterialTypeLabel('logo_package', locale), icon: getMaterialTypeIcon('logo_package') },
    { type: 'photo', label: getMaterialTypeLabel('photo', locale), icon: getMaterialTypeIcon('photo') },
    { type: 'video', label: getMaterialTypeLabel('video', locale), icon: getMaterialTypeIcon('video') },
    { type: 'presentation', label: getMaterialTypeLabel('presentation', locale), icon: getMaterialTypeIcon('presentation') },
  ];

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando materiais...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && materials.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState error={error} onRetry={() => loadPressMaterials(false)} />
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
          <Text style={styles.headerTitle}>Materiais de Imprensa</Text>
          <Text style={styles.headerSubtitle}>
            Acesse logos, fotos, vídeos e kits de imprensa do evento
          </Text>
        </View>

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.type}
              style={[
                styles.filterButton,
                selectedFilter === filter.type && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter.type)}
              accessibilityLabel={`Filtrar por ${filter.label}`}
              accessibilityRole="button"
            >
              <Ionicons
                name={filter.icon as any}
                size={18}
                color={selectedFilter === filter.type ? '#FFFFFF' : '#666'}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter.type && styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Materials by Type */}
        {groupedMaterials.map((group) => (
          <View key={group.type} style={styles.typeSection}>
            {/* Type Header - only show if "all" filter is active */}
            {selectedFilter === 'all' && (
              <View style={styles.typeHeader}>
                <Ionicons
                  name={getMaterialTypeIcon(group.type) as any}
                  size={24}
                  color="#D71921"
                  style={styles.typeIcon}
                />
                <Text style={styles.typeName}>{getMaterialTypeLabel(group.type, locale)}</Text>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{group.materials.length}</Text>
                </View>
              </View>
            )}

            {/* Materials Grid */}
            <View style={styles.materialsGrid}>
              {group.materials.map((material) => (
                <TouchableOpacity
                  key={material._id}
                  style={styles.materialCard}
                  onPress={() => handleMaterialPress(material)}
                  accessibilityLabel={`Ver detalhes de ${PressMaterialsService.getLocalizedString(material.title, locale)}`}
                  accessibilityRole="button"
                >
                  {/* Thumbnail */}
                  {material.thumbnailUrl ? (
                    <Image
                      source={{ uri: material.thumbnailUrl }}
                      style={styles.materialThumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.materialThumbnailPlaceholder}>
                      <Ionicons name="document-outline" size={40} color="#CCC" />
                    </View>
                  )}

                  {/* Material Info */}
                  <View style={styles.materialInfo}>
                    <Text style={styles.materialTitle} numberOfLines={2}>
                      {PressMaterialsService.getLocalizedString(material.title, locale)}
                    </Text>

                    {/* Format Badge and Size */}
                    <View style={styles.materialMeta}>
                      <View style={styles.formatBadge}>
                        <Text style={styles.formatBadgeText}>
                          {getFileExtension(material.metadata.format)}
                        </Text>
                      </View>
                      <Text style={styles.materialSize}>
                        {formatFileSize(material.metadata.size)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Empty State */}
        {filteredMaterials.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateText}>
              {selectedFilter === 'all'
                ? 'Nenhum material disponível no momento'
                : `Nenhum material do tipo "${filters.find(f => f.type === selectedFilter)?.label}" disponível`}
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
  filterScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#D71921',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  typeSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeIcon: {
    marginRight: 8,
  },
  typeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  typeBadge: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#D71921',
    fontWeight: '600',
  },
  materialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  materialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 6,
    width: '47%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  materialThumbnail: {
    width: '100%',
    height: 120,
    backgroundColor: '#F0F0F0',
  },
  materialThumbnailPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialInfo: {
    padding: 12,
  },
  materialTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 18,
  },
  materialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formatBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  formatBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
  },
  materialSize: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
});

export default PressMaterialsListScreen;
