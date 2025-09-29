import React from 'react';
import { render } from '@testing-library/react-native';
import SearchScreen from '../../../src/screens/Search/SearchScreen';

describe('SearchScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<SearchScreen />);

    expect(getByText('Buscar')).toBeTruthy();
    expect(getByText('Pesquise sessões, palestrantes e mais')).toBeTruthy();
  });
});