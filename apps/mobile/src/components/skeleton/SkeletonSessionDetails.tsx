import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';

const { width } = Dimensions.get('window');

export const SkeletonSessionDetails: React.FC = () => {
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Animated.View style={[styles.title, { opacity: shimmerOpacity }]} />
        <Animated.View style={[styles.shareButton, { opacity: shimmerOpacity }]} />
      </View>

      {/* Time Info */}
      <View style={styles.section}>
        <Animated.View style={[styles.timeInfo, { opacity: shimmerOpacity, width: 200 }]} />
        <Animated.View style={[styles.timeInfo, { opacity: shimmerOpacity, width: 240 }]} />
        <Animated.View style={[styles.timeInfo, { opacity: shimmerOpacity, width: 180 }]} />
      </View>

      {/* Stage Badge */}
      <View style={styles.section}>
        <Animated.View style={[styles.stageBadge, { opacity: shimmerOpacity }]} />
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Animated.View style={[styles.sectionTitle, { opacity: shimmerOpacity }]} />
        <Animated.View style={[styles.descriptionLine, { opacity: shimmerOpacity }]} />
        <Animated.View style={[styles.descriptionLine, { opacity: shimmerOpacity }]} />
        <Animated.View style={[styles.descriptionLine, { opacity: shimmerOpacity, width: '80%' }]} />
      </View>

      {/* Technical Details */}
      <View style={styles.section}>
        <Animated.View style={[styles.techDetail, { opacity: shimmerOpacity, width: 180 }]} />
        <Animated.View style={[styles.techDetail, { opacity: shimmerOpacity, width: 160 }]} />
      </View>

      {/* Speakers */}
      <View style={styles.section}>
        <Animated.View style={[styles.sectionTitle, { opacity: shimmerOpacity }]} />
        <View style={styles.speakerCard}>
          <Animated.View style={[styles.speakerPhoto, { opacity: shimmerOpacity }]} />
          <View style={styles.speakerInfo}>
            <Animated.View style={[styles.speakerName, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.speakerCompany, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.speakerPosition, { opacity: shimmerOpacity }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    width: width - 80,
    height: 32,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  shareButton: {
    width: 40,
    height: 40,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  timeInfo: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  stageBadge: {
    width: 120,
    height: 32,
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
  },
  sectionTitle: {
    width: 100,
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 12,
  },
  descriptionLine: {
    width: '100%',
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  techDetail: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  speakerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginTop: 8,
  },
  speakerPhoto: {
    width: 60,
    height: 60,
    backgroundColor: '#E0E0E0',
    borderRadius: 30,
  },
  speakerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  speakerName: {
    width: 150,
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 6,
  },
  speakerCompany: {
    width: 120,
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 6,
  },
  speakerPosition: {
    width: 100,
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
});