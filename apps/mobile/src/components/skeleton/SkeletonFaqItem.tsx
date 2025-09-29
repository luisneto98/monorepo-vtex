import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function SkeletonFaqItem() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.questionLine1} />
        <View style={styles.questionLine2} />
        <View style={styles.chevron} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  header: {
    padding: 16,
    minHeight: 60,
  },
  questionLine1: {
    width: '80%',
    height: 16,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    marginBottom: 8,
  },
  questionLine2: {
    width: '60%',
    height: 16,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
    width: 20,
    height: 20,
    backgroundColor: '#E5E5E5',
    borderRadius: 10,
  },
});