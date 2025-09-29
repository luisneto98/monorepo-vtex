import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonFaqItem from './SkeletonFaqItem';

interface SkeletonSearchResultsProps {
  count?: number;
}

export default function SkeletonSearchResults({ count = 5 }: SkeletonSearchResultsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonFaqItem key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});