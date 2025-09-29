import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { NewsGrid } from '../NewsGrid';
import { NewsRelease } from '@shared/types/news-releases';

const mockNewsReleases: NewsRelease[] = [
  {
    _id: '1',
    title: {
      'pt-BR': 'Título 1',
      'en': 'Title 1',
      'es': 'Título 1'
    },
    subtitle: {
      'pt-BR': 'Subtítulo 1',
      'en': 'Subtitle 1',
      'es': 'Subtítulo 1'
    },
    content: {
      'pt-BR': '<p>Conteúdo 1</p>',
      'en': '<p>Content 1</p>',
      'es': '<p>Contenido 1</p>'
    },
    status: 'published',
    publishedAt: new Date('2025-01-01'),
    featured: true,
    category: 'announcement',
    tags: ['news', 'event'],
    author: {
      name: 'Author 1',
      email: 'author1@test.com'
    },
    slug: 'title-1',
    viewCount: 100,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  },
  {
    _id: '2',
    title: {
      'pt-BR': 'Título 2',
      'en': 'Title 2',
      'es': 'Título 2'
    },
    subtitle: {
      'pt-BR': 'Subtítulo 2',
      'en': 'Subtitle 2',
      'es': 'Subtítulo 2'
    },
    content: {
      'pt-BR': '<p>Conteúdo 2</p>',
      'en': '<p>Content 2</p>',
      'es': '<p>Contenido 2</p>'
    },
    status: 'draft',
    featured: false,
    category: 'update',
    tags: ['update'],
    author: {
      name: 'Author 2',
      email: 'author2@test.com'
    },
    slug: 'title-2',
    viewCount: 0,
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02')
  }
];

const mockOnEdit = vi.fn();
const mockOnDelete = vi.fn();
const mockOnPublish = vi.fn();
const mockOnArchive = vi.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('NewsGrid Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render news releases in grid layout', () => {
    render(
      <NewsGrid
        newsReleases={mockNewsReleases}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
        onArchive={mockOnArchive}
      />,
      { wrapper: createWrapper() }
    );

    // Check if both news releases are rendered
    expect(screen.getByText('Title 1')).toBeInTheDocument();
    expect(screen.getByText('Title 2')).toBeInTheDocument();
  });

  it('should display status badges correctly', () => {
    render(
      <NewsGrid
        newsReleases={mockNewsReleases}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
        onArchive={mockOnArchive}
      />,
      { wrapper: createWrapper() }
    );

    // Check status badges
    expect(screen.getByText('published')).toHaveClass('bg-green-100');
    expect(screen.getByText('draft')).toHaveClass('bg-yellow-100');
  });

  it('should show featured indicator for featured items', () => {
    render(
      <NewsGrid
        newsReleases={mockNewsReleases}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
        onArchive={mockOnArchive}
      />,
      { wrapper: createWrapper() }
    );

    // Check for featured star icon
    const featuredIcons = screen.getAllByTestId('featured-icon');
    expect(featuredIcons[0]).toHaveClass('text-yellow-500');
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <NewsGrid
        newsReleases={mockNewsReleases}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
        onArchive={mockOnArchive}
      />,
      { wrapper: createWrapper() }
    );

    const editButtons = screen.getAllByLabelText('Edit');
    await user.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockNewsReleases[0]);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <NewsGrid
        newsReleases={mockNewsReleases}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
        onArchive={mockOnArchive}
      />,
      { wrapper: createWrapper() }
    );

    const deleteButtons = screen.getAllByLabelText('Delete');
    await user.click(deleteButtons[0]);

    // Should show confirmation dialog
    expect(screen.getByText('Are you sure you want to delete this news release?')).toBeInTheDocument();

    // Confirm deletion
    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('should show empty state when no news releases', () => {
    render(
      <NewsGrid
        newsReleases={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
        onArchive={mockOnArchive}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('No news releases found')).toBeInTheDocument();
  });

  it('should display view count correctly', () => {
    render(
      <NewsGrid
        newsReleases={mockNewsReleases}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
        onArchive={mockOnArchive}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('100 views')).toBeInTheDocument();
    expect(screen.getByText('0 views')).toBeInTheDocument();
  });

  it('should display categories and tags', () => {
    render(
      <NewsGrid
        newsReleases={mockNewsReleases}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
        onArchive={mockOnArchive}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('announcement')).toBeInTheDocument();
    expect(screen.getByText('update')).toBeInTheDocument();
    expect(screen.getByText('news')).toBeInTheDocument();
    expect(screen.getByText('event')).toBeInTheDocument();
  });

  it('should handle publish action for draft items', async () => {
    const user = userEvent.setup();

    render(
      <NewsGrid
        newsReleases={mockNewsReleases}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
        onArchive={mockOnArchive}
      />,
      { wrapper: createWrapper() }
    );

    // Find publish button for draft item
    const publishButtons = screen.getAllByLabelText('Publish');
    await user.click(publishButtons[0]);

    expect(mockOnPublish).toHaveBeenCalledWith('2');
  });

  it('should handle archive action for published items', async () => {
    const user = userEvent.setup();

    render(
      <NewsGrid
        newsReleases={mockNewsReleases}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
        onArchive={mockOnArchive}
      />,
      { wrapper: createWrapper() }
    );

    // Find archive button for published item
    const archiveButtons = screen.getAllByLabelText('Archive');
    await user.click(archiveButtons[0]);

    expect(mockOnArchive).toHaveBeenCalledWith('1');
  });

  it('should be accessible with keyboard navigation', async () => {
    const user = userEvent.setup();

    render(
      <NewsGrid
        newsReleases={mockNewsReleases}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
        onArchive={mockOnArchive}
      />,
      { wrapper: createWrapper() }
    );

    // Tab through interactive elements
    await user.tab();
    expect(document.activeElement).toHaveAttribute('aria-label');

    await user.keyboard('{Enter}');
    // Should trigger action on focused element
  });

  it('should display loading skeleton when loading prop is true', () => {
    render(
      <NewsGrid
        newsReleases={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
        onArchive={mockOnArchive}
        loading={true}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getAllByTestId('skeleton-loader')).toHaveLength(6);
  });

  it('should handle error state gracefully', () => {
    render(
      <NewsGrid
        newsReleases={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
        onArchive={mockOnArchive}
        error="Failed to load news releases"
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Failed to load news releases')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    render(
      <NewsGrid
        newsReleases={mockNewsReleases}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
        onArchive={mockOnArchive}
      />,
      { wrapper: createWrapper() }
    );

    // Check if dates are formatted
    expect(screen.getByText(/Jan 1, 2025/)).toBeInTheDocument();
  });

  it('should truncate long content in cards', () => {
    const longContentRelease = {
      ...mockNewsReleases[0],
      subtitle: {
        'pt-BR': 'This is a very long subtitle that should be truncated in the card view to maintain consistent layout',
        'en': 'This is a very long subtitle that should be truncated in the card view to maintain consistent layout',
        'es': 'This is a very long subtitle that should be truncated in the card view to maintain consistent layout'
      }
    };

    render(
      <NewsGrid
        newsReleases={[longContentRelease]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onPublish={mockOnPublish}
        onArchive={mockOnArchive}
      />,
      { wrapper: createWrapper() }
    );

    const subtitle = screen.getByText(/This is a very long subtitle/);
    expect(subtitle).toHaveClass('truncate');
  });
});