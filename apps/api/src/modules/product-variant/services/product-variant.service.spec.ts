import { Test, TestingModule } from '@nestjs/testing';
import { ProductVariantService } from './product-variant.service.js';
import { ProductVariant } from '../entities/product-variant.entity.js';
import { ProductVariantRepository } from '../repositories/product-variant.repository.js';
import { ProductUnit } from '../enums/product-variant.enum.js';
import {
  DuplicateResourceException,
  ItemNotFoundException,
} from '../../../common/exceptions/base.exception.js';
import { ERROR_CODES } from '../../../common/constants/error-code.constant.js';

import type { Mock } from 'vitest';
describe('ProductVariantService', () => {
  let service: ProductVariantService;
  let productVariantRepository: {
    findById: Mock;
    findBySku: Mock;
    findAllByProduct: Mock;
    create: Mock;
    save: Mock;
    softDelete: Mock;
  };

  const buildVariant = (
    overrides: Partial<ProductVariant> = {},
  ): ProductVariant =>
    ({
      id: 'variant-id-1',
      sku: 'SKU-1',
      weight: '250.000',
      unit: ProductUnit.G,
      name: '250g - Whole Bean',
      price: '10.00',
      discountType: null,
      discountValue: null,
      quantity: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...overrides,
    }) as ProductVariant;

  beforeEach(async () => {
    productVariantRepository = {
      findById: vi.fn(),
      findBySku: vi.fn(),
      findAllByProduct: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      softDelete: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductVariantService,
        {
          provide: ProductVariantRepository,
          useValue: productVariantRepository,
        },
      ],
    }).compile();

    service = module.get(ProductVariantService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createData = {
    productId: 'product-id-1',
    sku: 'SKU-1',
    weight: '250.000',
    unit: ProductUnit.G,
    price: '10.00',
  };

  describe('create', () => {
    it('creates and returns a variant on a unique SKU, deriving name from weight + unit', async () => {
      productVariantRepository.findBySku.mockResolvedValue(null);
      const created = buildVariant();
      productVariantRepository.create.mockResolvedValue(created);

      const result = await service.create(createData);

      expect(productVariantRepository.findBySku).toHaveBeenCalledWith('SKU-1');
      expect(productVariantRepository.create).toHaveBeenCalledWith({
        ...createData,
        name: '250.000G',
      });
      expect(result).toBe(created);
    });

    it('throws DuplicateResourceException on a duplicate SKU', async () => {
      productVariantRepository.findBySku.mockResolvedValue(buildVariant());
      expect.assertions(3);

      try {
        await service.create(createData);
      } catch (error) {
        expect(error).toBeInstanceOf(DuplicateResourceException);
        expect(
          (error as DuplicateResourceException).getErrors()[0].errCode,
        ).toBe(ERROR_CODES.PRODUCT_VARIANT.SKU_EXISTS);
      }
      expect(productVariantRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAllByProduct', () => {
    it('forwards the product id and returns the repository result unmodified', async () => {
      const variants = [buildVariant()];
      productVariantRepository.findAllByProduct.mockResolvedValue(variants);

      const result = await service.findAllByProduct('product-id-1');

      expect(productVariantRepository.findAllByProduct).toHaveBeenCalledWith(
        'product-id-1',
      );
      expect(result).toBe(variants);
    });
  });

  describe('findOne', () => {
    it('returns an existing variant', async () => {
      const variant = buildVariant();
      productVariantRepository.findById.mockResolvedValue(variant);

      const result = await service.findOne('variant-id-1');

      expect(result).toBe(variant);
    });

    it('throws ItemNotFoundException when the repository has no match', async () => {
      productVariantRepository.findById.mockResolvedValue(null);
      expect.assertions(2);

      try {
        await service.findOne('missing-id');
      } catch (error) {
        expect(error).toBeInstanceOf(ItemNotFoundException);
        expect((error as ItemNotFoundException).getErrors()[0].errCode).toBe(
          ERROR_CODES.PRODUCT_VARIANT.NOT_FOUND,
        );
      }
    });
  });

  describe('update', () => {
    it('re-checks SKU uniqueness only when the SKU changes', async () => {
      const variant = buildVariant();
      productVariantRepository.findById.mockResolvedValue(variant);

      await service.update('variant-id-1', { quantity: 5 });

      expect(productVariantRepository.findBySku).not.toHaveBeenCalled();
      expect(productVariantRepository.save).toHaveBeenCalledWith(variant);
    });

    it('recomputes name from weight + unit when weight changes', async () => {
      const variant = buildVariant();
      productVariantRepository.findById.mockResolvedValue(variant);

      const result = await service.update('variant-id-1', {
        weight: '500.000',
      });

      expect(result.name).toBe('500.000G');
      expect(productVariantRepository.save).toHaveBeenCalledWith(variant);
    });

    it('recomputes name from weight + unit when unit changes', async () => {
      const variant = buildVariant();
      productVariantRepository.findById.mockResolvedValue(variant);

      const result = await service.update('variant-id-1', {
        unit: ProductUnit.KG,
      });

      expect(result.name).toBe('250.000KG');
      expect(productVariantRepository.save).toHaveBeenCalledWith(variant);
    });

    it('throws DuplicateResourceException when the new SKU collides with another variant', async () => {
      const variant = buildVariant();
      productVariantRepository.findById.mockResolvedValue(variant);
      productVariantRepository.findBySku.mockResolvedValue(
        buildVariant({ id: 'other-variant-id', sku: 'SKU-2' }),
      );
      expect.assertions(3);

      try {
        await service.update('variant-id-1', { sku: 'SKU-2' });
      } catch (error) {
        expect(error).toBeInstanceOf(DuplicateResourceException);
        expect(
          (error as DuplicateResourceException).getErrors()[0].errCode,
        ).toBe(ERROR_CODES.PRODUCT_VARIANT.SKU_EXISTS);
      }
      expect(productVariantRepository.save).not.toHaveBeenCalled();
    });

    it('does not throw when the colliding row is the variant being updated itself', async () => {
      const variant = buildVariant();
      productVariantRepository.findById.mockResolvedValue(variant);
      productVariantRepository.findBySku.mockResolvedValue(variant);

      const result = await service.update('variant-id-1', { sku: 'SKU-1' });

      expect(result).toBe(variant);
      expect(productVariantRepository.save).toHaveBeenCalledWith(variant);
    });

    it('throws ItemNotFoundException for a missing id', async () => {
      productVariantRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('missing-id', { quantity: 5 }),
      ).rejects.toBeInstanceOf(ItemNotFoundException);
      expect(productVariantRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('soft-deletes the loaded variant', async () => {
      const variant = buildVariant();
      productVariantRepository.findById.mockResolvedValue(variant);

      await service.remove('variant-id-1');

      expect(productVariantRepository.softDelete).toHaveBeenCalledWith(variant);
    });

    it('throws ItemNotFoundException for a missing id', async () => {
      productVariantRepository.findById.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toBeInstanceOf(
        ItemNotFoundException,
      );
      expect(productVariantRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
