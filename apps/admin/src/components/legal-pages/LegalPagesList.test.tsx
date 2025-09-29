import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LegalPagesList } from './LegalPagesList';

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-variant={variant}>{children}</span>
  ),
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      data-testid="switch"
    />
  ),
}));

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div>{children}</div>,
  AlertDialogTrigger: ({ children }: any) => <div>{children}</div>,
  AlertDialogContent: ({ children }: any) => (
    <div role="dialog">{children}</div>
  ),
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: any) => (
    <button role="button">{children}</button>
  ),
  AlertDialogAction: ({ children, onClick }: any) => (
    <button role="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

describe('LegalPagesList', () => {
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
      files: {
        pt: {
          filename: 'terms-pt.pdf',
          originalName: 'termos.pdf',
          size: 1048576, // 1MB
          uploadedAt: '2024-01-01T00:00:00Z',
          uploadedBy: 'admin',
        },
        en: {
          filename: 'terms-en.pdf',
          originalName: 'terms.pdf',
          size: 2097152, // 2MB
          uploadedAt: '2024-01-02T00:00:00Z',
          uploadedBy: 'admin',
        },
      },
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
    {
      _id: '2',
      slug: 'privacy-policy',
      type: 'privacy',
      title: {
        en: 'Privacy Policy',
      },
      files: {},
      isActive: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockHandlers = {
    onUpload: jest.fn(),
    onDelete: jest.fn(),
    onToggleActive: jest.fn(),
    onDeleteFile: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render legal pages list', () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    expect(screen.getByText('Terms of Use')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('terms-of-use')).toBeInTheDocument();
    expect(screen.getByText('privacy-policy')).toBeInTheDocument();
  });

  it('should display file information correctly', () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    // Check for Portuguese file
    expect(screen.getByText('termos.pdf')).toBeInTheDocument();
    expect(screen.getByText('1 MB')).toBeInTheDocument();

    // Check for English file
    expect(screen.getByText('terms.pdf')).toBeInTheDocument();
    expect(screen.getByText('2 MB')).toBeInTheDocument();
  });

  it('should show active/inactive status correctly', () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    const switches = screen.getAllByTestId('switch');
    expect(switches[0]).toBeChecked(); // First page is active
    expect(switches[1]).not.toBeChecked(); // Second page is inactive
  });

  it('should call onUpload when upload button is clicked', () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    const uploadButtons = screen.getAllByRole('button', { name: /upload/i });
    fireEvent.click(uploadButtons[0]);

    expect(mockHandlers.onUpload).toHaveBeenCalledWith(mockPages[0]);
  });

  it('should call onToggleActive when switch is toggled', () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    const switches = screen.getAllByTestId('switch');
    fireEvent.change(switches[0], { target: { checked: false } });

    expect(mockHandlers.onToggleActive).toHaveBeenCalledWith('1', false);
  });

  it('should show confirmation dialog before deleting', async () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    // Confirmation dialog should appear
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
  });

  it('should call onDelete when deletion is confirmed', async () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete page/i });
    fireEvent.click(deleteButtons[0]);

    // Find and click the confirmation button in the dialog
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockHandlers.onDelete).toHaveBeenCalledWith('1');
    });
  });

  it('should display language badges for uploaded files', () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    expect(screen.getByText('PT')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.queryByText('ES')).not.toBeInTheDocument(); // No Spanish file uploaded
  });

  it('should show "No files uploaded" message when no files exist', () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    // Second page has no files
    expect(screen.getByText('No files uploaded yet')).toBeInTheDocument();
  });

  it('should call onDeleteFile when file delete button is clicked', () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    // Find delete button for a specific file
    const fileDeleteButtons = screen.getAllByRole('button', { name: /remove file/i });
    fireEvent.click(fileDeleteButtons[0]);

    expect(mockHandlers.onDeleteFile).toHaveBeenCalledWith('1', 'pt');
  });

  it('should format file sizes correctly', () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    expect(screen.getByText('1 MB')).toBeInTheDocument();
    expect(screen.getByText('2 MB')).toBeInTheDocument();
  });

  it('should display correct type labels', () => {
    const customPages = [
      ...mockPages,
      {
        _id: '3',
        slug: 'cookie-policy',
        type: 'cookies',
        title: { en: 'Cookie Policy' },
        files: {},
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    render(<LegalPagesList pages={customPages} {...mockHandlers} />);

    expect(screen.getByText('Terms of Use')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Cookie Policy')).toBeInTheDocument();
  });

  it('should handle empty pages list', () => {
    render(<LegalPagesList pages={[]} {...mockHandlers} />);

    expect(screen.getByText('No legal pages found')).toBeInTheDocument();
  });

  it('should display download button for uploaded files', () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    const downloadButtons = screen.getAllByRole('button', { name: /download/i });
    expect(downloadButtons.length).toBeGreaterThan(0);
  });

  it('should display upload date for files', () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    expect(screen.getByText(/uploaded on/i)).toBeInTheDocument();
  });
});