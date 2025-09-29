import React from 'react';
import { render } from '@testing-library/react-native';
import RichTextRenderer from '../../../src/components/faq/RichTextRenderer';

describe('RichTextRenderer', () => {
  it('should render plain text', () => {
    const { getByText } = render(<RichTextRenderer html="Simple text" />);

    expect(getByText('Simple text')).toBeTruthy();
  });

  it('should render bold text', () => {
    const { getByText } = render(<RichTextRenderer html="<b>Bold text</b>" />);

    expect(getByText('Bold text')).toBeTruthy();
  });

  it('should render italic text', () => {
    const { getByText } = render(<RichTextRenderer html="<i>Italic text</i>" />);

    expect(getByText('Italic text')).toBeTruthy();
  });

  it('should render links', () => {
    const { getByText } = render(
      <RichTextRenderer html='<a href="https://example.com">Link text</a>' />
    );

    expect(getByText('Link text')).toBeTruthy();
  });

  it('should render unordered list', () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const { getByText } = render(<RichTextRenderer html={html} />);

    expect(getByText(/Item 1/)).toBeTruthy();
    expect(getByText(/Item 2/)).toBeTruthy();
  });

  it('should render ordered list', () => {
    const html = '<ol><li>First</li><li>Second</li></ol>';
    const { getByText } = render(<RichTextRenderer html={html} />);

    expect(getByText(/First/)).toBeTruthy();
    expect(getByText(/Second/)).toBeTruthy();
  });

  it('should sanitize script tags', () => {
    const html = '<script>alert("xss")</script><p>Safe content</p>';
    const { getByText, queryByText } = render(<RichTextRenderer html={html} />);

    expect(getByText('Safe content')).toBeTruthy();
    expect(queryByText('alert')).toBeFalsy();
  });

  it('should handle empty content', () => {
    const { getByText } = render(<RichTextRenderer html="" />);

    expect(getByText('Sem conteúdo disponível')).toBeTruthy();
  });

  it('should handle null content gracefully', () => {
    const { getByText } = render(<RichTextRenderer html={null as any} />);

    expect(getByText('Sem conteúdo disponível')).toBeTruthy();
  });

  it('should handle malformed HTML', () => {
    const html = '<p>Unclosed paragraph';
    const { getByText } = render(<RichTextRenderer html={html} />);

    expect(getByText(/Unclosed paragraph/)).toBeTruthy();
  });

  it('should render mixed content', () => {
    const html = '<p>This is <b>bold</b> and <i>italic</i> text with a <a href="#">link</a></p>';
    const { getByText } = render(<RichTextRenderer html={html} />);

    expect(getByText(/bold/)).toBeTruthy();
    expect(getByText(/italic/)).toBeTruthy();
    expect(getByText('link')).toBeTruthy();
  });
});