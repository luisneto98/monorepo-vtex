import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';

const { width } = Dimensions.get('window');

export const SkeletonSessionDetails: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonLoader width={width - 80} height={32} style={styles.title} />
        <SkeletonLoader width={40} height={40} style={styles.shareButton} />
      </View>

      {/* Time Info */}
      <View style={styles.section}>
        <SkeletonLoader width={200} height={16} style={styles.row} />
        <SkeletonLoader width={240} height={16} style={styles.row} />
        <SkeletonLoader width={180} height={16} style={styles.row} />
      </View>

      {/* Stage Badge */}
      <View style={styles.section}>
        <SkeletonLoader width={120} height={32} borderRadius={16} />
      </View>

      {/* Description */}
      <View style={styles.section}>
        <SkeletonLoader width={100} height={20} style={styles.sectionTitle} />
        <SkeletonLoader width="100%" height={16} style={styles.row} />
        <SkeletonLoader width="100%" height={16} style={styles.row} />
        <SkeletonLoader width="80%" height={16} style={styles.row} />
      </View>

      {/* Technical Details */}
      <View style={styles.section}>
        <SkeletonLoader width={180} height={16} style={styles.row} />
        <SkeletonLoader width={160} height={16} style={styles.row} />
      </View>

      {/* Speakers */}
      <View style={styles.section}>
        <SkeletonLoader width={120} height={20} style={styles.sectionTitle} />
        <View style={styles.speakerCard}>
          <SkeletonLoader width={60} height={60} borderRadius={30} />
          <View style={styles.speakerInfo}>
            <SkeletonLoader width={150} height={16} style={styles.row} />
            <SkeletonLoader width={120} height={14} style={styles.row} />
            <SkeletonLoader width={100} height={14} style={styles.row} />
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
    marginBottom: 0,
  },
  shareButton: {
    borderRadius: 20,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  row: {
    marginBottom: 8,
  },
  speakerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  speakerInfo: {
    flex: 1,
    marginLeft: 12,
  },
});