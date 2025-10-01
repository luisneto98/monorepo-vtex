import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NewsRelease } from '@vtexday26/shared/types/news-releases';
import { NewsReleasesService } from '../../services/NewsReleasesService';
import ErrorState from '../../components/error/ErrorState';
import { formatRelativeDate } from '../../utils/dateUtils';
import { truncateHtml } from '../../utils/htmlUtils';

type RootStackParamList = {
  NewsReleases: undefined;
  NewsReleaseDetail: { slug: string };
};

type NewsReleasesListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NewsReleasesListScreen: React.FC = () => {
  const navigation = useNavigation<NewsReleasesListScreenNavigationProp>();

  // Device locale - defaulting to pt-BR (TODO: integrate with i18n)
  const locale = 'pt-BR';

  // State
  const [articles, setArticles] = useState<NewsRelease[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<NewsRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  // Debounce search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Load featured articles (displayed at top)
   */
  const loadFeaturedArticles = async () => {
    try {
      const featured = await NewsReleasesService.getFeaturedNews();
      setFeaturedArticles(featured);
    } catch (err) {
      console.error('Error loading featured articles:', err);
      // Don't show error for featured - it's optional
    }
  };

  /**
   * Load news articles with filters
   */
  const loadNewsArticles = async (
    page: number = 1,
    reset: boolean = false,
    useCache: boolean = true
  ) => {
    try {
      setError(null);

      if (reset) {
        setLoading(true);
      } else if (page > 1) {
        setLoadingMore(true);
      }

      const filters: any = {
        page,
        limit: 10,
        language: locale,
      };

      if (selectedCategory !== 'all') {
        filters.categories = [selectedCategory];
      }

      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      const response = await NewsReleasesService.getPublicNews(filters, useCache);

      console.log('📱 Screen received response:', {
        hasResponse: !!response,
        hasData: !!(response && response.data),
        articlesCount: response?.data?.length || 0,
        pagination: response?.pagination,
      });

      // Handle undefined or malformed response
      if (!response || !response.data) {
        console.error('❌ Invalid response from service');
        setError('Resposta inválida do servidor');
        return;
      }

      const newArticles = response.data || [];
      console.log('📋 Articles to display:', newArticles.length, newArticles);

      if (reset || page === 1) {
        setArticles(newArticles);
      } else {
        setArticles((prev) => [...prev, ...newArticles]);
      }

      // Update pagination with safe defaults
      if (response.pagination) {
        setCurrentPage(response.pagination.page || page);
        setHasMore(response.pagination.page < response.pagination.pages);
      } else {
        setCurrentPage(page);
        setHasMore(false);
      }

      // Extract unique categories from articles
      if (newArticles.length > 0) {
        extractCategories(newArticles);
      }
    } catch (err) {
      console.error('Error loading news articles:', err);
      const error = err as Error;
      setError(error.message || 'Não foi possível carregar as notícias');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  /**
   * Extract unique categories from articles for filter chips
   */
  const extractCategories = (articlesData: NewsRelease[]) => {
    const allCategories = articlesData.flatMap((article) => article.categories);
    const uniqueCategories = Array.from(new Set(allCategories));
    setCategories((prev) => {
      const merged = Array.from(new Set([...prev, ...uniqueCategories]));
      return merged;
    });
  };

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await Promise.all([
      loadFeaturedArticles(),
      loadNewsArticles(1, true, false),
    ]);
  };

  /**
   * Handle infinite scroll (load more)
   */
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      loadNewsArticles(currentPage + 1, false);
    }
  };

  /**
   * Handle search with debouncing
   */
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout (500ms debounce)
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      loadNewsArticles(1, true, false);
    }, 500);
  };

  /**
   * Clear search
   */
  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    loadNewsArticles(1, true, false);
  };

  /**
   * Handle category filter change
   */
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    // Filter will be applied when effect runs
  };

  /**
   * Navigate to article detail
   */
  const handleArticlePress = (article: NewsRelease) => {
    navigation.navigate('NewsReleaseDetail', { slug: article.slug });
  };

  /**
   * Get localized content
   */
  const getLocalizedContent = useCallback((article: NewsRelease) => {
    return NewsReleasesService.getLocalizedContent(article, locale);
  }, [locale]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadFeaturedArticles();
    loadNewsArticles(1, true);
  }, []);

  /**
   * Reload when filters change
   */
  useEffect(() => {
    if (!loading) {
      loadNewsArticles(1, true, false);
    }
  }, [selectedCategory]);

  /**
   * Cleanup search timeout
   */
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Render featured article card
   */
  const renderFeaturedCard = ({ item }: { item: NewsRelease }) => {
    const content = getLocalizedContent(item);
    const excerpt = item.content[locale as 'pt-BR' | 'en' | 'es'].subtitle || truncateHtml(content.content, 120);

    return (
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={() => handleArticlePress(item)}
        accessibilityLabel={`Artigo em destaque: ${content.title}`}
        accessibilityRole="button"
      >
        {item.featuredImage && (
          <Image
            source={{ uri: item.featuredImage }}
            style={styles.featuredImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.featuredContent}>
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={12} color="#D71921" />
            <Text style={styles.featuredBadgeText}>Destaque</Text>
          </View>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {content.title}
          </Text>
          <Text style={styles.featuredExcerpt} numberOfLines={2}>
            {excerpt}
          </Text>
          <Text style={styles.featuredDate}>
            {item.publishedAt && formatRelativeDate(item.publishedAt, locale)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render article card
   */
  const renderArticleCard = ({ item }: { item: NewsRelease }) => {
    const content = getLocalizedContent(item);
    const excerpt = item.content[locale as 'pt-BR' | 'en' | 'es'].subtitle || truncateHtml(content.content, 100);

    return (
      <TouchableOpacity
        style={styles.articleCard}
        onPress={() => handleArticlePress(item)}
        accessibilityLabel={`Artigo: ${content.title}`}
        accessibilityRole="button"
      >
        {item.featuredImage && (
          <Image
            source={{ uri: item.featuredImage }}
            style={styles.articleImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.articleContent}>
          <Text style={styles.articleTitle} numberOfLines={2}>
            {content.title}
          </Text>
          <Text style={styles.articleExcerpt} numberOfLines={2}>
            {excerpt}
          </Text>
          <View style={styles.articleMeta}>
            <Text style={styles.articleDate}>
              {item.publishedAt && formatRelativeDate(item.publishedAt, locale)}
            </Text>
            {item.categories.length > 0 && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.categories[0]}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render list header (featured articles, search, filters)
   */
  const renderListHeader = () => (
    <>
      {/* Featured Articles Section */}
      {featuredArticles.length > 0 && (
        <View style={styles.featuredSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
          >
            {featuredArticles.map((article) => (
              <View key={article._id} style={styles.featuredCardWrapper}>
                {renderFeaturedCard({ item: article })}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={locale.startsWith('pt') ? 'Buscar notícias...' : 'Search news...'}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.searchClearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory === 'all' && styles.filterChipActive,
            ]}
            onPress={() => handleCategoryChange('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === 'all' && styles.filterChipTextActive,
              ]}
            >
              {locale.startsWith('pt') ? 'Todas' : 'All'}
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                selectedCategory === category && styles.filterChipActive,
              ]}
              onPress={() => handleCategoryChange(category)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === category && styles.filterChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {locale.startsWith('pt') ? 'Todas as Notícias' : 'All News'}
        </Text>
      </View>
    </>
  );

  /**
   * Render list footer (loading more indicator)
   */
  const renderListFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color="#D71921" />
        <Text style={styles.loadingMoreText}>Carregando mais...</Text>
      </View>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <Ionicons name="newspaper-outline" size={64} color="#CCC" />
        <Text style={styles.emptyStateText}>
          {searchQuery
            ? `Nenhum resultado encontrado para "${searchQuery}"`
            : 'Nenhuma notícia publicada ainda'}
        </Text>
      </View>
    );
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D71921" />
          <Text style={styles.loadingText}>Carregando notícias...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && (!articles || articles.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState error={error} onRetry={() => loadNewsArticles(1, true, false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={articles || []}
        renderItem={renderArticleCard}
        keyExtractor={(item) => item._id || item.slug}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D71921" />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
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
    marginTop: 12,
  },
  // Featured Section
  featuredSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  featuredScroll: {
    paddingHorizontal: 16,
  },
  featuredCardWrapper: {
    marginRight: 16,
  },
  featuredCard: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F0F0F0',
  },
  featuredContent: {
    padding: 16,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D71921',
    marginLeft: 4,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 24,
  },
  featuredExcerpt: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  featuredDate: {
    fontSize: 12,
    color: '#999',
  },
  // Search Bar
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#1A1A1A',
  },
  searchClearButton: {
    padding: 4,
  },
  // Filter Chips
  filterScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#D71921',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  // Section Header
  sectionHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  // Article Card
  articleCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  articleImage: {
    width: 100,
    height: 100,
    backgroundColor: '#F0F0F0',
  },
  articleContent: {
    flex: 1,
    padding: 12,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 22,
  },
  articleExcerpt: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  articleDate: {
    fontSize: 12,
    color: '#999',
  },
  categoryBadge: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D71921',
  },
  // Loading More
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  // Empty State
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

export default NewsReleasesListScreen;
