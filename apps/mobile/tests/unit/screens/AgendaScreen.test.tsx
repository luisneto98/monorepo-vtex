import React from 'react';
import { render } from '@testing-library/react-native';
import AgendaScreen from '../../../src/screens/Agenda/AgendaScreen';

describe('AgendaScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<AgendaScreen />);

    expect(getByText('Agenda')).toBeTruthy();
    expect(getByText('Programação e sessões do evento')).toBeTruthy();
  });
});