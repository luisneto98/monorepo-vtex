import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUploadZone } from './FileUploadZone';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
jest.mock('react-dropzone');
jest.mock('@/hooks/use-toast');

describe('FileUploadZone', () => {
  const mockOnUpload = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  it('should render upload zone with default props', () => {
    (useDropzone as jest.Mock).mockReturnValue({
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: false,
    });

    render(<FileUploadZone onUpload={mockOnUpload} />);

    expect(screen.getByText(/drag & drop your pdf file here/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to select/i)).toBeInTheDocument();
  });

  it('should show drag active state', () => {
    (useDropzone as jest.Mock).mockReturnValue({
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: true,
    });

    render(<FileUploadZone onUpload={mockOnUpload} />);

    expect(screen.getByText(/drop the file here/i)).toBeInTheDocument();
  });

  it('should handle file selection', async () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    let onDropCallback: any;

    (useDropzone as jest.Mock).mockImplementation(({ onDrop }) => {
      onDropCallback = onDrop;
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false,
      };
    });

    const { rerender } = render(<FileUploadZone onUpload={mockOnUpload} />);

    // Simulate file drop
    await waitFor(() => {
      onDropCallback([mockFile], []);
    });

    rerender(<FileUploadZone onUpload={mockOnUpload} />);

    // Check if upload button appears after file selection
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });

  it('should show error for oversized files', async () => {
    let onDropCallback: any;

    (useDropzone as jest.Mock).mockImplementation(({ onDrop }) => {
      onDropCallback = onDrop;
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false,
      };
    });

    render(<FileUploadZone onUpload={mockOnUpload} maxSize={1024} />);

    const rejectedFile = {
      errors: [{ code: 'file-too-large', message: 'File is too large' }],
    };

    await waitFor(() => {
      onDropCallback([], [rejectedFile]);
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'File too large',
      description: expect.stringContaining('File must be smaller than'),
      variant: 'destructive',
    });
  });

  it('should show error for invalid file types', async () => {
    let onDropCallback: any;

    (useDropzone as jest.Mock).mockImplementation(({ onDrop }) => {
      onDropCallback = onDrop;
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false,
      };
    });

    render(<FileUploadZone onUpload={mockOnUpload} />);

    const rejectedFile = {
      errors: [{ code: 'file-invalid-type', message: 'Invalid file type' }],
    };

    await waitFor(() => {
      onDropCallback([], [rejectedFile]);
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Invalid file type',
      description: 'Only PDF files are allowed',
      variant: 'destructive',
    });
  });

  it('should call onUpload when upload button is clicked', async () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    let onDropCallback: any;

    (useDropzone as jest.Mock).mockImplementation(({ onDrop }) => {
      onDropCallback = onDrop;
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false,
      };
    });

    const { rerender } = render(<FileUploadZone onUpload={mockOnUpload} />);

    // Simulate file selection
    await waitFor(() => {
      onDropCallback([mockFile], []);
    });

    rerender(<FileUploadZone onUpload={mockOnUpload} />);

    // Click upload button
    const uploadButton = screen.getByRole('button', { name: /upload/i });
    fireEvent.click(uploadButton);

    expect(mockOnUpload).toHaveBeenCalledWith(mockFile);
  });

  it('should allow file removal before upload', async () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    let onDropCallback: any;

    (useDropzone as jest.Mock).mockImplementation(({ onDrop }) => {
      onDropCallback = onDrop;
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false,
      };
    });

    const { rerender } = render(<FileUploadZone onUpload={mockOnUpload} />);

    // Simulate file selection
    await waitFor(() => {
      onDropCallback([mockFile], []);
    });

    rerender(<FileUploadZone onUpload={mockOnUpload} />);

    // Click remove button
    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    rerender(<FileUploadZone onUpload={mockOnUpload} />);

    // File should be removed
    expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
  });

  it('should accept custom accept prop', () => {
    let dropzoneConfig: any;

    (useDropzone as jest.Mock).mockImplementation((config) => {
      dropzoneConfig = config;
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false,
      };
    });

    render(<FileUploadZone onUpload={mockOnUpload} accept="image/png" />);

    expect(dropzoneConfig.accept).toEqual({ 'image/png': [] });
  });

  it('should use default maxSize when not provided', () => {
    let dropzoneConfig: any;

    (useDropzone as jest.Mock).mockImplementation((config) => {
      dropzoneConfig = config;
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false,
      };
    });

    render(<FileUploadZone onUpload={mockOnUpload} />);

    expect(dropzoneConfig.maxSize).toEqual(10 * 1024 * 1024); // 10MB
  });
});