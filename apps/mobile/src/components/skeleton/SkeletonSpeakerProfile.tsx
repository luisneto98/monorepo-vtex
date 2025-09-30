import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';

const { width } = Dimensions.get('window');

export const SkeletonSpeakerProfile: React.FC = () => {
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
      {/* Header Photo */}
      <Animated.View style={[styles.photoPlaceholder, { opacity: shimmerOpacity }]} />

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Animated.View style={[styles.namePlaceholder, { opacity: shimmerOpacity }]} />
        <Animated.View style={[styles.companyPlaceholder, { opacity: shimmerOpacity }]} />
        <Animated.View style={[styles.positionPlaceholder, { opacity: shimmerOpacity }]} />
      </View>

      {/* Social Links */}
      <View style={styles.socialSection}>
        <Animated.View style={[styles.sectionTitlePlaceholder, { opacity: shimmerOpacity }]} />
        <View style={styles.socialLinks}>
          <Animated.View style={[styles.socialButton, { opacity: shimmerOpacity }]} />
          <Animated.View style={[styles.socialButton, { opacity: shimmerOpacity, width: 100 }]} />
          <Animated.View style={[styles.socialButton, { opacity: shimmerOpacity, width: 95 }]} />
        </View>
      </View>

      {/* Biography */}
      <View style={styles.section}>
        <Animated.View style={[styles.bioTitlePlaceholder, { opacity: shimmerOpacity }]} />
        <Animated.View style={[styles.bioLine, { opacity: shimmerOpacity }]} />
        <Animated.View style={[styles.bioLine, { opacity: shimmerOpacity }]} />
        <Animated.View style={[styles.bioLine, { opacity: shimmerOpacity }]} />
        <Animated.View style={[styles.bioLine, { opacity: shimmerOpacity, width: '90%' }]} />
      </View>

      {/* Other Sessions */}
      <View style={styles.section}>
        <Animated.View style={[styles.sessionsTitlePlaceholder, { opacity: shimmerOpacity }]} />
        <View style={styles.sessionCard}>
          <Animated.View style={[styles.sessionTitlePlaceholder, { opacity: shimmerOpacity }]} />
          <Animated.View style={[styles.sessionInfoPlaceholder, { opacity: shimmerOpacity }]} />
          <Animated.View style={[styles.sessionInfoPlaceholder, { opacity: shimmerOpacity, width: '60%' }]} />
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
  photoPlaceholder: {
    width: width,
    height: width * 0.6,
    backgroundColor: '#E0E0E0',
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  namePlaceholder: {
    height: 28,
    width: 200,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  companyPlaceholder: {
    height: 18,
    width: 180,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 4,
  },
  positionPlaceholder: {
    height: 16,
    width: 160,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  socialSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sectionTitlePlaceholder: {
    height: 18,
    width: 120,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 12,
  },
  socialLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  socialButton: {
    width: 110,
    height: 40,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    marginRight: 12,
    marginTop: 8,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  bioTitlePlaceholder: {
    height: 20,
    width: 100,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 12,
  },
  bioLine: {
    height: 16,
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  sessionsTitlePlaceholder: {
    height: 20,
    width: 150,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 12,
  },
  sessionCard: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginTop: 8,
  },
  sessionTitlePlaceholder: {
    height: 20,
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  sessionInfoPlaceholder: {
    height: 16,
    width: '80%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 6,
  },
});