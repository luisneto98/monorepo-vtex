import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorageHelper from '../../utils/AsyncStorageHelper';

const RECENT_SEARCHES_KEY = '@faq_recent_searches';
const MAX_RECENT_SEARCHES = 10;

interface RecentSearch {
  query: string;
  timestamp: number;
}

interface RecentSearchesProps {
  onSearchSelect: (query: string) => void;
}

export default function RecentSearches({ onSearchSelect }: RecentSearchesProps) {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    const searches = await AsyncStorageHelper.getItem<RecentSearch[]>(RECENT_SEARCHES_KEY);
    if (searches) {
      setRecentSearches(searches);
    }
  };

  const handleClearAll = async () => {
    await AsyncStorageHelper.removeItem(RECENT_SEARCHES_KEY);
    setRecentSearches([]);
  };

  if (recentSearches.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscas Recentes</Text>
        <TouchableOpacity onPress={handleClearAll}>
          <Text style={styles.clearButton}>Limpar</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {recentSearches.map((search, index) => (
          <TouchableOpacity
            key={`${search.query}-${index}`}
            style={styles.chip}
            onPress={() => onSearchSelect(search.query)}
            accessibilityLabel={`Buscar por ${search.query}`}
            accessibilityRole="button"
          >
            <Text style={styles.chipText}>{search.query}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export async function addRecentSearch(query: string): Promise<void> {
  if (!query.trim()) return;

  const searches = await AsyncStorageHelper.getItem<RecentSearch[]>(RECENT_SEARCHES_KEY) || [];

  // Remove duplicates
  const filtered = searches.filter(s => s.query.toLowerCase() !== query.toLowerCase());

  // Add new search at the beginning
  const updated = [
    { query, timestamp: Date.now() },
    ...filtered,
  ].slice(0, MAX_RECENT_SEARCHES);

  await AsyncStorageHelper.setItem(RECENT_SEARCHES_KEY, updated);
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  clearButton: {
    fontSize: 14,
    color: '#0F47AF',
  },
  scrollView: {
    paddingHorizontal: 16,
  },
  chip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    color: '#666666',
  },
});