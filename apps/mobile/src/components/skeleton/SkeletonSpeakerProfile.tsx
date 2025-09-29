import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';

const { width } = Dimensions.get('window');

export const SkeletonSpeakerProfile: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header Photo */}
      <SkeletonLoader width={width} height={width * 0.6} borderRadius={0} />

      {/* Info Section */}
      <View style={styles.infoSection}>
        <SkeletonLoader width={200} height={28} style={styles.row} />
        <SkeletonLoader width={180} height={18} style={styles.row} />
        <SkeletonLoader width={160} height={16} style={styles.row} />
      </View>

      {/* Social Links */}
      <View style={styles.socialSection}>
        <SkeletonLoader width={120} height={18} style={styles.sectionTitle} />
        <View style={styles.socialLinks}>
          <SkeletonLoader width={110} height={40} borderRadius={20} style={styles.socialButton} />
          <SkeletonLoader width={100} height={40} borderRadius={20} style={styles.socialButton} />
          <SkeletonLoader width={95} height={40} borderRadius={20} style={styles.socialButton} />
        </View>
      </View>

      {/* Biography */}
      <View style={styles.section}>
        <SkeletonLoader width={100} height={20} style={styles.sectionTitle} />
        <SkeletonLoader width="100%" height={16} style={styles.row} />
        <SkeletonLoader width="100%" height={16} style={styles.row} />
        <SkeletonLoader width="100%" height={16} style={styles.row} />
        <SkeletonLoader width="90%" height={16} style={styles.row} />
      </View>

      {/* Other Sessions */}
      <View style={styles.section}>
        <SkeletonLoader width={150} height={20} style={styles.sectionTitle} />
        <View style={styles.sessionCard}>
          <SkeletonLoader width="100%" height={20} style={styles.row} />
          <SkeletonLoader width="80%" height={16} style={styles.row} />
          <SkeletonLoader width="60%" height={16} style={styles.row} />
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
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  socialSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  socialLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  socialButton: {
    marginRight: 12,
    marginTop: 8,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  row: {
    marginBottom: 8,
  },
  sessionCard: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginTop: 8,
  },
});