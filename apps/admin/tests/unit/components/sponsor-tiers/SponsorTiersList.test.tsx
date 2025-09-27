import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SponsorTiersList } from '../../../../src/components/sponsor-tiers/SponsorTiersList';
import * as sponsorTiersService from '../../../../src/services/sponsor-tiers.service';

vi.mock('../../../../src/services/sponsor-tiers.service');

describe('SponsorTiersList', () => {
  const mockTiers = [
    {
      _id: '1',
      name: 'gold',
      displayName: { 'pt-BR': 'Ouro', en: 'Gold' },
      order: 1,
      maxPosts: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: '2',
      name: 'silver',
      displayName: { 'pt-BR': 'Prata', en: 'Silver' },
      order: 2,
      maxPosts: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tier list correctly', async () => {
    vi.spyOn(sponsorTiersService, 'getSponsorTiers').mockResolvedValue(mockTiers);

    render(<SponsorTiersList />);

    await waitFor(() => {
      expect(screen.getByText('Gold')).toBeInTheDocument();
      expect(screen.getByText('Silver')).toBeInTheDocument();
    });
  });

  it('handles tier creation', async () => {
    vi.spyOn(sponsorTiersService, 'getSponsorTiers').mockResolvedValue(mockTiers);
    vi.spyOn(sponsorTiersService, 'createSponsorTier');

    render(<SponsorTiersList />);

    const addButton = await screen.findByRole('button', { name: /add tier/i });
    fireEvent.click(addButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('handles tier deletion with confirmation', async () => {
    vi.spyOn(sponsorTiersService, 'getSponsorTiers').mockResolvedValue(mockTiers);
    const deleteSpy = vi.spyOn(sponsorTiersService, 'deleteSponsorTier').mockResolvedValue(undefined);

    render(<SponsorTiersList />);

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

  it('handles tier reordering', async () => {
    vi.spyOn(sponsorTiersService, 'getSponsorTiers').mockResolvedValue(mockTiers);
    vi.spyOn(sponsorTiersService, 'updateTierOrder').mockResolvedValue(undefined);

    render(<SponsorTiersList />);

    await waitFor(() => {
      const upButtons = screen.getAllByRole('button', { name: /move up/i });
      expect(upButtons.length).toBeGreaterThan(0);
    });
  });

  it('displays sponsor count per tier', async () => {
    const tiersWithCount = mockTiers.map(tier => ({ ...tier, sponsorCount: 3 }));
    vi.spyOn(sponsorTiersService, 'getSponsorTiers').mockResolvedValue(tiersWithCount);

    render(<SponsorTiersList />);

    await waitFor(() => {
      expect(screen.getByText(/3 sponsors/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(sponsorTiersService, 'getSponsorTiers').mockRejectedValue(new Error('API Error'));

    render(<SponsorTiersList />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});