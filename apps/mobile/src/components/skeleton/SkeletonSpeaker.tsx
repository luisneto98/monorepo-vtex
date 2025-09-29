import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function SkeletonSpeaker() {
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
      <View style={styles.imageContainer}>
        <Animated.View style={[styles.photoPlaceholder, { opacity: shimmerOpacity }]} />
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.namePlaceholder, { opacity: shimmerOpacity }]} />
        <Animated.View style={[styles.namePlaceholder, { opacity: shimmerOpacity, width: '70%' }]} />

        <Animated.View style={[styles.positionPlaceholder, { opacity: shimmerOpacity }]} />

        <Animated.View style={[styles.companyPlaceholder, { opacity: shimmerOpacity }]} />

        <View style={styles.bioSection}>
          <Animated.View style={[styles.bioPlaceholder, { opacity: shimmerOpacity }]} />
          <Animated.View style={[styles.bioPlaceholder, { opacity: shimmerOpacity, width: '80%' }]} />
          <Animated.View style={[styles.bioPlaceholder, { opacity: shimmerOpacity, width: '60%' }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 8,
    width: 160,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  namePlaceholder: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 4,
    width: '90%',
  },
  positionPlaceholder: {
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 2,
    width: '80%',
  },
  companyPlaceholder: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
    width: '70%',
  },
  bioSection: {
    width: '100%',
    alignItems: 'center',
  },
  bioPlaceholder: {
    height: 11,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 2,
    width: '100%',
  },
});