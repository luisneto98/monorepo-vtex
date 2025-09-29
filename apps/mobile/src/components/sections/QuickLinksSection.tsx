import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface QuickLink {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
}

interface QuickLinksSectionProps {
  links: QuickLink[];
}

export default function QuickLinksSection({ links }: QuickLinksSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Acesso Rápido</Text>
      <View style={styles.linksContainer}>
        {links.map((link) => (
          <TouchableOpacity
            key={link.id}
            style={styles.linkCard}
            onPress={link.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{link.icon}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.linkTitle}>{link.title}</Text>
              <Text style={styles.linkSubtitle}>{link.subtitle}</Text>
            </View>
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  linksContainer: {
    gap: 8,
  },
  linkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  linkSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  arrowContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 18,
    color: '#0F47AF',
    fontWeight: '600',
  },
});