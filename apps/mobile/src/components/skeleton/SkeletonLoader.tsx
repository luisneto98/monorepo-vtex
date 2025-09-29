import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonLoaderProps {
  count?: number;
  variant?: 'quickLinks' | 'section';
}

export default function SkeletonLoader({ count = 4, variant = 'quickLinks' }: SkeletonLoaderProps) {
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

  const renderQuickLinkSkeleton = (index: number) => (
    <View key={index} style={styles.linkCard}>
      <Animated.View style={[styles.iconPlaceholder, { opacity: shimmerOpacity }]} />
      <View style={styles.textContainer}>
        <Animated.View style={[styles.titlePlaceholder, { opacity: shimmerOpacity }]} />
        <Animated.View style={[styles.subtitlePlaceholder, { opacity: shimmerOpacity }]} />
      </View>
      <Animated.View style={[styles.arrowPlaceholder, { opacity: shimmerOpacity }]} />
    </View>
  );

  const renderSectionSkeleton = (index: number) => (
    <View key={index} style={styles.sectionContainer}>
      <Animated.View style={[styles.sectionTitlePlaceholder, { opacity: shimmerOpacity }]} />
      <View style={styles.sectionContent}>
        <Animated.View style={[styles.contentLinePlaceholder, { opacity: shimmerOpacity }]} />
        <Animated.View style={[styles.contentLinePlaceholder, { opacity: shimmerOpacity, width: '80%' }]} />
        <Animated.View style={[styles.contentLinePlaceholder, { opacity: shimmerOpacity, width: '60%' }]} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {variant === 'section' && (
        <Animated.View style={[styles.mainTitlePlaceholder, { opacity: shimmerOpacity }]} />
      )}
      {Array.from({ length: count }, (_, index) =>
        variant === 'quickLinks' ? renderQuickLinkSkeleton(index) : renderSectionSkeleton(index)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  mainTitlePlaceholder: {
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 16,
    width: '40%',
  },
  linkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titlePlaceholder: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 4,
    width: '70%',
  },
  subtitlePlaceholder: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    width: '90%',
  },
  arrowPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitlePlaceholder: {
    height: 18,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 12,
    width: '50%',
  },
  sectionContent: {
    paddingLeft: 8,
  },
  contentLinePlaceholder: {
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 6,
  },
});