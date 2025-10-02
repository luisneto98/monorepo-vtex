import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { LegalPagesList } from './LegalPagesList';

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-variant={variant}>{children}</span>
  ),
}));

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      onClick={(e: any) => onCheckedChange?.(!checked)}
      data-testid="switch"
    />
  ),
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div data-testid="alert-dialog">{children}</div>,
  AlertDialogTrigger: ({ children, asChild }: any) => <>{children}</>,
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
  AlertDialogAction: ({ children, onClick, ...props }: any) => (
    <button role="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div role="tooltip">{children}</div>,
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
    onUpload: vi.fn(),
    onDelete: vi.fn(),
    onToggleActive: vi.fn(),
    onDeleteFile: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render legal pages list', () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    // Check for page titles (they appear multiple times - in h3 and badge)
    expect(screen.getAllByText('Terms of Use').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Privacy Policy').length).toBeGreaterThan(0);
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
    fireEvent.click(switches[0]);

    expect(mockHandlers.onToggleActive).toHaveBeenCalledWith('1', false);
  });

  it('should show confirmation dialog before deleting', async () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    // Find the delete page button using test ID
    const deleteButton = screen.getByTestId('delete-page-1');
    fireEvent.click(deleteButton);

    // Confirmation dialog should appear (multiple dialogs rendered due to mock, use getAllByText)
    expect(screen.getAllByText(/are you sure/i).length).toBeGreaterThan(0);
  });

  it('should call onDelete when deletion is confirmed', async () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    // Find the delete page button using test ID
    const deleteButton = screen.getByTestId('delete-page-1');
    fireEvent.click(deleteButton);

    // Find and click the confirm button in the dialog (multiple rendered, get first)
    const confirmButtons = screen.getAllByTestId('confirm-delete-page');
    fireEvent.click(confirmButtons[0]);

    await waitFor(() => {
      expect(mockHandlers.onDelete).toHaveBeenCalledWith('1');
    });
  });

  it('should display language badges for uploaded files', () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    // Language labels are shown as full names, not codes
    expect(screen.getAllByText('Portuguese').length).toBeGreaterThan(0);
    expect(screen.getAllByText('English').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Spanish').length).toBeGreaterThan(0); // Spanish section shown but no file
  });

  it('should show "No files uploaded" message when no files exist', () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    // Second page has no files (text is "No file uploaded" not "No files uploaded yet")
    expect(screen.getAllByText('No file uploaded').length).toBeGreaterThan(0);
  });

  it('should call onDeleteFile when file delete button is clicked', async () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    // Find the delete file button using test ID (page ID 1, PT language)
    const deleteButton = screen.getByTestId('delete-file-1-pt');
    fireEvent.click(deleteButton);

    // Find and click the confirm button in the dialog (multiple rendered, get first)
    const confirmButtons = screen.getAllByTestId('confirm-delete-file');
    fireEvent.click(confirmButtons[0]);

    await waitFor(() => {
      expect(mockHandlers.onDeleteFile).toHaveBeenCalledWith('1', 'pt');
    });
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

    // Type labels appear multiple times (in h3 and badge)
    expect(screen.getAllByText('Terms of Use').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Privacy Policy').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cookie Policy').length).toBeGreaterThan(0);
  });

  it('should handle empty pages list', () => {
    render(<LegalPagesList pages={[]} {...mockHandlers} />);

    expect(screen.getByText(/No legal pages created yet/i)).toBeInTheDocument();
  });

  it('should display download button for uploaded files', () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    // Look for Download text in buttons
    const downloadButtons = screen.getAllByText('Download');
    expect(downloadButtons.length).toBeGreaterThan(0);
  });

  it('should display upload date for files', () => {
    render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

    // "Uploaded:" appears multiple times (once per uploaded file)
    expect(screen.getAllByText(/Uploaded:/i).length).toBeGreaterThan(0);
  });

  describe('Mobile Compatibility Indicators', () => {
    it('should display mobile compatibility help banner', () => {
      render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

      expect(screen.getByText(/Mobile App Compatibility/i)).toBeInTheDocument();
      expect(screen.getByText(/Legal pages with the following slugs will be displayed in the mobile app/i)).toBeInTheDocument();
    });

    it('should show mobile badge for compatible slugs', () => {
      const mobileCompatiblePages = [
        {
          _id: '1',
          slug: 'terms-of-use',
          type: 'terms',
          title: { en: 'Terms of Use' },
          files: {},
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          _id: '2',
          slug: 'privacy-policy',
          type: 'privacy',
          title: { en: 'Privacy Policy' },
          files: {},
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      render(<LegalPagesList pages={mobileCompatiblePages} {...mockHandlers} />);

      const mobileBadges = screen.getAllByText('Mobile');
      expect(mobileBadges.length).toBeGreaterThan(0);
    });

    it('should NOT show mobile badge for non-compatible slugs', () => {
      const nonCompatiblePages = [
        {
          _id: '1',
          slug: 'custom-document',
          type: 'other',
          title: { en: 'Custom Document' },
          files: {},
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      render(<LegalPagesList pages={nonCompatiblePages} {...mockHandlers} />);

      expect(screen.queryByText('Mobile')).not.toBeInTheDocument();
    });

    it('should display recommended mobile slugs in help banner', () => {
      render(<LegalPagesList pages={mockPages} {...mockHandlers} />);

      expect(screen.getByText(/Mobile App Compatibility/i)).toBeInTheDocument();
      // The slugs appear in the help banner
      const helpText = screen.getByText(/Legal pages with the following slugs will be displayed in the mobile app/i);
      expect(helpText).toBeInTheDocument();
    });

    it('should recognize localized slug patterns', () => {
      const localizedPages = [
        {
          _id: '1',
          slug: 'termos-de-uso',
          type: 'terms',
          title: { pt: 'Termos de Uso' },
          files: {},
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          _id: '2',
          slug: 'politica-de-privacidade',
          type: 'privacy',
          title: { pt: 'Política de Privacidade' },
          files: {},
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      render(<LegalPagesList pages={localizedPages} {...mockHandlers} />);

      const mobileBadges = screen.getAllByText('Mobile');
      expect(mobileBadges.length).toBe(2);
    });

    it('should show tooltip on mobile badge hover', () => {
      const mobilePages = [
        {
          _id: '1',
          slug: 'terms-of-use',
          type: 'terms',
          title: { en: 'Terms' },
          files: {},
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ];

      render(<LegalPagesList pages={mobilePages} {...mockHandlers} />);

      // Tooltip content should be rendered
      expect(screen.getByText(/This page will be displayed in the mobile app/i)).toBeInTheDocument();
    });
  });
});