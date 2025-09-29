import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SearchBar from '../../../src/components/search/SearchBar';

describe('SearchBar', () => {
  it('should render with placeholder', () => {
    const { getByPlaceholderText } = render(
      <SearchBar value="" onChangeText={jest.fn()} placeholder="Search here..." />
    );

    expect(getByPlaceholderText('Search here...')).toBeTruthy();
  });

  it('should display initial value', () => {
    const { getByDisplayValue } = render(
      <SearchBar value="test query" onChangeText={jest.fn()} />
    );

    expect(getByDisplayValue('test query')).toBeTruthy();
  });

  it('should call onChangeText after debounce delay', async () => {
    jest.useFakeTimers();
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <SearchBar value="" onChangeText={onChangeText} placeholder="Search..." debounceMs={300} />
    );

    const input = getByPlaceholderText('Search...');

    act(() => {
      fireEvent.changeText(input, 'new query');
    });

    // Should not call immediately
    expect(onChangeText).not.toHaveBeenCalled();

    // Fast-forward time by 300ms
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(onChangeText).toHaveBeenCalledWith('new query');
    });

    jest.useRealTimers();
  });

  it('should show clear button when there is text', () => {
    const { getByLabelText } = render(
      <SearchBar value="test" onChangeText={jest.fn()} />
    );

    expect(getByLabelText('Limpar busca')).toBeTruthy();
  });

  it('should not show clear button when text is empty', () => {
    const { queryByLabelText } = render(
      <SearchBar value="" onChangeText={jest.fn()} />
    );

    expect(queryByLabelText('Limpar busca')).toBeFalsy();
  });

  it('should clear text when clear button is pressed', async () => {
    const onChangeText = jest.fn();
    const { getByLabelText, getByPlaceholderText } = render(
      <SearchBar value="test" onChangeText={onChangeText} placeholder="Search..." />
    );

    fireEvent.press(getByLabelText('Limpar busca'));

    await waitFor(() => {
      expect(onChangeText).toHaveBeenCalledWith('');
    });
  });

  it('should call onClear callback when clear button is pressed', () => {
    const onClear = jest.fn();
    const { getByLabelText } = render(
      <SearchBar value="test" onChangeText={jest.fn()} onClear={onClear} />
    );

    fireEvent.press(getByLabelText('Limpar busca'));

    expect(onClear).toHaveBeenCalled();
  });

  it('should have proper accessibility attributes', () => {
    const { getByLabelText } = render(
      <SearchBar value="" onChangeText={jest.fn()} />
    );

    const input = getByLabelText('Campo de busca');
    expect(input).toBeTruthy();
  });
});