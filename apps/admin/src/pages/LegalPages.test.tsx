import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LegalPages } from './LegalPages';
import { apiService } from '@/services/api.service';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
jest.mock('@/services/api.service');
jest.mock('@/hooks/use-toast');
jest.mock('@/components/legal-pages/LegalPagesList', () => ({
  LegalPagesList: ({ pages, onUpload, onDelete, onToggleActive }: any) => (
    <div data-testid="legal-pages-list">
      {pages.map((page: any) => (
        <div key={page._id}>
          <span>{page.title.en}</span>
          <button onClick={() => onUpload(page)}>Upload</button>
          <button onClick={() => onDelete(page._id)}>Delete</button>
          <button onClick={() => onToggleActive(page._id, !page.isActive)}>
            Toggle
          </button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/legal-pages/FileUploadZone', () => ({
  FileUploadZone: ({ onUpload }: any) => (
    <div data-testid="file-upload-zone">
      <button onClick={() => onUpload(new File(['test'], 'test.pdf'))}>
        Upload File
      </button>
    </div>
  ),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange }: any) => (
    <div data-testid="select">{children}</div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

describe('LegalPages', () => {
  const mockToast = jest.fn();
  const mockApiGet = apiService.get as jest.MockedFunction<typeof apiService.get>;
  const mockApiPost = apiService.post as jest.MockedFunction<typeof apiService.post>;
  const mockApiPut = apiService.put as jest.MockedFunction<typeof apiService.put>;
  const mockApiDelete = apiService.delete as jest.MockedFunction<typeof apiService.delete>;

  const mockPages = [
    {
      _id: '1',
      slug: 'terms-of-use',
      type: 'terms',
      title: {
        pt: 'Termos de Uso',
        en: 'Terms of Use',
        es: 'Términos de Uso',
      },
      files: {},
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    mockApiGet.mockResolvedValue({ data: mockPages });
  });

  it('should fetch and display legal pages on mount', async () => {
    render(<LegalPages />);

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith('/legal-pages');
      expect(screen.getByText('Terms of Use')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    render(<LegalPages />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle API fetch error', async () => {
    mockApiGet.mockRejectedValue(new Error('Network error'));

    render(<LegalPages />);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to fetch legal pages',
        variant: 'destructive',
      });
    });
  });

  it('should toggle create form visibility', async () => {
    render(<LegalPages />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create new/i });
    fireEvent.click(createButton);

    expect(screen.getByText(/create new legal page/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/slug/i)).toBeInTheDocument();
  });

  it('should create a new legal page', async () => {
    const newPage = {
      _id: '2',
      slug: 'privacy-policy',
      type: 'privacy',
      title: {
        pt: 'Política de Privacidade',
        en: 'Privacy Policy',
        es: 'Política de Privacidad',
      },
      files: {},
      isActive: true,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    mockApiPost.mockResolvedValue({ data: newPage });

    render(<LegalPages />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Open create form
    const createButton = screen.getByRole('button', { name: /create new/i });
    fireEvent.click(createButton);

    // Fill form
    const slugInput = screen.getByLabelText(/slug/i);
    const titlePtInput = screen.getByLabelText(/title \(portuguese\)/i);
    const titleEnInput = screen.getByLabelText(/title \(english\)/i);

    fireEvent.change(slugInput, { target: { value: 'privacy-policy' } });
    fireEvent.change(titlePtInput, { target: { value: 'Política de Privacidade' } });
    fireEvent.change(titleEnInput, { target: { value: 'Privacy Policy' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create page/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/legal-pages', expect.objectContaining({
        slug: 'privacy-policy',
        type: 'terms',
        title: expect.objectContaining({
          pt: 'Política de Privacidade',
          en: 'Privacy Policy',
        }),
      }));
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Legal page created successfully',
      });
    });
  });

  it('should handle page deletion', async () => {
    mockApiDelete.mockResolvedValue({});

    render(<LegalPages />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockApiDelete).toHaveBeenCalledWith('/legal-pages/1');
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Legal page deleted successfully',
      });
    });
  });

  it('should handle active status toggle', async () => {
    const updatedPage = { ...mockPages[0], isActive: false };
    mockApiPut.mockResolvedValue({ data: updatedPage });

    render(<LegalPages />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const toggleButton = screen.getByText('Toggle');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(mockApiPut).toHaveBeenCalledWith('/legal-pages/1', { isActive: false });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Page status updated successfully',
      });
    });
  });

  it('should handle file upload', async () => {
    render(<LegalPages />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Select page for upload
    const uploadButton = screen.getByText('Upload');
    fireEvent.click(uploadButton);

    // Upload dialog should appear
    expect(screen.getByText(/upload pdf for/i)).toBeInTheDocument();
    expect(screen.getByTestId('file-upload-zone')).toBeInTheDocument();

    // Upload file
    const formData = new FormData();
    formData.append('file', new File(['test'], 'test.pdf'));
    formData.append('language', 'pt');

    mockApiPost.mockResolvedValue({ data: mockPages[0] });

    const uploadFileButton = screen.getByText('Upload File');
    fireEvent.click(uploadFileButton);

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        '/legal-pages/1/upload',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'File uploaded successfully',
      });
    });
  });

  it('should validate required fields when creating page', async () => {
    render(<LegalPages />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Open create form
    const createButton = screen.getByRole('button', { name: /create new/i });
    fireEvent.click(createButton);

    // Submit form without filling required fields
    const submitButton = screen.getByRole('button', { name: /create page/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockApiPost).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
    });
  });

  it('should handle API error during page creation', async () => {
    mockApiPost.mockRejectedValue(new Error('Server error'));

    render(<LegalPages />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Open create form
    const createButton = screen.getByRole('button', { name: /create new/i });
    fireEvent.click(createButton);

    // Fill and submit form
    const slugInput = screen.getByLabelText(/slug/i);
    fireEvent.change(slugInput, { target: { value: 'test-page' } });

    const submitButton = screen.getByRole('button', { name: /create page/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to create legal page',
        variant: 'destructive',
      });
    });
  });

  it('should cancel page creation', async () => {
    render(<LegalPages />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Open create form
    const createButton = screen.getByRole('button', { name: /create new/i });
    fireEvent.click(createButton);

    expect(screen.getByText(/create new legal page/i)).toBeInTheDocument();

    // Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(screen.queryByText(/create new legal page/i)).not.toBeInTheDocument();
  });
});