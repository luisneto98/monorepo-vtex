import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileUploadZone } from '../FileUploadZone';

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn()
}));

// Mock hooks
jest.mock('../../../hooks/useFileUpload', () => ({
  useFileUpload: jest.fn(() => ({
    files: [],
    uploadFile: jest.fn(),
    removeFile: jest.fn(),
    clearFiles: jest.fn()
  }))
}));

describe('FileUploadZone', () => {
  const mockOnFilesUploaded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    const { useDropzone } = require('react-dropzone');
    useDropzone.mockReturnValue({
      getRootProps: () => ({ role: 'button', tabIndex: 0 }),
      getInputProps: () => ({ type: 'file' }),
      isDragActive: false
    });
  });

  it('renders upload zone', () => {
    render(<FileUploadZone onFilesUploaded={mockOnFilesUploaded} />);

    expect(screen.getByText(/Drag files here or click to select/)).toBeInTheDocument();
    expect(screen.getByText(/PDF, ZIP, Images or Videos/)).toBeInTheDocument();
  });

  it('shows drag active state', () => {
    const { useDropzone } = require('react-dropzone');
    useDropzone.mockReturnValue({
      getRootProps: () => ({ role: 'button', tabIndex: 0 }),
      getInputProps: () => ({ type: 'file' }),
      isDragActive: true
    });

    render(<FileUploadZone onFilesUploaded={mockOnFilesUploaded} />);

    expect(screen.getByText('Drop files here...')).toBeInTheDocument();
  });

  it('displays upload queue when files are present', () => {
    const { useFileUpload } = require('../../../hooks/useFileUpload');
    useFileUpload.mockReturnValue({
      files: [
        {
          id: '1',
          file: new File(['content'], 'test.pdf', { type: 'application/pdf' }),
          name: 'test.pdf',
          size: 1024,
          progress: 50,
          status: 'uploading',
          url: null
        }
      ],
      uploadFile: jest.fn(),
      removeFile: jest.fn(),
      clearFiles: jest.fn()
    });

    render(<FileUploadZone onFilesUploaded={mockOnFilesUploaded} />);

    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('handles file removal', () => {
    const mockRemoveFile = vi.fn();
    const { useFileUpload } = require('../../../hooks/useFileUpload');
    useFileUpload.mockReturnValue({
      files: [
        {
          id: '1',
          file: new File(['content'], 'test.pdf', { type: 'application/pdf' }),
          name: 'test.pdf',
          size: 1024,
          progress: 100,
          status: 'completed',
          url: 'blob:test'
        }
      ],
      uploadFile: vi.fn(),
      removeFile: mockRemoveFile,
      clearFiles: vi.fn()
    });

    render(<FileUploadZone onFilesUploaded={mockOnFilesUploaded} />);

    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    expect(mockRemoveFile).toHaveBeenCalledWith('1');
  });

  it('handles clear all files', () => {
    const mockClearFiles = vi.fn();
    const { useFileUpload } = require('../../../hooks/useFileUpload');
    useFileUpload.mockReturnValue({
      files: [
        {
          id: '1',
          file: new File(['content'], 'test.pdf', { type: 'application/pdf' }),
          name: 'test.pdf',
          size: 1024,
          progress: 100,
          status: 'completed',
          url: 'blob:test'
        }
      ],
      uploadFile: vi.fn(),
      removeFile: vi.fn(),
      clearFiles: mockClearFiles
    });

    render(<FileUploadZone onFilesUploaded={mockOnFilesUploaded} />);

    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);

    expect(mockClearFiles).toHaveBeenCalled();
  });

  it('calls onFilesUploaded when upload completes', async () => {
    const { useFileUpload } = require('../../../hooks/useFileUpload');
    const mockUploadFile = jest.fn().mockResolvedValue({
      id: 'uploaded-1',
      filename: 'test.pdf'
    });

    useFileUpload.mockReturnValue({
      files: [],
      uploadFile: mockUploadFile,
      removeFile: jest.fn(),
      clearFiles: jest.fn()
    });

    const { useDropzone } = require('react-dropzone');
    const onDropCallback = jest.fn();

    useDropzone.mockImplementation(({ onDrop }) => {
      onDropCallback.current = onDrop;
      return {
        getRootProps: () => ({ role: 'button', tabIndex: 0 }),
        getInputProps: () => ({ type: 'file' }),
        isDragActive: false
      };
    });

    render(<FileUploadZone onFilesUploaded={mockOnFilesUploaded} />);

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await waitFor(() => {
      if (onDropCallback.current) {
        onDropCallback.current([file]);
      }
    });

    await waitFor(() => {
      expect(mockUploadFile).toHaveBeenCalledWith(file);
    });
  });

  it('formats file size correctly', () => {
    const { useFileUpload } = require('../../../hooks/useFileUpload');
    useFileUpload.mockReturnValue({
      files: [
        {
          id: '1',
          file: new File(['content'], 'small.pdf', { type: 'application/pdf' }),
          name: 'small.pdf',
          size: 1024,
          progress: 0,
          status: 'pending',
          url: null
        },
        {
          id: '2',
          file: new File(['content'], 'large.pdf', { type: 'application/pdf' }),
          name: 'large.pdf',
          size: 10485760,
          progress: 0,
          status: 'pending',
          url: null
        }
      ],
      uploadFile: jest.fn(),
      removeFile: jest.fn(),
      clearFiles: jest.fn()
    });

    render(<FileUploadZone onFilesUploaded={mockOnFilesUploaded} />);

    expect(screen.getByText('1.00 KB')).toBeInTheDocument();
    expect(screen.getByText('10.00 MB')).toBeInTheDocument();
  });
});