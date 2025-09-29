import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as sponsorsService from '../../../src/services/sponsors.service';
import { apiService } from '../../../src/services/api.service';

vi.mock('../../../src/services/api.service');

describe('Sponsors Service Integration', () => {
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
      standLocation: 'Hall A',
      adminEmail: 'admin@sponsor-a.com',
      contactEmail: 'contact@sponsor-a.com',
      socialLinks: {
        linkedin: 'https://linkedin.com/company/sponsor-a',
        instagram: 'https://instagram.com/sponsor-a',
        facebook: 'https://facebook.com/sponsor-a',
      },
      maxPosts: 10,
      postsUsed: 3,
      tags: ['tech', 'innovation'],
      isVisible: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSponsors', () => {
    it('fetches all sponsors with pagination', async () => {
      vi.spyOn(apiService, 'get').mockResolvedValue({
        data: mockSponsors,
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await sponsorsService.getSponsors({ page: 1, limit: 10 });

      expect(apiService.get).toHaveBeenCalledWith('/sponsors', { params: { page: 1, limit: 10 } });
      expect(result.data).toEqual(mockSponsors);
      expect(result.total).toBe(1);
    });

    it('filters sponsors by tier', async () => {
      vi.spyOn(apiService, 'get').mockResolvedValue({ data: mockSponsors });

      await sponsorsService.getSponsors({ tier: 'gold' });

      expect(apiService.get).toHaveBeenCalledWith('/sponsors', { params: { tier: 'gold' } });
    });

    it('filters sponsors by visibility', async () => {
      vi.spyOn(apiService, 'get').mockResolvedValue({
        data: mockSponsors.filter((s) => s.isVisible),
      });

      await sponsorsService.getSponsors({ isVisible: true });

      expect(apiService.get).toHaveBeenCalledWith('/sponsors', { params: { isVisible: true } });
    });

    it('searches sponsors by name', async () => {
      vi.spyOn(apiService, 'get').mockResolvedValue({ data: mockSponsors });

      await sponsorsService.getSponsors({ search: 'Sponsor A' });

      expect(apiService.get).toHaveBeenCalledWith('/sponsors', { params: { search: 'Sponsor A' } });
    });
  });

  describe('createSponsor', () => {
    const newSponsor = {
      name: 'New Sponsor',
      slug: 'new-sponsor',
      tier: 'silver',
      adminEmail: 'admin@newsponsor.com',
      websiteUrl: 'https://newsponsor.com',
    };

    it('creates a new sponsor', async () => {
      const createdSponsor = { ...newSponsor, _id: '2', createdAt: new Date().toISOString() };
      vi.spyOn(apiService, 'post').mockResolvedValue({ data: createdSponsor });

      const result = await sponsorsService.createSponsor(newSponsor);

      expect(apiService.post).toHaveBeenCalledWith('/sponsors', newSponsor);
      expect(result._id).toBe('2');
    });

    it('auto-generates slug if not provided', async () => {
      const sponsorWithoutSlug = { ...newSponsor, slug: undefined };
      vi.spyOn(apiService, 'post').mockResolvedValue({
        data: { ...sponsorWithoutSlug, slug: 'new-sponsor' },
      });

      const result = await sponsorsService.createSponsor(sponsorWithoutSlug);

      expect(result.slug).toBe('new-sponsor');
    });

    it('validates unique slug', async () => {
      vi.spyOn(apiService, 'post').mockRejectedValue(new Error('Slug already exists'));

      await expect(sponsorsService.createSponsor(newSponsor)).rejects.toThrow(
        'Slug already exists',
      );
    });

    it('validates email format', async () => {
      const invalidSponsor = { ...newSponsor, adminEmail: 'invalid-email' };
      vi.spyOn(apiService, 'post').mockRejectedValue(new Error('Invalid email format'));

      await expect(sponsorsService.createSponsor(invalidSponsor)).rejects.toThrow(
        'Invalid email format',
      );
    });
  });

  describe('updateSponsor', () => {
    it('updates sponsor details', async () => {
      const updates = { websiteUrl: 'https://updated.com', maxPosts: 20 };
      const updated = { ...mockSponsors[0], ...updates };
      vi.spyOn(apiService, 'put').mockResolvedValue({ data: updated });

      const result = await sponsorsService.updateSponsor('1', updates);

      expect(apiService.put).toHaveBeenCalledWith('/sponsors/1', updates);
      expect(result.websiteUrl).toBe('https://updated.com');
      expect(result.maxPosts).toBe(20);
    });

    it('updates sponsor tier and resets order', async () => {
      const updates = { tier: 'silver' };
      vi.spyOn(apiService, 'put').mockResolvedValue({
        data: { ...mockSponsors[0], tier: 'silver', orderInTier: 999 },
      });

      const result = await sponsorsService.updateSponsor('1', updates);

      expect(result.tier).toBe('silver');
      expect(result.orderInTier).toBe(999);
    });
  });

  describe('deleteSponsor', () => {
    it('soft deletes a sponsor', async () => {
      vi.spyOn(apiService, 'delete').mockResolvedValue({ data: { success: true } });

      await sponsorsService.deleteSponsor('1');

      expect(apiService.delete).toHaveBeenCalledWith('/sponsors/1');
    });

    it('handles sponsor not found', async () => {
      vi.spyOn(apiService, 'delete').mockRejectedValue(new Error('Sponsor not found'));

      await expect(sponsorsService.deleteSponsor('999')).rejects.toThrow('Sponsor not found');
    });
  });

  describe('bulkUpdateSponsors', () => {
    it('updates multiple sponsors visibility', async () => {
      vi.spyOn(apiService, 'put').mockResolvedValue({ data: { updated: 2 } });

      await sponsorsService.bulkUpdateSponsors(['1', '2'], { isVisible: false });

      expect(apiService.put).toHaveBeenCalledWith('/sponsors/bulk', {
        ids: ['1', '2'],
        updates: { isVisible: false },
      });
    });

    it('changes tier for multiple sponsors', async () => {
      vi.spyOn(apiService, 'put').mockResolvedValue({ data: { updated: 3 } });

      await sponsorsService.bulkUpdateSponsors(['1', '2', '3'], { tier: 'bronze' });

      expect(apiService.put).toHaveBeenCalledWith('/sponsors/bulk', {
        ids: ['1', '2', '3'],
        updates: { tier: 'bronze' },
      });
    });
  });

  describe('duplicateSponsor', () => {
    it('duplicates a sponsor with new name', async () => {
      const duplicated = {
        ...mockSponsors[0],
        _id: '2',
        name: 'Sponsor A (Copy)',
        slug: 'sponsor-a-copy',
      };
      vi.spyOn(apiService, 'post').mockResolvedValue({ data: duplicated });

      const result = await sponsorsService.duplicateSponsor('1', { name: 'Sponsor A (Copy)' });

      expect(apiService.post).toHaveBeenCalledWith('/sponsors/1/duplicate', {
        name: 'Sponsor A (Copy)',
      });
      expect(result._id).not.toBe('1');
      expect(result.name).toBe('Sponsor A (Copy)');
    });

    it('duplicates with selective fields', async () => {
      vi.spyOn(apiService, 'post').mockResolvedValue({
        data: { ...mockSponsors[0], _id: '2', socialLinks: undefined },
      });

      await sponsorsService.duplicateSponsor('1', {
        excludeFields: ['socialLinks', 'standLocation'],
      });

      expect(apiService.post).toHaveBeenCalledWith('/sponsors/1/duplicate', {
        excludeFields: ['socialLinks', 'standLocation'],
      });
    });
  });

  describe('exportSponsors', () => {
    it('exports sponsors to CSV', async () => {
      const csvData = 'name,tier,email\nSponsor A,gold,admin@sponsor-a.com';
      vi.spyOn(apiService, 'get').mockResolvedValue({ data: csvData });

      await sponsorsService.exportSponsors('csv');

      expect(apiService.get).toHaveBeenCalledWith('/sponsors/export', {
        params: { format: 'csv' },
        responseType: 'blob',
      });
    });

    it('exports sponsors to Excel', async () => {
      const excelBlob = new Blob(['excel data']);
      vi.spyOn(apiService, 'get').mockResolvedValue({ data: excelBlob });

      await sponsorsService.exportSponsors('excel');

      expect(apiService.get).toHaveBeenCalledWith('/sponsors/export', {
        params: { format: 'excel' },
        responseType: 'blob',
      });
    });

    it('exports filtered sponsors', async () => {
      vi.spyOn(apiService, 'get').mockResolvedValue({ data: 'filtered data' });

      await sponsorsService.exportSponsors('csv', { tier: 'gold', isVisible: true });

      expect(apiService.get).toHaveBeenCalledWith('/sponsors/export', {
        params: { format: 'csv', tier: 'gold', isVisible: true },
        responseType: 'blob',
      });
    });
  });

  describe('getSponsorsStatistics', () => {
    it('fetches sponsor statistics', async () => {
      const stats = {
        total: 50,
        byTier: { gold: 10, silver: 20, bronze: 20 },
        visible: 45,
        hidden: 5,
        totalPosts: 150,
        averagePostsUsed: 3,
      };

      vi.spyOn(apiService, 'get').mockResolvedValue({ data: stats });

      const result = await sponsorsService.getSponsorsStatistics();

      expect(apiService.get).toHaveBeenCalledWith('/sponsors/statistics');
      expect(result.total).toBe(50);
      expect(result.byTier.gold).toBe(10);
    });
  });

  describe('updateSponsorOrder', () => {
    it('updates sponsor order within tier', async () => {
      vi.spyOn(apiService, 'put').mockResolvedValue({ data: { success: true } });

      await sponsorsService.updateSponsorOrder('1', 'gold', 3);

      expect(apiService.put).toHaveBeenCalledWith('/sponsors/1/order', {
        tier: 'gold',
        orderInTier: 3,
      });
    });

    it('handles order conflicts', async () => {
      vi.spyOn(apiService, 'put').mockRejectedValue(new Error('Order conflict'));

      await expect(sponsorsService.updateSponsorOrder('1', 'gold', 1)).rejects.toThrow(
        'Order conflict',
      );
    });
  });

  describe('recoverDeletedSponsor', () => {
    it('recovers a soft-deleted sponsor', async () => {
      const recovered = { ...mockSponsors[0], isDeleted: false };
      vi.spyOn(apiService, 'post').mockResolvedValue({ data: recovered });

      const result = await sponsorsService.recoverDeletedSponsor('1');

      expect(apiService.post).toHaveBeenCalledWith('/sponsors/1/recover');
      expect(result.isDeleted).toBe(false);
    });

    it('handles sponsor not found in trash', async () => {
      vi.spyOn(apiService, 'post').mockRejectedValue(new Error('Sponsor not found in trash'));

      await expect(sponsorsService.recoverDeletedSponsor('999')).rejects.toThrow(
        'Sponsor not found in trash',
      );
    });
  });

  describe('getArchivedSponsors', () => {
    it('fetches archived sponsors', async () => {
      const archived = mockSponsors.map((s) => ({ ...s, isArchived: true }));
      vi.spyOn(apiService, 'get').mockResolvedValue({ data: archived });

      const result = await sponsorsService.getArchivedSponsors();

      expect(apiService.get).toHaveBeenCalledWith('/sponsors/archived');
      expect(result.every((s) => s.isArchived)).toBe(true);
    });
  });
});
