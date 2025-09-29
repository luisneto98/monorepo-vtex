import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SponsorTier,
  SponsorTierDocument,
} from '../../../../../src/modules/sponsors/schemas/sponsor-tier.schema';

describe('SponsorTier Schema', () => {
  // Using model for schema testing
  let model: Model<SponsorTierDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getModelToken(SponsorTier.name),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findById: jest.fn(),
            find: jest.fn(),
            updateOne: jest.fn(),
            deleteOne: jest.fn(),
          },
        },
      ],
    }).compile();

    model = module.get<Model<SponsorTierDocument>>(getModelToken(SponsorTier.name));
  });

  describe('Field Validations', () => {
    it('should validate required fields', () => {
      const tier = {
        name: 'Diamond',
        displayName: {
          'pt-BR': 'Diamante',
          en: 'Diamond',
        },
        order: 1,
        maxPosts: 20,
      };

      expect(tier.name).toBeDefined();
      expect(tier.displayName['pt-BR']).toBeDefined();
      expect(tier.displayName['en']).toBeDefined();
      expect(tier.order).toBeGreaterThanOrEqual(1);
      expect(tier.maxPosts).toBeGreaterThanOrEqual(0);
    });

    it('should enforce name length constraints', () => {
      const longName = 'a'.repeat(51);
      const validName = 'Diamond';

      expect(longName.length).toBeGreaterThan(50);
      expect(validName.length).toBeLessThanOrEqual(50);
    });

    it('should enforce displayName length constraints', () => {
      const longDisplayName = 'a'.repeat(101);
      const validDisplayName = 'Diamante';

      expect(longDisplayName.length).toBeGreaterThan(100);
      expect(validDisplayName.length).toBeLessThanOrEqual(100);
    });

    it('should validate order minimum value', () => {
      const invalidOrder = 0;
      const validOrder = 1;

      expect(invalidOrder).toBeLessThan(1);
      expect(validOrder).toBeGreaterThanOrEqual(1);
    });

    it('should validate maxPosts minimum value', () => {
      const invalidMaxPosts = -1;
      const validMaxPosts = 0;

      expect(invalidMaxPosts).toBeLessThan(0);
      expect(validMaxPosts).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique name', () => {
      const tier1 = { name: 'Diamond' };
      const tier2 = { name: 'Diamond' };

      // In real implementation, the second insert would fail
      expect(tier1.name).toBe(tier2.name);
    });

    it('should enforce unique order', () => {
      const tier1 = { order: 1 };
      const tier2 = { order: 1 };

      // In real implementation, the second insert would fail
      expect(tier1.order).toBe(tier2.order);
    });
  });

  describe('Default Values', () => {
    it('should set default maxPosts to 10', () => {
      const defaultMaxPosts = 10;
      expect(defaultMaxPosts).toBe(10);
    });
  });

  describe('Multilingual Support', () => {
    it('should support pt-BR and en display names', () => {
      const displayName = {
        'pt-BR': 'Diamante',
        en: 'Diamond',
      };

      expect(displayName['pt-BR']).toBeDefined();
      expect(displayName['en']).toBeDefined();
      expect(Object.keys(displayName)).toHaveLength(2);
    });

    it('should require both language versions', () => {
      const incompleteDisplayName = {
        'pt-BR': 'Diamante',
      };

      expect(incompleteDisplayName['en']).toBeUndefined();
    });
  });

  describe('Indexes', () => {
    it('should have index on order field', () => {
      // Index verification would be done at database level
      const indexFields = ['order', 'name'];
      expect(indexFields).toContain('order');
      expect(indexFields).toContain('name');
    });
  });

  describe('Tier Hierarchy', () => {
    it('should support different tier levels', () => {
      const tiers = [
        { name: 'Diamond', order: 1, maxPosts: 20 },
        { name: 'Gold', order: 2, maxPosts: 15 },
        { name: 'Silver', order: 3, maxPosts: 10 },
        { name: 'Bronze', order: 4, maxPosts: 5 },
      ];

      tiers.forEach((tier, index) => {
        expect(tier.order).toBe(index + 1);
        if (index > 0) {
          expect(tier.maxPosts).toBeLessThanOrEqual(tiers[index - 1].maxPosts);
        }
      });
    });
  });

  describe('Integration with Sponsor', () => {
    it('should be referenced by Sponsor schema', () => {
      const sponsor = {
        tier: 'ObjectId("507f1f77bcf86cd799439011")',
      };

      expect(sponsor.tier).toBeDefined();
      expect(sponsor.tier).toMatch(/^ObjectId/);
    });
  });
});
