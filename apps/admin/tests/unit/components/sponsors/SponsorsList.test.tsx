import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SponsorsList } from '../../../../src/components/sponsors/SponsorsList';
import * as sponsorsService from '../../../../src/services/sponsors.service';
import * as sponsorTiersService from '../../../../src/services/sponsor-tiers.service';

vi.mock('../../../../src/services/sponsors.service');
vi.mock('../../../../src/services/sponsor-tiers.service');

describe('SponsorsList', () => {
  const mockSponsors = [
    {
      _id: '1',
      name: 'Sponsor A',
      slug: 'sponsor-a',
      description: { 'pt-BR': 'Descrição A', en: 'Description A' },
      logoUrl: 'https://example.com/logo-a.png',
      tier: 'gold',
      orderInTier: 1,
      websiteUrl: 'https://sponsor-a.com',
      adminEmail: 'admin@sponsor-a.com',
      maxPosts: 10,
      postsUsed: 3,
      tags: ['tech'],
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: '2',
      name: 'Sponsor B',
      slug: 'sponsor-b',
      description: { 'pt-BR': 'Descrição B', en: 'Description B' },
      logoUrl: 'https://example.com/logo-b.png',
      tier: 'silver',
      orderInTier: 1,
      websiteUrl: 'https://sponsor-b.com',
      adminEmail: 'admin@sponsor-b.com',
      maxPosts: 5,
      postsUsed: 2,
      tags: ['finance'],
      isVisible: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const mockTiers = [
    {
      _id: '1',
      name: 'gold',
      displayName: { 'pt-BR': 'Ouro', en: 'Gold' },
      order: 1,
      maxPosts: 10
    },
    {
      _id: '2',
      name: 'silver',
      displayName: { 'pt-BR': 'Prata', en: 'Silver' },
      order: 2,
      maxPosts: 5
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(sponsorTiersService, 'getSponsorTiers').mockResolvedValue(mockTiers);
  });

  it('renders sponsors list with data', async () => {
    vi.spyOn(sponsorsService, 'getSponsors').mockResolvedValue(mockSponsors);

    render(<SponsorsList />);

    await waitFor(() => {
      expect(screen.getByText('Sponsor A')).toBeInTheDocument();
      expect(screen.getByText('Sponsor B')).toBeInTheDocument();
    });
  });

  it('displays sponsor tier badges', async () => {
    vi.spyOn(sponsorsService, 'getSponsors').mockResolvedValue(mockSponsors);

    render(<SponsorsList />);

    await waitFor(() => {
      expect(screen.getByText('Gold')).toBeInTheDocument();
      expect(screen.getByText('Silver')).toBeInTheDocument();
    });
  });

  it('shows posts usage information', async () => {
    vi.spyOn(sponsorsService, 'getSponsors').mockResolvedValue(mockSponsors);

    render(<SponsorsList />);

    await waitFor(() => {
      expect(screen.getByText('3 / 10')).toBeInTheDocument();
      expect(screen.getByText('2 / 5')).toBeInTheDocument();
    });
  });

  it('filters sponsors by search term', async () => {
    vi.spyOn(sponsorsService, 'getSponsors').mockResolvedValue(mockSponsors);

    render(<SponsorsList />);

    await waitFor(() => {
      expect(screen.getByText('Sponsor A')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search sponsors/i);
    fireEvent.change(searchInput, { target: { value: 'Sponsor A' } });

    await waitFor(() => {
      expect(screen.getByText('Sponsor A')).toBeInTheDocument();
      expect(screen.queryByText('Sponsor B')).not.toBeInTheDocument();
    });
  });

  it('filters sponsors by tier', async () => {
    vi.spyOn(sponsorsService, 'getSponsors').mockResolvedValue(mockSponsors);

    render(<SponsorsList />);

    await waitFor(() => {
      expect(screen.getByText('Sponsor A')).toBeInTheDocument();
      expect(screen.getByText('Sponsor B')).toBeInTheDocument();
    });

    const tierFilter = screen.getByRole('combobox', { name: /tier/i });
    fireEvent.change(tierFilter, { target: { value: 'gold' } });

    await waitFor(() => {
      expect(screen.getByText('Sponsor A')).toBeInTheDocument();
      expect(screen.queryByText('Sponsor B')).not.toBeInTheDocument();
    });
  });

  it('filters sponsors by visibility', async () => {
    vi.spyOn(sponsorsService, 'getSponsors').mockResolvedValue(mockSponsors);

    render(<SponsorsList />);

    await waitFor(() => {
      expect(screen.getByText('Sponsor A')).toBeInTheDocument();
      expect(screen.getByText('Sponsor B')).toBeInTheDocument();
    });

    const visibilityFilter = screen.getByRole('combobox', { name: /visibility/i });
    fireEvent.change(visibilityFilter, { target: { value: 'visible' } });

    await waitFor(() => {
      expect(screen.getByText('Sponsor A')).toBeInTheDocument();
      expect(screen.queryByText('Sponsor B')).not.toBeInTheDocument();
    });
  });

  it('handles sponsor selection for bulk actions', async () => {
    vi.spyOn(sponsorsService, 'getSponsors').mockResolvedValue(mockSponsors);

    render(<SponsorsList onSelectionChange={vi.fn()} />);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    const firstCheckbox = screen.getAllByRole('checkbox')[1]; // Skip header checkbox
    fireEvent.click(firstCheckbox);

    expect(firstCheckbox).toBeChecked();
  });

  it('handles select all sponsors', async () => {
    vi.spyOn(sponsorsService, 'getSponsors').mockResolvedValue(mockSponsors);

    render(<SponsorsList onSelectionChange={vi.fn()} />);

    await waitFor(() => {
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(selectAllCheckbox);
    });

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.slice(1).forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
  });

  it('handles sponsor deletion', async () => {
    vi.spyOn(sponsorsService, 'getSponsors').mockResolvedValue(mockSponsors);
    const deleteSpy = vi.spyOn(sponsorsService, 'deleteSponsor').mockResolvedValue(undefined);

    render(<SponsorsList />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);
    });

    const confirmButton = await screen.findByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('1');
    });
  });

  it('handles sponsor duplication', async () => {
    vi.spyOn(sponsorsService, 'getSponsors').mockResolvedValue(mockSponsors);

    const mockOnDuplicate = vi.fn();
    render(<SponsorsList onDuplicate={mockOnDuplicate} />);

    await waitFor(() => {
      const duplicateButtons = screen.getAllByRole('button', { name: /duplicate/i });
      fireEvent.click(duplicateButtons[0]);
    });

    expect(mockOnDuplicate).toHaveBeenCalledWith(mockSponsors[0]);
  });

  it('sorts sponsors by column', async () => {
    vi.spyOn(sponsorsService, 'getSponsors').mockResolvedValue(mockSponsors);

    render(<SponsorsList />);

    await waitFor(() => {
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      fireEvent.click(nameHeader);
    });

    // Verify sort indicator appears
    expect(screen.getByLabelText(/sort/i)).toBeInTheDocument();
  });

  it('handles empty state', async () => {
    vi.spyOn(sponsorsService, 'getSponsors').mockResolvedValue([]);

    render(<SponsorsList />);

    await waitFor(() => {
      expect(screen.getByText(/no sponsors found/i)).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    vi.spyOn(sponsorsService, 'getSponsors').mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<SponsorsList />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(sponsorsService, 'getSponsors').mockRejectedValue(new Error('API Error'));

    render(<SponsorsList />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load sponsors/i)).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});