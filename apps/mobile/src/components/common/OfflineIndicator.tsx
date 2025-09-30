import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetwork } from '../../contexts/NetworkContext';

export const OfflineIndicator: React.FC = () => {
  const { isConnected } = useNetwork();
  const [translateY] = useState(new Animated.Value(-50));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      // Show indicator
      setIsVisible(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else if (isVisible) {
      // Hide indicator
      Animated.timing(translateY, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false);
      });
    }
  }, [isConnected]);

  if (!isVisible && isConnected) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
      accessibilityLabel="Modo offline: sem conexão com a internet"
      accessibilityHint="Conecte-se para atualizar os dados"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.content}>
        <Text style={styles.icon}>📵</Text>
        <Text style={styles.text}>Sem conexão com a internet</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9998,
    backgroundColor: '#FFA500',
    paddingTop: 40,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});