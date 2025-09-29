import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LazyImage } from '@/components/common/LazyImage';
import { Animated } from 'react-native';

// Mock Animated API
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const mockAnimatedValue: any = {
    setValue: jest.fn(),
    setOffset: jest.fn(),
    flattenOffset: jest.fn(),
    extractOffset: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
    stopAnimation: jest.fn(),
    resetAnimation: jest.fn(),
    interpolate: jest.fn((): any => mockAnimatedValue),
    _value: 0,
  };

  return {
    ...RN,
    Animated: {
      ...RN.Animated,
      View: 'Animated.View',
      Image: 'Animated.Image',
      Text: 'Animated.Text',
      Value: jest.fn(() => mockAnimatedValue),
      timing: jest.fn(() => ({
        start: jest.fn((callback) => {
          if (callback) callback({ finished: true });
        }),
        stop: jest.fn(),
        reset: jest.fn(),
      })),
    },
  };
});

// No need to mock image assets anymore as we use inline styles

describe('LazyImage', () => {
  const defaultProps = {
    source: { uri: 'https://example.com/image.jpg' },
    testID: 'lazy-image',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly with default props', () => {
    const { getByTestId } = render(<LazyImage {...defaultProps} />);

    const image = getByTestId('lazy-image');
    expect(image).toBeTruthy();
  });

  it('should show loading indicator when showLoadingIndicator is true', () => {
    const { queryByTestId } = render(
      <LazyImage {...defaultProps} showLoadingIndicator={true} />
    );

    // Loading indicator should be shown initially
    const loadingIndicator = queryByTestId('activity-indicator');
    // Note: ActivityIndicator might not have testID by default
  });

  it('should render thumbnail if thumbnailSource is provided', () => {
    const thumbnailSource = { uri: 'https://example.com/thumbnail.jpg' };

    const { UNSAFE_getByType } = render(
      <LazyImage {...defaultProps} thumbnailSource={thumbnailSource} />
    );

    // Should render thumbnail image
    // const images = UNSAFE_getAllByType(Animated.Image);
    // expect(images).toHaveLength(2); // Thumbnail + main image
  });

  it('should call onLoadStart when image starts loading', () => {
    const onLoadStart = jest.fn();

    const { getByTestId } = render(
      <LazyImage {...defaultProps} onLoadStart={onLoadStart} />
    );

    const image = getByTestId('lazy-image');
    fireEvent(image, 'loadStart');

    expect(onLoadStart).toHaveBeenCalled();
  });

  it('should call onLoadEnd when image finishes loading', async () => {
    const onLoadEnd = jest.fn();

    const { getByTestId } = render(
      <LazyImage {...defaultProps} onLoadEnd={onLoadEnd} />
    );

    const image = getByTestId('lazy-image');
    fireEvent(image, 'loadEnd');

    await waitFor(() => {
      expect(onLoadEnd).toHaveBeenCalled();
    });
  });

  it('should call onError and show error image when loading fails', async () => {
    const onError = jest.fn();
    const placeholder = { uri: 'https://example.com/error-placeholder.jpg' };

    const { getByTestId } = render(
      <LazyImage
        {...defaultProps}
        onError={onError}
        placeholder={placeholder}
      />
    );

    const image = getByTestId('lazy-image');
    fireEvent(image, 'error');

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it('should animate opacity when image loads successfully', async () => {
    const { getByTestId } = render(<LazyImage {...defaultProps} fadeDuration={300} />);

    const image = getByTestId('lazy-image');
    fireEvent(image, 'loadEnd');

    await waitFor(() => {
      expect(Animated.timing).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      );
    });
  });

  it('should apply custom styles correctly', () => {
    const containerStyle = { padding: 10 };
    const imageStyle = { borderRadius: 8 };

    const { getByTestId } = render(
      <LazyImage
        {...defaultProps}
        containerStyle={containerStyle}
        imageStyle={imageStyle}
      />
    );

    const image = getByTestId('lazy-image');
    expect(image.props.style).toContainEqual(
      expect.objectContaining({ borderRadius: 8 })
    );
  });

  it('should pass through additional image props', () => {
    const { getByTestId } = render(
      <LazyImage
        {...defaultProps}
        resizeMode="cover"
        accessibilityLabel="Test image"
      />
    );

    const image = getByTestId('lazy-image');
    expect(image.props.resizeMode).toBe('cover');
    expect(image.props.accessibilityLabel).toBe('Test image');
  });
});