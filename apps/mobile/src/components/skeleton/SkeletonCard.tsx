import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function SkeletonCard() {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startShimmerAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startShimmerAnimation();
  }, [shimmerAnimation]);

  const shimmerOpacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.timeSection}>
          <Animated.View style={[styles.timePlaceholder, { opacity: shimmerOpacity }]} />
          <Animated.View style={[styles.datePlaceholder, { opacity: shimmerOpacity }]} />
        </View>
        <Animated.View style={[styles.stagePlaceholder, { opacity: shimmerOpacity }]} />
      </View>

      <Animated.View style={[styles.titlePlaceholder, { opacity: shimmerOpacity }]} />
      <Animated.View style={[styles.titlePlaceholder, { opacity: shimmerOpacity, width: '70%' }]} />

      <View style={styles.descriptionSection}>
        <Animated.View style={[styles.descriptionPlaceholder, { opacity: shimmerOpacity }]} />
        <Animated.View style={[styles.descriptionPlaceholder, { opacity: shimmerOpacity, width: '80%' }]} />
        <Animated.View style={[styles.descriptionPlaceholder, { opacity: shimmerOpacity, width: '60%' }]} />
      </View>

      <View style={styles.tagsSection}>
        <Animated.View style={[styles.tagPlaceholder, { opacity: shimmerOpacity }]} />
        <Animated.View style={[styles.tagPlaceholder, { opacity: shimmerOpacity, width: 60 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timeSection: {
    flex: 1,
  },
  timePlaceholder: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 4,
    width: '60%',
  },
  datePlaceholder: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    width: '40%',
  },
  stagePlaceholder: {
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    width: 60,
  },
  titlePlaceholder: {
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  descriptionSection: {
    marginBottom: 12,
  },
  descriptionPlaceholder: {
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 4,
  },
  tagsSection: {
    flexDirection: 'row',
    gap: 6,
  },
  tagPlaceholder: {
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    width: 50,
  },
});