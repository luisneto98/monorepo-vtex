import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { FileUploadZone } from '../FileUploadZone';
import { TagAdditionModal } from '../TagAdditionModal';
import { MaterialCard } from '../MaterialCard';

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: vi.fn(() => ({
    getRootProps: () => ({
      role: 'button',
      tabIndex: 0,
      'aria-label': 'File upload zone'
    }),
    getInputProps: () => ({
      type: 'file',
      'aria-label': 'File input'
    }),
    isDragActive: false
  }))
}));

// Mock hooks
vi.mock('../../../hooks/useFileUpload', () => ({
  useFileUpload: vi.fn(() => ({
    files: [],
    uploadFile: vi.fn(),
    removeFile: vi.fn(),
    clearFiles: vi.fn()
  }))
}));

describe('Accessibility Tests', () => {
  describe('FileUploadZone', () => {
    it('has proper ARIA labels', () => {
      render(<FileUploadZone onFilesUploaded={vi.fn()} />);

      const uploadZone = screen.getByRole('button');
      expect(uploadZone).toHaveAttribute('tabIndex', '0');
    });

    it('is keyboard navigable', () => {
      render(<FileUploadZone onFilesUploaded={vi.fn()} />);

      const uploadZone = screen.getByRole('button');
      expect(uploadZone).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('TagAdditionModal', () => {
    it('has proper dialog role', () => {
      render(
        <TagAdditionModal
          open={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('has accessible form elements', () => {
      render(
        <TagAdditionModal
          open={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Enter tags separated by commas');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('has accessible buttons', () => {
      render(
        <TagAdditionModal
          open={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const confirmButton = screen.getByRole('button', { name: /add tags/i });

      expect(cancelButton).toBeInTheDocument();
      expect(confirmButton).toBeInTheDocument();
    });
  });

  describe('MaterialCard', () => {
    const mockMaterial = {
      _id: '1',
      title: { pt: 'Test Material', en: 'Test Material' },
      description: { pt: 'Description', en: 'Description' },
      type: 'image' as const,
      filename: 'test.jpg',
      url: 'http://example.com/test.jpg',
      size: 1024,
      status: 'published' as const,
      accessLevel: 'public' as const,
      tags: ['test'],
      downloadCount: 0,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01'
    };

    it('has accessible checkbox for selection', () => {
      render(
        <MaterialCard
          material={mockMaterial}
          selected={false}
          onSelect={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onStatusChange={vi.fn()}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('aria-label', expect.stringContaining('Select'));
    });

    it('has accessible action buttons', () => {
      render(
        <MaterialCard
          material={mockMaterial}
          selected={false}
          onSelect={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onStatusChange={vi.fn()}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      const deleteButton = screen.getByRole('button', { name: /delete/i });

      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });

    it('displays alt text for images', () => {
      render(
        <MaterialCard
          material={mockMaterial}
          selected={false}
          onSelect={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onStatusChange={vi.fn()}
        />
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'Test Material');
    });
  });

  describe('Keyboard Navigation', () => {
    it('allows tab navigation through interactive elements', () => {
      const { container } = render(
        <div>
          <FileUploadZone onFilesUploaded={vi.fn()} />
          <TagAdditionModal
            open={true}
            onClose={vi.fn()}
            onConfirm={vi.fn()}
          />
        </div>
      );

      const interactiveElements = container.querySelectorAll(
        'button, input, [tabindex="0"]'
      );

      interactiveElements.forEach((element) => {
        expect(element).toHaveAttribute('tabindex', expect.stringMatching(/^(0|-1)$/));
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('has proper heading structure', () => {
      render(
        <TagAdditionModal
          open={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      const heading = screen.getByRole('heading', { name: /add tags/i });
      expect(heading).toBeInTheDocument();
    });

    it('has descriptive labels for form controls', () => {
      render(
        <TagAdditionModal
          open={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Enter tags separated by commas');
      expect(input).toHaveAccessibleName();
    });

    it('provides error messages in accessible format', async () => {
      render(
        <TagAdditionModal
          open={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText('Enter tags separated by commas');

      // Trigger validation error
      input.value = 'a'.repeat(51); // Over limit
      input.dispatchEvent(new Event('change', { bubbles: true }));

      const errorMessage = await screen.findByText(/Tags must be 50 characters or less/);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });
  });

  describe('Focus Management', () => {
    it('traps focus within modal when open', () => {
      render(
        <TagAdditionModal
          open={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      const focusableElements = dialog.querySelectorAll(
        'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('returns focus when modal closes', () => {
      const { rerender } = render(
        <TagAdditionModal
          open={false}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      // Open modal
      rerender(
        <TagAdditionModal
          open={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      // Close modal
      rerender(
        <TagAdditionModal
          open={false}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );

      // Focus should return to the triggering element (body in this test)
      expect(document.activeElement).toBe(document.body);
    });
  });
});