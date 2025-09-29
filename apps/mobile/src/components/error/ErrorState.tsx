import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDebounce } from '../../utils/debounce';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  retryText?: string;
  title?: string;
}

export default function ErrorState({
  error,
  onRetry,
  retryText = 'Tentar Novamente',
  title = 'Erro de Conexão'
}: ErrorStateProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryInner = useCallback(async () => {
    if (isRetrying) return;

    setIsRetrying(true);

    try {
      await onRetry();
    } finally {
      setTimeout(() => {
        setIsRetrying(false);
      }, 1000);
    }
  }, [isRetrying, onRetry]);

  const handleRetry = useDebounce(handleRetryInner, 300);

  const isNetworkError = error.toLowerCase().includes('network') ||
                         error.toLowerCase().includes('connection') ||
                         error.toLowerCase().includes('timeout');

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>
          {isNetworkError ? '📶' : '⚠️'}
        </Text>

        <Text style={styles.title}>{title}</Text>

        <Text style={styles.message}>
          {isNetworkError
            ? 'Verifique sua conexão com a internet e tente novamente.'
            : error || 'Ocorreu um erro inesperado. Tente novamente.'}
        </Text>

        <TouchableOpacity
          style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
          onPress={handleRetry}
          disabled={isRetrying}
        >
          <Text style={[styles.retryButtonText, isRetrying && styles.retryButtonTextDisabled]}>
            {isRetrying ? 'Tentando...' : retryText}
          </Text>
        </TouchableOpacity>

        {isNetworkError && (
          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>Dicas:</Text>
            <Text style={styles.tip}>• Verifique sua conexão Wi-Fi</Text>
            <Text style={styles.tip}>• Verifique seus dados móveis</Text>
            <Text style={styles.tip}>• Tente novamente em alguns instantes</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0F47AF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    minWidth: 140,
  },
  retryButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButtonTextDisabled: {
    color: '#888888',
  },
  tips: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  tip: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
    lineHeight: 16,
  },
});