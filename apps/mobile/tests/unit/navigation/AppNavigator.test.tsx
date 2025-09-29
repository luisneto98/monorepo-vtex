import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from '../../../src/navigation/AppNavigator';

jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'vtexevents://'),
}));

describe('AppNavigator', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<AppNavigator />);
    expect(() => getByText('Home')).not.toThrow();
  });
});