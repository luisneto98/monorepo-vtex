import React from 'react';
import { Text, View, StyleSheet, Linking, Platform } from 'react-native';

interface RichTextRendererProps {
  html: string;
}

// Simple HTML sanitizer and parser for basic tags
const sanitizeAndParse = (html: string): React.ReactNode[] => {
  if (!html) return [<Text key="empty">Sem conteúdo disponível</Text>];

  try {
    // Remove potentially dangerous tags
    let sanitized = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/on\w+="[^"]*"/gi, ''); // Remove event handlers

    const elements: React.ReactNode[] = [];
    let key = 0;

    // Simple parser for basic HTML tags
    const parseNode = (text: string): React.ReactNode[] => {
      const nodes: React.ReactNode[] = [];
      let currentText = text;
      let match: RegExpMatchArray | null;

      // Parse links
      const linkRegex = /<a\s+[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
      while ((match = linkRegex.exec(currentText)) !== null) {
        if (match.index === undefined) continue;

        const before = currentText.substring(0, match.index);
        if (before) nodes.push(...parseSimpleText(before, key++));

        const url = match[1];
        const linkText = match[2].replace(/<[^>]+>/g, ''); // Strip inner tags
        nodes.push(
          <Text
            key={key++}
            style={styles.link}
            onPress={() => Linking.openURL(url)}
            accessibilityRole="link"
          >
            {linkText}
          </Text>
        );

        currentText = currentText.substring(match.index + match[0].length);
        linkRegex.lastIndex = 0;
      }

      if (currentText) nodes.push(...parseSimpleText(currentText, key++));
      return nodes;
    };

    const parseSimpleText = (text: string, baseKey: number): React.ReactNode[] => {
      const nodes: React.ReactNode[] = [];
      let remaining = text;

      // Parse bold
      remaining = remaining.replace(/<(b|strong)>(.*?)<\/(b|strong)>/gi, (_, __, content) => {
        nodes.push(<Text key={`b-${baseKey++}`} style={styles.bold}>{content}</Text>);
        return `\u0000${nodes.length - 1}\u0000`;
      });

      // Parse italic
      remaining = remaining.replace(/<(i|em)>(.*?)<\/(i|em)>/gi, (_, __, content) => {
        nodes.push(<Text key={`i-${baseKey++}`} style={styles.italic}>{content}</Text>);
        return `\u0000${nodes.length - 1}\u0000`;
      });

      // Parse line breaks
      remaining = remaining.replace(/<br\s*\/?>/gi, '\n');

      // Remove remaining HTML tags
      remaining = remaining.replace(/<[^>]+>/g, '');

      // Reconstruct text with styled components
      const parts = remaining.split('\u0000');
      parts.forEach((part, i) => {
        if (part.match(/^\d+$/)) {
          // This is a reference to a styled node
          // Already in nodes array
        } else if (part.trim()) {
          nodes.push(<Text key={`text-${baseKey++}`}>{part}</Text>);
        }
      });

      return nodes;
    };

    // Handle lists
    const listRegex = /<(ul|ol)>(.*?)<\/(ul|ol)>/gis;
    let lastIndex = 0;
    let match: RegExpMatchArray | null;

    while ((match = listRegex.exec(sanitized)) !== null) {
      if (match.index === undefined) continue;

      // Add text before list
      const before = sanitized.substring(lastIndex, match.index);
      if (before.trim()) {
        elements.push(
          <Text key={key++} style={styles.paragraph}>
            {parseNode(before)}
          </Text>
        );
      }

      // Parse list items
      const listType = match[1];
      const listContent = match[2];
      const items = listContent.match(/<li>(.*?)<\/li>/gi) || [];

      elements.push(
        <View key={key++} style={styles.list}>
          {items.map((item, index) => {
            const content = item.replace(/<\/?li>/gi, '');
            const bullet = listType === 'ul' ? '•' : `${index + 1}.`;
            return (
              <View key={`li-${key++}`} style={styles.listItem}>
                <Text style={styles.bullet}>{bullet}</Text>
                <Text style={styles.listItemText}>{parseNode(content)}</Text>
              </View>
            );
          })}
        </View>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    const remaining = sanitized.substring(lastIndex);
    if (remaining.trim()) {
      elements.push(
        <Text key={key++} style={styles.paragraph}>
          {parseNode(remaining)}
        </Text>
      );
    }

    return elements.length > 0 ? elements : [<Text key="empty">Sem conteúdo disponível</Text>];
  } catch (error) {
    console.error('Error parsing HTML:', error);
    return [<Text key="error" style={styles.error}>Erro ao carregar conteúdo</Text>];
  }
};

export default function RichTextRenderer({ html }: RichTextRendererProps) {
  const content = sanitizeAndParse(html);

  return (
    <View style={styles.container}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333333',
    marginBottom: 8,
  },
  bold: {
    fontWeight: '600',
  },
  italic: {
    fontStyle: 'italic',
  },
  link: {
    color: '#0F47AF',
    textDecorationLine: 'underline',
  },
  list: {
    marginVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    fontSize: 15,
    color: '#333333',
    marginRight: 8,
    minWidth: 20,
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#333333',
  },
  error: {
    fontSize: 14,
    color: '#FF0000',
    fontStyle: 'italic',
  },
});