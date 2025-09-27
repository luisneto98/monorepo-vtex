import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LogoUpload } from '../../../../src/components/sponsors/LogoUpload';

describe('LogoUpload', () => {
  const mockOnUpload = vi.fn();
  const mockFile = new File(['logo content'], 'logo.png', { type: 'image/png' });

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders upload area', () => {
    render(<LogoUpload onUpload={mockOnUpload} />);

    expect(screen.getByText(/drag.*drop.*logo/i)).toBeInTheDocument();
    expect(screen.getByText(/click to select/i)).toBeInTheDocument();
  });

  it('displays existing logo', () => {
    render(<LogoUpload logoUrl="https://example.com/logo.png" onUpload={mockOnUpload} />);

    const logo = screen.getByAltText(/sponsor logo/i);
    expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('handles file selection via click', async () => {
    render(<LogoUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText(/select logo/i) as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(mockFile);
    });
  });

  it('handles drag and drop', async () => {
    render(<LogoUpload onUpload={mockOnUpload} />);

    const dropZone = screen.getByText(/drag.*drop.*logo/i).closest('div');

    fireEvent.dragOver(dropZone!, { dataTransfer: { files: [mockFile] } });
    expect(dropZone).toHaveClass('border-primary');

    fireEvent.drop(dropZone!, { dataTransfer: { files: [mockFile] } });

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(mockFile);
    });
  });

  it('validates file type', async () => {
    const invalidFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });

    render(<LogoUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText(/select logo/i) as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [invalidFile],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/please upload.*image/i)).toBeInTheDocument();
    });

    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  it('validates file size', async () => {
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });

    render(<LogoUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText(/select logo/i) as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/file size.*5MB/i)).toBeInTheDocument();
    });

    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  it('shows upload progress', async () => {
    render(<LogoUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText(/select logo/i) as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(input);

    expect(screen.getByText(/uploading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalled();
    });
  });

  it('handles upload error', async () => {
    const errorMock = vi.fn().mockRejectedValue(new Error('Upload failed'));
    render(<LogoUpload onUpload={errorMock} />);

    const input = screen.getByLabelText(/select logo/i) as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });
  });

  it('allows logo replacement', async () => {
    render(<LogoUpload logoUrl="https://example.com/old-logo.png" onUpload={mockOnUpload} />);

    const replaceButton = screen.getByRole('button', { name: /replace logo/i });
    fireEvent.click(replaceButton);

    const input = screen.getByLabelText(/select logo/i) as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(mockFile);
    });
  });

  it('accepts URL input as fallback', async () => {
    render(<LogoUpload onUpload={mockOnUpload} allowUrlInput />);

    const urlButton = screen.getByRole('button', { name: /use url/i });
    fireEvent.click(urlButton);

    const urlInput = screen.getByPlaceholderText(/logo url/i);
    fireEvent.change(urlInput, { target: { value: 'https://example.com/new-logo.png' } });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith('https://example.com/new-logo.png');
    });
  });

  it('supports multiple image formats', () => {
    render(<LogoUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText(/select logo/i) as HTMLInputElement;
    expect(input.getAttribute('accept')).toContain('image/jpeg');
    expect(input.getAttribute('accept')).toContain('image/png');
    expect(input.getAttribute('accept')).toContain('image/svg+xml');
    expect(input.getAttribute('accept')).toContain('image/webp');
  });

  it('cleans up blob URLs on unmount', () => {
    const { unmount } = render(<LogoUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText(/select logo/i) as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(input);

    unmount();

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});