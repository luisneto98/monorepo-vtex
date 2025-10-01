import React, { useState, useCallback, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Faq } from '@vtexday26/shared';

import { SearchProvider, useSearch } from '../../contexts/SearchContext';
import SearchBar from '../../components/search/SearchBar';
import SearchTabBar from '../../components/search/SearchTabBar';
import RecentSearches, { addRecentSearch } from '../../components/search/RecentSearches';
import FaqCategories from '../../components/faq/FaqCategories';
import FaqAccordion from '../../components/faq/FaqAccordion';
import SkeletonSearchResults from '../../components/skeleton/SkeletonSearchResults';
import SearchService from '../../services/SearchService';
import FaqService from '../../services/FaqService';

function SearchContent() {
  const { activeSection, searchQuery, setSearchQuery, setActiveSection } = useSearch();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const language = 'pt-BR';

  useEffect(() => {
    if (activeSection === 'faq' && !searchQuery) {
      loadPopularFAQs();
    } else if (searchQuery.trim()) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchQuery, activeSection, selectedCategory]);

  const loadPopularFAQs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await FaqService.getPopularFAQs(10);
      const dataToSet = Array.isArray(response.data) ? response.data : [];
      setResults(dataToSet);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar FAQs populares');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (pageNum: number = 1, append: boolean = false) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);

      let response;

      if (activeSection === 'faq') {
        response = await FaqService.getFAQs({
          search: searchQuery,
          category: selectedCategory || undefined,
          page: pageNum,
          limit: 20,
        });
      } else {
        const searchResult = await SearchService.searchByContext(activeSection, searchQuery, pageNum, 20);
        response = searchResult.data;
      }

      if (append) {
        setResults((prev) => [...prev, ...response.data]);
      } else {
        setResults(response.data);
        // Add to recent searches only on new searches
        if (searchQuery.trim()) {
          await addRecentSearch(searchQuery);
        }
      }

      setHasMore(response.metadata.hasNext);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar resultados');
      if (!append) setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setSelectedCategory(null);
    if (activeSection === 'faq' && !searchQuery) {
      await loadPopularFAQs();
    } else {
      await performSearch(1, false);
    }
    setRefreshing(false);
  }, [searchQuery, activeSection, selectedCategory]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore && searchQuery.trim()) {
      performSearch(page + 1, true);
    }
  }, [loading, hasMore, page, searchQuery]);

  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setHasMore(true);
  }, [setSearchQuery]);

  const handleRecentSearchSelect = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setPage(1);
    setHasMore(true);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      if (activeSection === 'faq') {
        return <FaqAccordion faq={item as Faq} language="pt-BR" />;
      }
      // For other sections, render appropriate components
      return (
        <View style={styles.resultItem}>
          <Text style={styles.resultTitle}>{item.title?.[language] || item.name?.[language] || 'Item'}</Text>
        </View>
      );
    },
    [activeSection]
  );

  const renderEmptyState = () => {
    if (loading) return null;

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <Text style={styles.emptySubtext}>Tente novamente mais tarde</Text>
        </View>
      );
    }

    if (searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum resultado encontrado</Text>
          <Text style={styles.emptySubtext}>Tente usar outros termos de busca</Text>
        </View>
      );
    }

    // Only show "search prompt" when there are no results AND we're not showing popular FAQs
    if (activeSection !== 'faq') {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>🔍 Inicie sua busca</Text>
          <Text style={styles.emptySubtext}>Digite algo no campo acima</Text>
        </View>
      );
    }

    return null;
  };

  const renderFooter = () => {
    if (!loading || results.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0F47AF" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SearchTabBar activeSection={activeSection} onSectionChange={setActiveSection} />
      <SearchBar
        value={searchQuery}
        onChangeText={handleSearchQueryChange}
        placeholder={`Buscar em ${activeSection === 'faq' ? 'FAQ' : activeSection === 'sessions' ? 'Sessões' : 'Palestrantes'}...`}
        debounceMs={300}
      />

      {activeSection === 'faq' && (
        <FaqCategories
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          language="pt-BR"
          faqs={results as Faq[]}
        />
      )}

      {!searchQuery && activeSection === 'faq' && (
        <RecentSearches onSearchSelect={handleRecentSearchSelect} />
      )}

      {loading && results.length === 0 ? (
        <SkeletonSearchResults count={5} />
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item, index) => item._id || `item-${index}`}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#0F47AF"
              colors={['#0F47AF']}
            />
          }
          contentContainerStyle={results.length === 0 ? styles.emptyList : undefined}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
}

export default function SearchScreen() {
  return (
    <SearchProvider>
      <SearchContent />
    </SearchProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF0000',
    marginBottom: 8,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  resultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
});