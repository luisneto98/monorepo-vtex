import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import type { Faq, FaqCategory } from '@vtexday26/shared';
import RichTextRenderer from './RichTextRenderer';
import FaqService from '../../services/FaqService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FaqAccordionProps {
  faq: Faq;
  language?: 'pt-BR' | 'en';
}

// Helper to extract category ID whether it's a string or populated object
const getCategoryId = (category: string | FaqCategory): string => {
  return typeof category === 'string' ? category : (category._id || '');
};

const FaqAccordion = React.memo(function FaqAccordion({ faq, language = 'pt-BR' }: FaqAccordionProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);

    // Track view count when expanding
    if (!expanded && faq._id) {
      await FaqService.incrementViewCount(faq._id);
    }
  };

  const isPopular = faq.viewCount > 100;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={toggleExpand}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`Pergunta: ${faq.question[language]}`}
        accessibilityHint={expanded ? 'Toque para recolher' : 'Toque para expandir'}
      >
        <View style={styles.questionContainer}>
          <Text style={styles.question}>{faq.question[language]}</Text>
          {isPopular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Popular</Text>
            </View>
          )}
        </View>
        <Text style={[styles.chevron, expanded && styles.chevronExpanded]}>›</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          <RichTextRenderer html={faq.answer[language]} />
        </View>
      )}
    </View>
  );
});

export default FaqAccordion;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 60,
  },
  questionContainer: {
    flex: 1,
    marginRight: 12,
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    lineHeight: 22,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0F47AF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chevron: {
    fontSize: 24,
    color: '#666666',
    transform: [{ rotate: '90deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '270deg' }],
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});