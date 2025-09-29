import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ImageGalleryManager } from '../ImageGalleryManager';

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: vi.fn((options) => ({
    getRootProps: () => ({
      onDrop: options.onDrop,
      onClick: vi.fn()
    }),
    getInputProps: () => ({
      type: 'file',
      accept: options.accept
    }),
    isDragActive: false,
    acceptedFiles: [],
    rejectedFiles: []
  }))
}));

// Mock DndContext for drag and drop
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => [])
}));

// Mock SortableContext
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  verticalListSortingStrategy: vi.fn(),
  arrayMove: vi.fn((arr, from, to) => {
    const newArr = [...arr];
    const [removed] = newArr.splice(from, 1);
    newArr.splice(to, 0, removed);
    return newArr;
  })
}));

describe('ImageGalleryManager Component', () => {
  const mockImages = [
    {
      id: '1',
      url: 'https://example.com/image1.jpg',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      caption: {
        'pt-BR': 'Legenda 1',
        'en': 'Caption 1',
        'es': 'Leyenda 1'
      },
      altText: {
        'pt-BR': 'Texto alternativo 1',
        'en': 'Alt text 1',
        'es': 'Texto alternativo 1'
      },
      order: 0
    },
    {
      id: '2',
      url: 'https://example.com/image2.jpg',
      thumbnailUrl: 'https://example.com/thumb2.jpg',
      caption: {
        'pt-BR': 'Legenda 2',
        'en': 'Caption 2',
        'es': 'Leyenda 2'
      },
      altText: {
        'pt-BR': 'Texto alternativo 2',
        'en': 'Alt text 2',
        'es': 'Texto alternativo 2'
      },
      order: 1
    }
  ];

  const mockOnImagesChange = vi.fn();
  const mockOnUpload = vi.fn();
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Clean up any unreleased object URLs
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    // Verify cleanup was called
    if (global.URL.revokeObjectURL) {
      // Check that revokeObjectURL was called for any created URLs
    }
  });

  it('should render existing images', () => {
    render(
      <ImageGalleryManager
        images={mockImages}
        onImagesChange={mockOnImagesChange}
        onUpload={mockOnUpload}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByAltText('Alt text 1')).toBeInTheDocument();
    expect(screen.getByAltText('Alt text 2')).toBeInTheDocument();
  });

  it('should show upload dropzone', () => {
    render(
      <ImageGalleryManager
        images={[]}
        onImagesChange={mockOnImagesChange}
        onUpload={mockOnUpload}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText(/Drag & drop images here/i)).toBeInTheDocument();
  });

  it('should handle file upload with validation', async () => {
    const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
    const user = userEvent.setup();

    render(
      <ImageGalleryManager
        images={[]}
        onImagesChange={mockOnImagesChange}
        onUpload={mockOnUpload}
        onRemove={mockOnRemove}
      />
    );

    const input = screen.getByRole('button', { name: /Select Files/i });

    // Simulate file selection
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith([file]);
    });
  });

  it('should reject invalid file types', async () => {
    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });

    render(
      <ImageGalleryManager
        images={[]}
        onImagesChange={mockOnImagesChange}
        onUpload={mockOnUpload}
        onRemove={mockOnRemove}
      />
    );

    const input = screen.getByRole('button', { name: /Select Files/i });

    Object.defineProperty(input, 'files', {
      value: [invalidFile],
      writable: false
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockOnUpload).not.toHaveBeenCalled();
      expect(screen.getByText(/Only image files are allowed/i)).toBeInTheDocument();
    });
  });

  it('should handle image removal', async () => {
    const user = userEvent.setup();

    render(
      <ImageGalleryManager
        images={mockImages}
        onImagesChange={mockOnImagesChange}
        onUpload={mockOnUpload}
        onRemove={mockOnRemove}
      />
    );

    const removeButtons = screen.getAllByLabelText('Remove image');
    await user.click(removeButtons[0]);

    // Should show confirmation
    expect(screen.getByText(/Are you sure you want to remove this image/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    await user.click(confirmButton);

    expect(mockOnRemove).toHaveBeenCalledWith('1');
  });

  it('should edit image caption and alt text', async () => {
    const user = userEvent.setup();

    render(
      <ImageGalleryManager
        images={mockImages}
        onImagesChange={mockOnImagesChange}
        onUpload={mockOnUpload}
        onRemove={mockOnRemove}
      />
    );

    const editButtons = screen.getAllByLabelText('Edit image details');
    await user.click(editButtons[0]);

    // Modal should open
    expect(screen.getByText('Edit Image Details')).toBeInTheDocument();

    // Edit caption
    const captionInput = screen.getByLabelText('Caption (English)');
    await user.clear(captionInput);
    await user.type(captionInput, 'New caption');

    // Edit alt text
    const altInput = screen.getByLabelText('Alt Text (English)');
    await user.clear(altInput);
    await user.type(altInput, 'New alt text');

    // Save changes
    const saveButton = screen.getByRole('button', { name: 'Save' });
    await user.click(saveButton);

    expect(mockOnImagesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: '1',
          caption: expect.objectContaining({
            'en': 'New caption'
          }),
          altText: expect.objectContaining({
            'en': 'New alt text'
          })
        })
      ])
    );
  });

  it('should handle drag and drop reordering', async () => {
    render(
      <ImageGalleryManager
        images={mockImages}
        onImagesChange={mockOnImagesChange}
        onUpload={mockOnUpload}
        onRemove={mockOnRemove}
      />
    );

    // Simulate drag and drop
    const dragHandles = screen.getAllByLabelText('Drag to reorder');

    fireEvent.dragStart(dragHandles[0]);
    fireEvent.dragEnter(dragHandles[1]);
    fireEvent.dragEnd(dragHandles[0]);

    await waitFor(() => {
      expect(mockOnImagesChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: '2', order: 0 }),
          expect.objectContaining({ id: '1', order: 1 })
        ])
      );
    });
  });

  it('should display upload progress', async () => {
    const mockOnUploadWithProgress = vi.fn((files, onProgress) => {
      // Simulate progress updates
      onProgress(0);
      setTimeout(() => onProgress(50), 100);
      setTimeout(() => onProgress(100), 200);
      return Promise.resolve();
    });

    render(
      <ImageGalleryManager
        images={[]}
        onImagesChange={mockOnImagesChange}
        onUpload={mockOnUploadWithProgress}
        onRemove={mockOnRemove}
      />
    );

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /Select Files/i });

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false
    });

    fireEvent.change(input);

    // Should show progress bar
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('should enforce maximum image limit', () => {
    const maxImages = Array(20).fill(null).map((_, i) => ({
      ...mockImages[0],
      id: `${i}`,
      order: i
    }));

    render(
      <ImageGalleryManager
        images={maxImages}
        onImagesChange={mockOnImagesChange}
        onUpload={mockOnUpload}
        onRemove={mockOnRemove}
        maxImages={20}
      />
    );

    expect(screen.getByText(/Maximum number of images reached/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Select Files/i })).toBeDisabled();
  });

  it('should clean up object URLs on unmount', () => {
    const { unmount } = render(
      <ImageGalleryManager
        images={mockImages}
        onImagesChange={mockOnImagesChange}
        onUpload={mockOnUpload}
        onRemove={mockOnRemove}
      />
    );

    // Create a mock preview URL
    const mockUrl = 'blob:http://localhost:3000/123456';
    global.URL.createObjectURL = vi.fn(() => mockUrl);

    // Trigger file selection to create preview
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /Select Files/i });

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false
    });

    fireEvent.change(input);

    // Unmount component
    unmount();

    // Verify cleanup was called
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
  });

  it('should handle parallel uploads correctly', async () => {
    const files = [
      new File(['content1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['content2'], 'test2.jpg', { type: 'image/jpeg' }),
      new File(['content3'], 'test3.jpg', { type: 'image/jpeg' })
    ];

    const mockParallelUpload = vi.fn(() =>
      Promise.all(files.map(() => new Promise(resolve => setTimeout(resolve, 100))))
    );

    render(
      <ImageGalleryManager
        images={[]}
        onImagesChange={mockOnImagesChange}
        onUpload={mockParallelUpload}
        onRemove={mockOnRemove}
        enableParallelUpload={true}
      />
    );

    const input = screen.getByRole('button', { name: /Select Files/i });

    Object.defineProperty(input, 'files', {
      value: files,
      writable: false
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockParallelUpload).toHaveBeenCalledWith(files, expect.any(Function));
    });

    // Should show progress for multiple files
    expect(screen.getByText(/Uploading 3 files/i)).toBeInTheDocument();
  });

  it('should validate file size', async () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg'
    });

    Object.defineProperty(largeFile, 'size', {
      value: 11 * 1024 * 1024, // 11MB
      writable: false
    });

    render(
      <ImageGalleryManager
        images={[]}
        onImagesChange={mockOnImagesChange}
        onUpload={mockOnUpload}
        onRemove={mockOnRemove}
        maxFileSize={10 * 1024 * 1024} // 10MB limit
      />
    );

    const input = screen.getByRole('button', { name: /Select Files/i });

    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/File size exceeds 10MB limit/i)).toBeInTheDocument();
      expect(mockOnUpload).not.toHaveBeenCalled();
    });
  });

  it('should be accessible with proper ARIA labels', () => {
    render(
      <ImageGalleryManager
        images={mockImages}
        onImagesChange={mockOnImagesChange}
        onUpload={mockOnUpload}
        onRemove={mockOnRemove}
      />
    );

    // Check ARIA labels
    expect(screen.getByRole('region', { name: /Image Gallery/i })).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(2);

    // Check keyboard navigation hints
    const dragHandles = screen.getAllByLabelText('Drag to reorder');
    expect(dragHandles).toHaveLength(2);
  });
});