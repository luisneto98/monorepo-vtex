import React from 'react';
import { render } from '@testing-library/react-native';
import MoreScreen from '../../../src/screens/More/MoreScreen';

describe('MoreScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MoreScreen />);

    expect(getByText('Mais')).toBeTruthy();
    expect(getByText('Configurações e opções adicionais')).toBeTruthy();
  });
});