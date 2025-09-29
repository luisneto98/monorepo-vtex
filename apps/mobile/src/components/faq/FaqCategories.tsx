import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import type { FaqCategory } from '@vtexday26/shared';
import FaqService from '../../services/FaqService';

interface FaqCategoriesProps {
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  language?: 'pt-BR' | 'en';
}

export default function FaqCategories({
  selectedCategory,
  onCategorySelect,
  language = 'pt-BR',
}: FaqCategoriesProps) {
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await FaqService.getFAQCategories();
      // Ensure we always have an array
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading FAQ categories:', error);
      // Set empty array on error to prevent crash
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0F47AF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[styles.chip, selectedCategory === null && styles.chipActive]}
          onPress={() => onCategorySelect(null)}
          accessibilityRole="button"
          accessibilityLabel="Ver todas as categorias"
          accessibilityState={{ selected: selectedCategory === null }}
        >
          <Text style={[styles.chipText, selectedCategory === null && styles.chipTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>

        {Array.isArray(categories) && categories.map((category) => {
          const isActive = selectedCategory === category._id;
          return (
            <TouchableOpacity
              key={category._id}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onCategorySelect(category._id)}
              accessibilityRole="button"
              accessibilityLabel={`Categoria: ${category.name[language]}`}
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {category.name[language]}
              </Text>
              {category.faqCount !== undefined && category.faqCount > 0 && (
                <View style={[styles.badge, isActive && styles.badgeActive]}>
                  <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                    {category.faqCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingVertical: 12,
  },
  loadingContainer: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#0F47AF',
    borderColor: '#0F47AF',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#DDDDDD',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666666',
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
});