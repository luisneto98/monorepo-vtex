import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../../../src/screens/Home/HomeScreen';

describe('HomeScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Página inicial do app VTEX Events')).toBeTruthy();
  });
});