import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUpload } from '@/components/speakers/ImageUpload';
import { speakersService } from '@/services/speakers.service';

vi.mock('@/services/speakers.service');

describe('ImageUpload', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost:3000/mock-url');
  });

  it('renders upload area when no image', () => {
    render(<ImageUpload value="" onChange={mockOnChange} />);

    expect(screen.getByText(/Drag and drop an image here/)).toBeInTheDocument();
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
    expect(screen.getByText('Use URL')).toBeInTheDocument();
  });

  it('displays preview when value is provided', () => {
    render(
      <ImageUpload
        value="https://example.com/photo.jpg"
        onChange={mockOnChange}
      />
    );

    const img = screen.getByAltText('Speaker preview');
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('handles file upload with valid file', async () => {
    vi.mocked(speakersService.uploadPhoto).mockResolvedValueOnce({
      url: 'https://example.com/uploaded.jpg'
    });

    render(<ImageUpload value="" onChange={mockOnChange} />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(speakersService.uploadPhoto).toHaveBeenCalledWith(file);
      expect(mockOnChange).toHaveBeenCalledWith('https://example.com/uploaded.jpg');
    });
  });

  it('rejects files larger than 5MB', async () => {
    render(<ImageUpload value="" onChange={mockOnChange} />);

    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg'
    });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, largeFile);

    await waitFor(() => {
      expect(screen.getByText('File size must be less than 5MB.')).toBeInTheDocument();
      expect(speakersService.uploadPhoto).not.toHaveBeenCalled();
    });
  });

  it('rejects invalid file formats', async () => {
    render(<ImageUpload value="" onChange={mockOnChange} />);

    const invalidFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, invalidFile);

    await waitFor(() => {
      expect(screen.getByText(/Invalid file format/)).toBeInTheDocument();
      expect(speakersService.uploadPhoto).not.toHaveBeenCalled();
    });
  });

  it('handles drag and drop', async () => {
    vi.mocked(speakersService.uploadPhoto).mockResolvedValueOnce({
      url: 'https://example.com/dropped.jpg'
    });

    render(<ImageUpload value="" onChange={mockOnChange} />);

    const dropZone = screen.getByText(/Drag and drop an image here/).parentElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    const dragEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: { files: [file] }
    });

    fireEvent(dropZone!, dragEvent);

    await waitFor(() => {
      expect(speakersService.uploadPhoto).toHaveBeenCalledWith(file);
    });
  });

  it('shows upload progress', async () => {
    vi.mocked(speakersService.uploadPhoto).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ url: 'test.jpg' }), 100))
    );

    render(<ImageUpload value="" onChange={mockOnChange} />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    expect(screen.getByText('Uploading image...')).toBeInTheDocument();
  });

  it('handles upload errors', async () => {
    vi.mocked(speakersService.uploadPhoto).mockRejectedValueOnce(
      new Error('Upload failed')
    );

    render(<ImageUpload value="" onChange={mockOnChange} />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Failed to upload image')).toBeInTheDocument();
    });
  });

  it('removes image when X button is clicked', () => {
    render(
      <ImageUpload
        value="https://example.com/photo.jpg"
        onChange={mockOnChange}
      />
    );

    const removeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('handles URL input', () => {
    window.prompt = vi.fn(() => 'https://example.com/new-photo.jpg');

    render(<ImageUpload value="" onChange={mockOnChange} />);

    const urlButton = screen.getByText('Use URL');
    fireEvent.click(urlButton);

    expect(mockOnChange).toHaveBeenCalledWith('https://example.com/new-photo.jpg');
  });

  it('validates URL format', () => {
    window.prompt = vi.fn(() => 'invalid-url');

    render(<ImageUpload value="" onChange={mockOnChange} />);

    const urlButton = screen.getByText('Use URL');
    fireEvent.click(urlButton);

    expect(screen.getByText('Invalid URL format')).toBeInTheDocument();
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('disables inputs when disabled prop is true', () => {
    render(<ImageUpload value="" onChange={mockOnChange} disabled />);

    const uploadButton = screen.getByText('Upload Image');
    expect(uploadButton).toBeDisabled();

    const urlButton = screen.getByText('Use URL');
    expect(urlButton).toBeDisabled();
  });
});