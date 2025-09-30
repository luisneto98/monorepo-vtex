import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EventDatesSectionProps {
  startDate: string | Date;
  endDate: string | Date;
}

export const EventDatesSection: React.FC<EventDatesSectionProps> = ({
  startDate,
  endDate,
}) => {
  const formatDate = (date: string | Date): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Data inválida';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>📅</Text>
        <Text style={styles.title}>Datas do Evento</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.dateRow}>
          <Text style={styles.label}>Início:</Text>
          <Text style={styles.value}>{formatDate(startDate)}</Text>
        </View>
        <View style={styles.dateRow}>
          <Text style={styles.label}>Término:</Text>
          <Text style={styles.value}>{formatDate(endDate)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    paddingLeft: 32,
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    width: 70,
  },
  value: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 1,
  },
});