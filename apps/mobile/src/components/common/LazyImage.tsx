import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  Animated,
  StyleSheet,
  ImageProps,
  ImageSourcePropType,
  ViewStyle,
  ImageStyle,
  ActivityIndicator,
  Text,
} from 'react-native';

interface LazyImageProps extends Omit<ImageProps, 'source'> {
  source: ImageSourcePropType;
  placeholder?: ImageSourcePropType;
  containerStyle?: ViewStyle;
  imageStyle?: ImageStyle;
  fadeDuration?: number;
  thumbnailSource?: ImageSourcePropType;
  showLoadingIndicator?: boolean;
  loadingIndicatorColor?: string;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  source,
  placeholder,
  containerStyle,
  imageStyle,
  fadeDuration = 300,
  thumbnailSource,
  showLoadingIndicator = true,
  loadingIndicatorColor = '#0066CC',
  onLoadStart,
  onLoadEnd,
  onError,
  ...imageProps
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(!!thumbnailSource);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const thumbnailFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isLoading && !hasError) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: fadeDuration,
        useNativeDriver: true,
      }).start();

      if (showThumbnail) {
        Animated.timing(thumbnailFadeAnim, {
          toValue: 0,
          duration: fadeDuration,
          useNativeDriver: true,
        }).start(() => {
          setShowThumbnail(false);
        });
      }
    }
  }, [isLoading, hasError, fadeDuration, showThumbnail]);

  const handleLoadStart = () => {
    setIsLoading(true);
    onLoadStart?.();
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    onLoadEnd?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Use default view instead of image assets for now
  const defaultPlaceholder = null;
  const errorImage = null;

  return (
    <View style={[styles.container, containerStyle]}>
      {showLoadingIndicator && isLoading && !showThumbnail && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={loadingIndicatorColor} size="small" />
        </View>
      )}

      {showThumbnail && thumbnailSource && (
        <Animated.Image
          source={thumbnailSource}
          style={[
            StyleSheet.absoluteFillObject,
            imageStyle,
            {
              opacity: thumbnailFadeAnim,
            },
          ]}
          blurRadius={2}
          {...imageProps}
        />
      )}

      {hasError ? (
        placeholder ? (
          <Image
            source={placeholder}
            style={[styles.image, imageStyle]}
            {...imageProps}
          />
        ) : (
          <View style={[styles.errorContainer, imageStyle]}>
            <Text style={styles.errorText}>⚠️</Text>
          </View>
        )
      ) : (
        <Animated.Image
          source={source}
          style={[
            styles.image,
            imageStyle,
            {
              opacity: fadeAnim,
            },
          ]}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          {...imageProps}
        />
      )}

      {!hasError && placeholder && isLoading && !showThumbnail && (
        <Image
          source={placeholder}
          style={[
            StyleSheet.absoluteFillObject,
            imageStyle,
          ]}
          {...imageProps}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 24,
    color: '#999999',
  },
});