import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Speaker } from '@monorepo-vtex/shared';
import { LazyImage } from '../common/LazyImage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 64;
const CARD_MARGIN = 16;

interface SpeakersCarouselProps {
  speakers: Speaker[];
  onSpeakerPress: (speaker: Speaker) => void;
}

const SpeakersCarousel: React.FC<SpeakersCarouselProps> = ({
  speakers,
  onSpeakerPress,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (CARD_WIDTH + CARD_MARGIN * 2));
    setActiveIndex(index);
  };

  const scrollToIndex = (index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
      setActiveIndex(index);
    }
  };

  const renderSpeakerCard = ({ item: speaker }: { item: Speaker }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onSpeakerPress(speaker)}
      accessibilityLabel={`Ver perfil de ${speaker.name}`}
      accessibilityRole="button"
    >
      <LazyImage
        source={{ uri: speaker.photoUrl }}
        containerStyle={styles.photoContainer}
        imageStyle={styles.photo}
        showLoadingIndicator
      />
      <View style={styles.cardContent}>
        <Text style={styles.name} numberOfLines={1}>
          {speaker.name}
        </Text>
        <Text style={styles.company} numberOfLines={1}>
          {speaker.company}
        </Text>
        <Text style={styles.position} numberOfLines={2}>
          {speaker.position['pt-BR']}
        </Text>
      </View>
      {speaker.isHighlight && (
        <View style={styles.highlightBadge}>
          <Text style={styles.highlightText}>⭐</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPaginationDot = (index: number) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.dot,
        index === activeIndex && styles.activeDot,
      ]}
      onPress={() => scrollToIndex(index)}
      accessibilityLabel={`Ir para palestrante ${index + 1}`}
      accessibilityRole="button"
    />
  );

  if (speakers.length === 0) {
    return null;
  }

  if (speakers.length === 1) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.singleCard}
          onPress={() => onSpeakerPress(speakers[0])}
          accessibilityLabel={`Ver perfil de ${speakers[0].name}`}
          accessibilityRole="button"
        >
          <LazyImage
            source={{ uri: speakers[0].photoUrl }}
            containerStyle={styles.singlePhotoContainer}
            imageStyle={styles.singlePhoto}
            showLoadingIndicator
          />
          <View style={styles.singleCardContent}>
            <Text style={styles.name}>{speakers[0].name}</Text>
            <Text style={styles.company}>{speakers[0].company}</Text>
            <Text style={styles.position}>{speakers[0].position['pt-BR']}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={speakers}
        renderItem={renderSpeakerCard}
        keyExtractor={(item) => item._id}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: CARD_WIDTH + CARD_MARGIN * 2,
          offset: (CARD_WIDTH + CARD_MARGIN * 2) * index,
          index,
        })}
      />

      {speakers.length > 1 && (
        <View style={styles.pagination}>
          {speakers.map((_, index) => renderPaginationDot(index))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  listContent: {
    paddingHorizontal: CARD_MARGIN,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: CARD_MARGIN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  photoContainer: {
    width: '100%',
    height: 200,
  },
  photo: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F47AF',
    marginBottom: 4,
  },
  company: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  position: {
    fontSize: 14,
    color: '#666666',
  },
  highlightBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightText: {
    fontSize: 20,
  },
  singleCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  singlePhotoContainer: {
    width: '100%',
    height: 200,
  },
  singlePhoto: {
    width: '100%',
    height: 200,
  },
  singleCardContent: {
    padding: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CCCCCC',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#0F47AF',
  },
});

export default SpeakersCarousel;