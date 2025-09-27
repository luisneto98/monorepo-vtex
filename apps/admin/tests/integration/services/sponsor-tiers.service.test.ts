import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as sponsorTiersService from '../../../src/services/sponsor-tiers.service';
import { apiService } from '../../../src/services/api.service';

vi.mock('../../../src/services/api.service');

describe('Sponsor Tiers Service Integration', () => {
  const mockApiResponse = {
    data: [
      {
        _id: '1',
        name: 'gold',
        displayName: { 'pt-BR': 'Ouro', en: 'Gold' },
        order: 1,
        maxPosts: 10,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      },
      {
        _id: '2',
        name: 'silver',
        displayName: { 'pt-BR': 'Prata', en: 'Silver' },
        order: 2,
        maxPosts: 5,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSponsorTiers', () => {
    it('fetches all sponsor tiers', async () => {
      vi.spyOn(apiService, 'get').mockResolvedValue(mockApiResponse);

      const result = await sponsorTiersService.getSponsorTiers();

      expect(apiService.get).toHaveBeenCalledWith('/sponsor-tiers');
      expect(result).toEqual(mockApiResponse.data);
      expect(result).toHaveLength(2);
    });

    it('handles empty response', async () => {
      vi.spyOn(apiService, 'get').mockResolvedValue({ data: [] });

      const result = await sponsorTiersService.getSponsorTiers();

      expect(result).toEqual([]);
    });

    it('handles API error', async () => {
      vi.spyOn(apiService, 'get').mockRejectedValue(new Error('Network error'));

      await expect(sponsorTiersService.getSponsorTiers()).rejects.toThrow('Network error');
    });
  });

  describe('getSponsorTierById', () => {
    it('fetches a single tier by id', async () => {
      vi.spyOn(apiService, 'get').mockResolvedValue({ data: mockApiResponse.data[0] });

      const result = await sponsorTiersService.getSponsorTierById('1');

      expect(apiService.get).toHaveBeenCalledWith('/sponsor-tiers/1');
      expect(result.name).toBe('gold');
    });

    it('handles not found error', async () => {
      vi.spyOn(apiService, 'get').mockRejectedValue(new Error('Tier not found'));

      await expect(sponsorTiersService.getSponsorTierById('999')).rejects.toThrow('Tier not found');
    });
  });

  describe('createSponsorTier', () => {
    const newTier = {
      name: 'bronze',
      displayName: { 'pt-BR': 'Bronze', en: 'Bronze' },
      order: 3,
      maxPosts: 3
    };

    it('creates a new tier', async () => {
      const createdTier = { ...newTier, _id: '3', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      vi.spyOn(apiService, 'post').mockResolvedValue({ data: createdTier });

      const result = await sponsorTiersService.createSponsorTier(newTier);

      expect(apiService.post).toHaveBeenCalledWith('/sponsor-tiers', newTier);
      expect(result._id).toBe('3');
      expect(result.name).toBe('bronze');
    });

    it('validates required fields', async () => {
      const invalidTier = { name: '', maxPosts: -1 };

      vi.spyOn(apiService, 'post').mockRejectedValue(new Error('Validation error'));

      await expect(sponsorTiersService.createSponsorTier(invalidTier)).rejects.toThrow('Validation error');
    });

    it('handles duplicate tier name', async () => {
      vi.spyOn(apiService, 'post').mockRejectedValue(new Error('Tier name already exists'));

      await expect(sponsorTiersService.createSponsorTier(newTier)).rejects.toThrow('Tier name already exists');
    });
  });

  describe('updateSponsorTier', () => {
    const updates = {
      displayName: { 'pt-BR': 'Ouro Premium', en: 'Premium Gold' },
      maxPosts: 15
    };

    it('updates an existing tier', async () => {
      const updatedTier = { ...mockApiResponse.data[0], ...updates };
      vi.spyOn(apiService, 'put').mockResolvedValue({ data: updatedTier });

      const result = await sponsorTiersService.updateSponsorTier('1', updates);

      expect(apiService.put).toHaveBeenCalledWith('/sponsor-tiers/1', updates);
      expect(result.maxPosts).toBe(15);
    });

    it('handles partial updates', async () => {
      const partialUpdate = { maxPosts: 20 };
      const updatedTier = { ...mockApiResponse.data[0], ...partialUpdate };
      vi.spyOn(apiService, 'put').mockResolvedValue({ data: updatedTier });

      const result = await sponsorTiersService.updateSponsorTier('1', partialUpdate);

      expect(result.maxPosts).toBe(20);
      expect(result.displayName).toEqual(mockApiResponse.data[0].displayName);
    });

    it('validates update data', async () => {
      vi.spyOn(apiService, 'put').mockRejectedValue(new Error('Invalid update data'));

      await expect(sponsorTiersService.updateSponsorTier('1', { maxPosts: -5 })).rejects.toThrow('Invalid update data');
    });
  });

  describe('deleteSponsorTier', () => {
    it('deletes a tier successfully', async () => {
      vi.spyOn(apiService, 'delete').mockResolvedValue({ data: { success: true } });

      await sponsorTiersService.deleteSponsorTier('1');

      expect(apiService.delete).toHaveBeenCalledWith('/sponsor-tiers/1');
    });

    it('prevents deletion of tier with sponsors', async () => {
      vi.spyOn(apiService, 'delete').mockRejectedValue(new Error('Cannot delete tier with associated sponsors'));

      await expect(sponsorTiersService.deleteSponsorTier('1')).rejects.toThrow('Cannot delete tier with associated sponsors');
    });

    it('handles tier not found', async () => {
      vi.spyOn(apiService, 'delete').mockRejectedValue(new Error('Tier not found'));

      await expect(sponsorTiersService.deleteSponsorTier('999')).rejects.toThrow('Tier not found');
    });
  });

  describe('updateTierOrder', () => {
    it('updates tier ordering', async () => {
      const newOrder = [
        { id: '2', order: 1 },
        { id: '1', order: 2 }
      ];

      vi.spyOn(apiService, 'put').mockResolvedValue({ data: { success: true } });

      await sponsorTiersService.updateTierOrder(newOrder);

      expect(apiService.put).toHaveBeenCalledWith('/sponsor-tiers/reorder', { tiers: newOrder });
    });

    it('validates order uniqueness', async () => {
      const invalidOrder = [
        { id: '1', order: 1 },
        { id: '2', order: 1 } // Duplicate order
      ];

      vi.spyOn(apiService, 'put').mockRejectedValue(new Error('Order values must be unique'));

      await expect(sponsorTiersService.updateTierOrder(invalidOrder)).rejects.toThrow('Order values must be unique');
    });

    it('handles concurrent update conflicts', async () => {
      vi.spyOn(apiService, 'put').mockRejectedValue(new Error('Concurrent update conflict'));

      await expect(sponsorTiersService.updateTierOrder([])).rejects.toThrow('Concurrent update conflict');
    });
  });

  describe('getTiersWithSponsorsCount', () => {
    it('fetches tiers with sponsor counts', async () => {
      const tiersWithCounts = mockApiResponse.data.map((tier, index) => ({
        ...tier,
        sponsorCount: (index + 1) * 5
      }));

      vi.spyOn(apiService, 'get').mockResolvedValue({ data: tiersWithCounts });

      const result = await sponsorTiersService.getTiersWithSponsorsCount();

      expect(apiService.get).toHaveBeenCalledWith('/sponsor-tiers/with-counts');
      expect(result[0].sponsorCount).toBe(5);
      expect(result[1].sponsorCount).toBe(10);
    });

    it('handles tiers with zero sponsors', async () => {
      const tiersWithZeroCount = mockApiResponse.data.map(tier => ({
        ...tier,
        sponsorCount: 0
      }));

      vi.spyOn(apiService, 'get').mockResolvedValue({ data: tiersWithZeroCount });

      const result = await sponsorTiersService.getTiersWithSponsorsCount();

      expect(result.every(tier => tier.sponsorCount === 0)).toBe(true);
    });
  });
});