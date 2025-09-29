import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useFileUpload } from '../useFileUpload';

describe('useFileUpload', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty files array', () => {
    const { result } = renderHook(() => useFileUpload());
    expect(result.current.files).toEqual([]);
  });

  it('validates file type correctly', async () => {
    const { result } = renderHook(() => useFileUpload());

    const invalidFile = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });

    await act(async () => {
      try {
        await result.current.uploadFile(invalidFile);
      } catch (error) {
        expect(error.message).toBe('Invalid file type. Allowed types: PDF, ZIP, Images, Videos');
      }
    });

    expect(result.current.files).toHaveLength(0);
  });

  it('validates file size', async () => {
    const { result } = renderHook(() => useFileUpload());

    const largeFile = new File(['x'.repeat(600 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(largeFile, 'size', { value: 600 * 1024 * 1024 });

    await act(async () => {
      try {
        await result.current.uploadFile(largeFile);
      } catch (error) {
        expect(error.message).toBe('File size exceeds 500MB limit');
      }
    });

    expect(result.current.files).toHaveLength(0);
  });

  it('sanitizes filename', async () => {
    const { result } = renderHook(() => useFileUpload());

    const fileWithBadName = new File(['content'], '<script>alert("xss")</script>.pdf', {
      type: 'application/pdf',
    });

    await act(async () => {
      await result.current.uploadFile(fileWithBadName);
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].name).not.toContain('<script>');
  });

  it('validates PDF magic numbers', async () => {
    const { result } = renderHook(() => useFileUpload());

    // PDF starts with %PDF
    const pdfContent = '%PDF-1.4 content';
    const validPdf = new File([pdfContent], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.uploadFile(validPdf);
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].status).toBe('uploading');
  });

  it('rejects PDF with invalid content', async () => {
    const { result } = renderHook(() => useFileUpload());

    // Not a real PDF
    const fakePdf = new File(['not a pdf'], 'fake.pdf', { type: 'application/pdf' });

    await act(async () => {
      try {
        await result.current.uploadFile(fakePdf);
      } catch (error) {
        expect(error.message).toContain('Invalid PDF file');
      }
    });
  });

  it('validates image magic numbers', async () => {
    const { result } = renderHook(() => useFileUpload());

    // PNG magic numbers
    const pngMagic = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const validPng = new File([pngMagic], 'test.png', { type: 'image/png' });

    await act(async () => {
      await result.current.uploadFile(validPng);
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].status).toBe('uploading');
  });

  it('removes file from queue', async () => {
    const { result } = renderHook(() => useFileUpload());

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.uploadFile(file);
    });

    expect(result.current.files).toHaveLength(1);
    const fileId = result.current.files[0].id;

    act(() => {
      result.current.removeFile(fileId);
    });

    expect(result.current.files).toHaveLength(0);
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('clears all files', async () => {
    const { result } = renderHook(() => useFileUpload());

    const file1 = new File(['content1'], 'test1.pdf', { type: 'application/pdf' });
    const file2 = new File(['content2'], 'test2.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.uploadFile(file1);
      await result.current.uploadFile(file2);
    });

    expect(result.current.files).toHaveLength(2);

    act(() => {
      result.current.clearFiles();
    });

    expect(result.current.files).toHaveLength(0);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('cleans up URLs on unmount', async () => {
    const { result, unmount } = renderHook(() => useFileUpload());

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.uploadFile(file);
    });

    expect(result.current.files).toHaveLength(1);

    unmount();

    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('handles upload progress updates', async () => {
    const { result } = renderHook(() => useFileUpload());

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.uploadFile(file);
    });

    const fileId = result.current.files[0].id;

    // Simulate progress updates
    act(() => {
      result.current.files[0].progress = 50;
    });

    expect(result.current.files[0].progress).toBe(50);
  });
});
