import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';

// Mock zustand store
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    user: { name: 'Test User', email: 'test@example.com' },
    logout: vi.fn(),
  }),
}));

describe('Layout', () => {
  const renderLayout = (children: React.ReactNode) => {
    return render(
      <BrowserRouter>
        <Layout>{children}</Layout>
      </BrowserRouter>
    );
  };

  it('should render layout with sidebar, header and content', () => {
    renderLayout(<div>Test Content</div>);

    // Check for header elements
    expect(screen.getByText('Painel Administrativo')).toBeInTheDocument();

    // Check for sidebar elements
    expect(screen.getByText('VTEX DAY 26')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Palestrantes')).toBeInTheDocument();
    expect(screen.getByText('Palestras')).toBeInTheDocument();

    // Check for content
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should display user information in header', () => {
    renderLayout(<div>Content</div>);

    // User email should be visible
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should have logout button', () => {
    renderLayout(<div>Content</div>);

    const logoutButton = screen.getByRole('button', { name: /fazer logout/i });
    expect(logoutButton).toBeInTheDocument();
  });

  it('should have navigation menu items', () => {
    renderLayout(<div>Content</div>);

    const menuItems = [
      'Dashboard',
      'Palestrantes',
      'Palestras',
      'Patrocinadores',
      'FAQ',
      'Visibilidade',
      'Notificações',
    ];

    menuItems.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });
});