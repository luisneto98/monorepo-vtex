import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';

describe('Breadcrumbs', () => {
  const renderBreadcrumbs = (initialPath: string) => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Breadcrumbs />
      </MemoryRouter>
    );
  };

  it('should display breadcrumbs for dashboard route', () => {
    renderBreadcrumbs('/dashboard');

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should display breadcrumbs for nested routes', () => {
    renderBreadcrumbs('/speakers');

    expect(screen.getByText('Palestrantes')).toBeInTheDocument();
  });

  it('should display multiple breadcrumb levels', () => {
    renderBreadcrumbs('/sponsors');

    expect(screen.getByText('Patrocinadores')).toBeInTheDocument();
  });

  it('should have home link in breadcrumbs', () => {
    renderBreadcrumbs('/faq');

    // Home icon should be present
    const homeLink = screen.getByRole('link', { name: '' });
    expect(homeLink).toHaveAttribute('href', '/dashboard');
  });

  it('should not render breadcrumbs for root path', () => {
    const { container } = renderBreadcrumbs('/');

    const nav = container.querySelector('nav');
    expect(nav).toBeNull();
  });
});