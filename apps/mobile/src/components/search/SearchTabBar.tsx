import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { SearchSection } from '../../contexts/SearchContext';

interface SearchTabBarProps {
  activeSection: SearchSection;
  onSectionChange: (section: SearchSection) => void;
}

const tabs: Array<{ key: SearchSection; label: string }> = [
  { key: 'faq', label: 'FAQ' },
  { key: 'sessions', label: 'Sessões' },
  { key: 'speakers', label: 'Palestrantes' },
];

const SearchTabBar = React.memo(function SearchTabBar({ activeSection, onSectionChange }: SearchTabBarProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeSection;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onSectionChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Buscar em ${tab.label}`}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

export default SearchTabBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#0F47AF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#0F47AF',
    fontWeight: '600',
  },
});