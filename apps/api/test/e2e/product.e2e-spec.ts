import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { getAuth } from '@clerk/express';
import type { Mock } from 'vitest';
import { AppModule } from './../../src/app.module.js';
import { UserService } from './../../src/modules/user/services/user.service.js';
import { CategoryService } from './../../src/modules/category/services/category.service.js';
import { ProductService } from './../../src/modules/product/services/product.service.js';
import { ProductImageService } from './../../src/modules/product-image/services/product-image.service.js';
import { ProductVariantService } from './../../src/modules/product-variant/services/product-variant.service.js';
import { UserRole } from './../../src/common/enums/user.enum.js';
import { API_BASE_PATH } from './../utils/api-path.util.js';
import { initTestApp } from './../utils/init-test-app.util.js';
import {
  DiscountType,
  ProductUnit,
} from './../../src/modules/product-variant/enums/product-variant.enum.js';
import type { User } from './../../src/modules/user/entities/user.entity.js';
import type { Category } from './../../src/modules/category/entities/category.entity.js';
import type { Product } from './../../src/modules/product/entities/product.entity.js';
import { ERROR_CODES } from './../../src/common/constants/error-code.constant.js';
import { slugFrom } from './../../src/common/utils/slug.util.js';
import {
  ProductSortBy,
  ProductStatus,
  RoastLevel,
} from './../../src/modules/product/enums/product.enum.js';

vi.mock('@clerk/express', async () => {
  const actual: object = await vi.importActual('@clerk/express');
  return { ...actual, getAuth: vi.fn() };
});

describe('ProductController (e2e)', () => {
  let app: INestApplication<App>;
  let orm: MikroORM;
  let userService: UserService;
  let categoryService: CategoryService;
  let productService: ProductService;
  let productImageService: ProductImageService;
  let productVariantService: ProductVariantService;
  const createdUserIds: string[] = [];
  const createdCategoryIds: string[] = [];
  const createdProductIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await initTestApp(moduleFixture);

    orm = app.get(MikroORM);
    userService = app.get(UserService);
    categoryService = app.get(CategoryService);
    productService = app.get(ProductService);
    productImageService = app.get(ProductImageService);
    productVariantService = app.get(ProductVariantService);
  });

  afterAll(async () => {
    await RequestContext.create(orm.em, async () => {
      for (const id of createdProductIds) {
        await productService.remove(id).catch(() => undefined);
      }
      for (const id of createdCategoryIds) {
        await categoryService.remove(id).catch(() => undefined);
      }
      for (const id of createdUserIds) {
        await userService.remove(id).catch(() => undefined);
      }
    });
    await app.close();
  });

  beforeEach(() => {
    (getAuth as Mock).mockReturnValue({ userId: null });
  });

  const uniqueName = (base: string): string =>
    `${base} ${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const validImages = (): Array<{ url: string; isPrimary?: boolean }> => [
    { url: 'https://example.com/1.jpg', isPrimary: true },
    { url: 'https://example.com/2.jpg' },
  ];

  const requiredProductFields = (): {
    roastLevel: RoastLevel;
    description: string;
    origin: string;
    processingMethod: string;
  } => ({
    roastLevel: RoastLevel.MEDIUM,
    description: 'A balanced, well-rounded coffee.',
    origin: 'Ethiopia',
    processingMethod: 'Washed',
  });

  const validVariant = (
    skuBase: string,
  ): {
    sku: string;
    weight: number;
    unit: ProductUnit;
    price: number;
  } => ({
    sku: uniqueName(skuBase),
    weight: 250,
    unit: ProductUnit.G,
    price: 12.5,
  });

  const createTestUser = async (role: UserRole): Promise<User> =>
    RequestContext.create(orm.em, async () => {
      const clerkId = `clerk-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const user = await userService.create({
        clerkId,
        email: `${clerkId}@example.com`,
        firstName: 'E2E',
        lastName: 'Test',
        role,
      });
      createdUserIds.push(user.id);
      return user;
    });

  const createTestCategory = async (): Promise<Category> =>
    RequestContext.create(orm.em, async () => {
      const category = await categoryService.create({
        name: uniqueName('Coffee Category E2E'),
      });
      createdCategoryIds.push(category.id);
      return category;
    });

  const mockSessionFor = (clerkId: string | null): void => {
    (getAuth as Mock).mockReturnValue({ userId: clerkId });
  };

  describe('public GET routes', () => {
    it('GET /products responds 200 with the paginated envelope, no session required', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
    });

    it('GET /products/:id responds 200 for an existing product, no session required', async () => {
      const category = await createTestCategory();
      const name = uniqueName('Ethiopia Yirgacheffe E2E');
      const product = await RequestContext.create(orm.em, () =>
        productService.create({
          categoryId: category.id,
          name,
          ...requiredProductFields(),
          images: [],
          variants: [],
        }),
      );
      createdProductIds.push(product.id);

      const response = await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products/${product.id}`)
        .expect(200);

      const body = response.body as {
        data: { categoryId: string; images: unknown[]; variants: unknown[] };
      };
      expect(body.data).toMatchObject({
        id: product.id,
        categoryId: category.id,
        name,
        slug: slugFrom(name),
      });
      expect(body.data.images).toEqual([]);
      expect(body.data.variants).toEqual([]);
    });

    it('GET /products/:id responds 404 for a missing product', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products/00000000-0000-0000-0000-000000000000`)
        .expect(404);

      const body = response.body as {
        errors: Array<{ errCode: string }>;
      };
      expect(body.errors[0].errCode).toBe(ERROR_CODES.PRODUCT.NOT_FOUND);
    });
  });

  describe('GET /products filtering and sorting (e2e)', () => {
    let filterCategory: Category;
    let otherCategory: Category;
    let nameCategory: Category;
    let priceCategory: Category;

    let pLight: Product;
    let pMedium: Product;
    let pDarkInactive: Product;
    let pSearchTarget: Product;
    let pOther: Product;

    let pNameA: Product;
    let pNameB: Product;
    let pNameC: Product;

    let pPrice10: Product;
    let pPrice20: Product;
    let pNoVariant: Product;
    let pGlobalMin: Product;
    let pSimple: Product;

    const searchTerm = uniqueName('SearchTerm');

    beforeAll(async () => {
      filterCategory = await createTestCategory();
      otherCategory = await createTestCategory();
      nameCategory = await createTestCategory();
      priceCategory = await createTestCategory();

      type ProductCreateInput = Parameters<typeof productService.create>[0];

      const create = (
        data: Partial<ProductCreateInput> &
          Pick<ProductCreateInput, 'categoryId' | 'name'>,
      ): Promise<Product> =>
        RequestContext.create(orm.em, () =>
          productService.create({
            ...requiredProductFields(),
            images: [],
            variants: [],
            ...data,
          }),
        );

      pLight = await create({
        categoryId: filterCategory.id,
        name: uniqueName('Filter Light'),
        roastLevel: RoastLevel.LIGHT,
        status: ProductStatus.ACTIVE,
      });
      pMedium = await create({
        categoryId: filterCategory.id,
        name: uniqueName('Filter Medium'),
        roastLevel: RoastLevel.MEDIUM,
        status: ProductStatus.ACTIVE,
      });
      pDarkInactive = await create({
        categoryId: filterCategory.id,
        name: uniqueName('Filter Dark'),
        roastLevel: RoastLevel.DARK,
        status: ProductStatus.INACTIVE,
      });
      pSearchTarget = await create({
        categoryId: filterCategory.id,
        name: `${searchTerm} Roast`,
        roastLevel: RoastLevel.LIGHT,
        status: ProductStatus.ACTIVE,
      });
      pOther = await create({
        categoryId: otherCategory.id,
        name: uniqueName('Other Category Product'),
      });

      pNameA = await create({
        categoryId: nameCategory.id,
        name: uniqueName('AAA Sort Product'),
      });
      pNameB = await create({
        categoryId: nameCategory.id,
        name: uniqueName('BBB Sort Product'),
      });
      pNameC = await create({
        categoryId: nameCategory.id,
        name: uniqueName('CCC Sort Product'),
      });

      pPrice10 = await create({
        categoryId: priceCategory.id,
        name: uniqueName('Price Ten'),
        variants: [
          {
            sku: uniqueName('SKU-10'),
            weight: '250.000',
            unit: ProductUnit.G,
            price: '10.00',
          },
        ],
      });
      pPrice20 = await create({
        categoryId: priceCategory.id,
        name: uniqueName('Price Twenty'),
        variants: [
          {
            sku: uniqueName('SKU-20'),
            weight: '250.000',
            unit: ProductUnit.G,
            price: '20.00',
          },
        ],
      });
      pNoVariant = await create({
        categoryId: priceCategory.id,
        name: uniqueName('Price NoVariant'),
      });
      pGlobalMin = await create({
        categoryId: priceCategory.id,
        name: uniqueName('Price GlobalMin'),
        variants: [
          {
            sku: uniqueName('SKU-GM-LOW'),
            weight: '100.000',
            unit: ProductUnit.G,
            price: '5.00',
          },
          {
            sku: uniqueName('SKU-GM-HIGH'),
            weight: '500.000',
            unit: ProductUnit.G,
            price: '18.00',
          },
        ],
      });
      pSimple = await create({
        categoryId: priceCategory.id,
        name: uniqueName('Price Simple'),
        variants: [
          {
            sku: uniqueName('SKU-SIMPLE'),
            weight: '250.000',
            unit: ProductUnit.G,
            price: '12.00',
          },
        ],
      });

      createdProductIds.push(
        pLight.id,
        pMedium.id,
        pDarkInactive.id,
        pSearchTarget.id,
        pOther.id,
        pNameA.id,
        pNameB.id,
        pNameC.id,
        pPrice10.id,
        pPrice20.id,
        pNoVariant.id,
        pGlobalMin.id,
        pSimple.id,
      );
      createdCategoryIds.push(
        filterCategory.id,
        otherCategory.id,
        nameCategory.id,
        priceCategory.id,
      );
    });

    const idsOf = (body: { data: Array<{ id: string }> }): string[] =>
      body.data.map((p) => p.id);

    it('filters by categoryId', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products`)
        .query({ categoryId: filterCategory.id, limit: 50 })
        .expect(200);

      const ids = idsOf(response.body as { data: Array<{ id: string }> });
      expect([...ids].sort()).toEqual(
        [pLight.id, pMedium.id, pDarkInactive.id, pSearchTarget.id].sort(),
      );
      expect(ids).not.toContain(pOther.id);
    });

    it('filters by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products`)
        .query({
          categoryId: filterCategory.id,
          status: ProductStatus.ACTIVE,
          limit: 50,
        })
        .expect(200);

      const ids = idsOf(response.body as { data: Array<{ id: string }> });
      expect([...ids].sort()).toEqual(
        [pLight.id, pMedium.id, pSearchTarget.id].sort(),
      );
      expect(ids).not.toContain(pDarkInactive.id);
    });

    it('filters by a single roastLevel', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products`)
        .query({
          categoryId: filterCategory.id,
          roastLevel: RoastLevel.MEDIUM,
          limit: 50,
        })
        .expect(200);

      expect(idsOf(response.body as { data: Array<{ id: string }> })).toEqual([
        pMedium.id,
      ]);
    });

    it('filters by a comma-separated multi-value roastLevel', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products`)
        .query({
          categoryId: filterCategory.id,
          roastLevel: `${RoastLevel.LIGHT},${RoastLevel.MEDIUM}`,
          limit: 50,
        })
        .expect(200);

      const ids = idsOf(response.body as { data: Array<{ id: string }> });
      expect([...ids].sort()).toEqual(
        [pLight.id, pMedium.id, pSearchTarget.id].sort(),
      );
      expect(ids).not.toContain(pDarkInactive.id);
    });

    it('filters by minPrice/maxPrice, matching a product if any non-deleted variant is in range', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products`)
        .query({
          categoryId: priceCategory.id,
          minPrice: 15,
          maxPrice: 25,
          limit: 50,
        })
        .expect(200);

      const ids = idsOf(response.body as { data: Array<{ id: string }> });
      expect([...ids].sort()).toEqual([pPrice20.id, pGlobalMin.id].sort());
    });

    it('responds 400 when minPrice is greater than maxPrice', async () => {
      await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products`)
        .query({ minPrice: 100, maxPrice: 10 })
        .expect(400);
    });

    it('combines categoryId and search', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products`)
        .query({ categoryId: filterCategory.id, search: searchTerm, limit: 50 })
        .expect(200);

      expect(idsOf(response.body as { data: Array<{ id: string }> })).toEqual([
        pSearchTarget.id,
      ]);
    });

    it('sortBy NAME_ASC orders alphabetically ascending', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products`)
        .query({
          categoryId: nameCategory.id,
          sortBy: ProductSortBy.NAME_ASC,
          limit: 50,
        })
        .expect(200);

      expect(idsOf(response.body as { data: Array<{ id: string }> })).toEqual([
        pNameA.id,
        pNameB.id,
        pNameC.id,
      ]);
    });

    it('sortBy NAME_DESC orders alphabetically descending', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products`)
        .query({
          categoryId: nameCategory.id,
          sortBy: ProductSortBy.NAME_DESC,
          limit: 50,
        })
        .expect(200);

      expect(idsOf(response.body as { data: Array<{ id: string }> })).toEqual([
        pNameC.id,
        pNameB.id,
        pNameA.id,
      ]);
    });

    it('sortBy PRICE_ASC orders by each product minimum variant price, with variant-less products last', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products`)
        .query({
          categoryId: priceCategory.id,
          sortBy: ProductSortBy.PRICE_ASC,
          limit: 50,
        })
        .expect(200);

      expect(idsOf(response.body as { data: Array<{ id: string }> })).toEqual([
        pGlobalMin.id,
        pPrice10.id,
        pSimple.id,
        pPrice20.id,
        pNoVariant.id,
      ]);
    });

    it('sortBy PRICE_DESC orders by each product minimum variant price descending, with variant-less products still last', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products`)
        .query({
          categoryId: priceCategory.id,
          sortBy: ProductSortBy.PRICE_DESC,
          limit: 50,
        })
        .expect(200);

      expect(idsOf(response.body as { data: Array<{ id: string }> })).toEqual([
        pPrice20.id,
        pSimple.id,
        pPrice10.id,
        pGlobalMin.id,
        pNoVariant.id,
      ]);
    });

    it('combining minPrice/maxPrice with sortBy PRICE_ASC still sorts by each product global minimum variant price', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products`)
        .query({
          categoryId: priceCategory.id,
          minPrice: 10,
          maxPrice: 25,
          sortBy: ProductSortBy.PRICE_ASC,
          limit: 50,
        })
        .expect(200);

      // pGlobalMin only qualifies for the range via its 18 variant (its other variant, 5,
      // is outside 10-25) — but the sort key must still be its GLOBAL minimum (5), so it
      // sorts before pSimple (global min 12) even though pSimple's qualifying variant (12)
      // is lower than pGlobalMin's qualifying variant (18).
      expect(idsOf(response.body as { data: Array<{ id: string }> })).toEqual([
        pGlobalMin.id,
        pPrice10.id,
        pSimple.id,
        pPrice20.id,
      ]);
    });

    it.each([
      ['categoryId', 'not-a-uuid'],
      ['status', 'NOT_A_STATUS'],
      ['roastLevel', 'NOT_A_ROAST'],
      ['sortBy', 'NOT_A_SORT'],
      ['minPrice', '-5'],
    ])('responds 400 for an invalid %s query param', async (param, value) => {
      await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products`)
        .query({ [param]: value })
        .expect(400);
    });
  });

  describe('mutating routes without a Clerk session', () => {
    it.each([
      ['post', `${API_BASE_PATH}/products`],
      ['patch', `${API_BASE_PATH}/products/some-id`],
      ['delete', `${API_BASE_PATH}/products/some-id`],
    ])('%s %s responds 401', async (method, path) => {
      await (
        request(app.getHttpServer()) as unknown as Record<
          string,
          (path: string) => request.Test
        >
      )
        [method](path)
        .send({ name: 'Whatever' })
        .expect(401);
    });
  });

  describe('mutating routes with an authenticated non-ADMIN user', () => {
    it('POST /products responds 403', async () => {
      const user = await createTestUser(UserRole.USER);
      const category = await createTestCategory();
      mockSessionFor(user.clerkId);

      await request(app.getHttpServer())
        .post(`${API_BASE_PATH}/products`)
        .send({ categoryId: category.id, name: 'Non Admin Product' })
        .expect(403);
    });
  });

  describe('mutating routes with an authenticated ADMIN user', () => {
    it('POST /products responds 201, derives a slug, and creates the supplied images and variants', async () => {
      const admin = await createTestUser(UserRole.ADMIN);
      const category = await createTestCategory();
      mockSessionFor(admin.clerkId);
      const name = uniqueName('Guatemala Antigua E2E');
      const sku = uniqueName('SKU-E2E');

      const response = await request(app.getHttpServer())
        .post(`${API_BASE_PATH}/products`)
        .send({
          categoryId: category.id,
          name,
          ...requiredProductFields(),
          images: [
            { url: 'https://example.com/coffee.jpg', isPrimary: true },
            { url: 'https://example.com/coffee-2.jpg' },
          ],
          variants: [
            {
              sku,
              weight: 250,
              unit: ProductUnit.G,
              price: 12.5,
            },
          ],
        })
        .expect(201);

      const body = response.body as { data: { id: string } };
      createdProductIds.push(body.data.id);
      expect(body.data).toMatchObject({
        categoryId: category.id,
        name,
        slug: slugFrom(name),
      });

      const [images, variants] = await RequestContext.create(orm.em, () =>
        Promise.all([
          productImageService.findAllByProduct(body.data.id),
          productVariantService.findAllByProduct(body.data.id),
        ]),
      );
      expect(images).toHaveLength(2);
      expect(images[0]).toMatchObject({
        url: 'https://example.com/coffee.jpg',
      });
      expect(variants).toHaveLength(1);
      expect(variants[0]).toMatchObject({ sku, name: '250G' });
    });

    it('POST /products responds 201 for a description over 255 characters', async () => {
      const admin = await createTestUser(UserRole.ADMIN);
      const category = await createTestCategory();
      mockSessionFor(admin.clerkId);
      const name = uniqueName('Long Description E2E');
      const description = 'a'.repeat(300);

      const response = await request(app.getHttpServer())
        .post(`${API_BASE_PATH}/products`)
        .send({
          categoryId: category.id,
          name,
          ...requiredProductFields(),
          description,
          images: validImages(),
          variants: [validVariant('SKU-DESC')],
        })
        .expect(201);

      const body = response.body as {
        data: { id: string; description: string };
      };
      createdProductIds.push(body.data.id);
      expect(body.data.description).toBe(description);
    });

    it('POST /products responds 409 for a duplicate name', async () => {
      const admin = await createTestUser(UserRole.ADMIN);
      const category = await createTestCategory();
      mockSessionFor(admin.clerkId);
      const name = uniqueName('Duplicate Product E2E');

      const product = await RequestContext.create(orm.em, () =>
        productService.create({
          categoryId: category.id,
          name,
          ...requiredProductFields(),
          images: [],
          variants: [],
        }),
      );
      createdProductIds.push(product.id);

      const response = await request(app.getHttpServer())
        .post(`${API_BASE_PATH}/products`)
        .send({
          categoryId: category.id,
          name,
          ...requiredProductFields(),
          images: validImages(),
          variants: [validVariant('SKU-DUP')],
        })
        .expect(409);

      const body = response.body as {
        errors: Array<{ errCode: string }>;
      };
      expect(body.errors[0].errCode).toBe(ERROR_CODES.PRODUCT.NAME_EXISTS);
    });

    it('POST /products responds 400 for two primary images', async () => {
      const admin = await createTestUser(UserRole.ADMIN);
      const category = await createTestCategory();
      mockSessionFor(admin.clerkId);

      await request(app.getHttpServer())
        .post(`${API_BASE_PATH}/products`)
        .send({
          categoryId: category.id,
          name: uniqueName('Two Primary Images E2E'),
          ...requiredProductFields(),
          images: [
            { url: 'https://example.com/a.jpg', isPrimary: true },
            { url: 'https://example.com/b.jpg', isPrimary: true },
          ],
        })
        .expect(400);
    });

    it('rolls back the whole product when a later variant fails, leaving nothing persisted', async () => {
      const admin = await createTestUser(UserRole.ADMIN);
      const category = await createTestCategory();
      mockSessionFor(admin.clerkId);
      const existingSku = uniqueName('SKU-EXISTING');
      const existing = await RequestContext.create(orm.em, () =>
        productService.create({
          categoryId: category.id,
          name: uniqueName('Existing Product E2E'),
          ...requiredProductFields(),
          images: [],
          variants: [
            {
              sku: existingSku,
              weight: '250',
              unit: ProductUnit.G,
              price: '10',
            },
          ],
        }),
      );
      createdProductIds.push(existing.id);

      const name = uniqueName('Rolled Back Product E2E');
      await request(app.getHttpServer())
        .post(`${API_BASE_PATH}/products`)
        .send({
          categoryId: category.id,
          name,
          ...requiredProductFields(),
          images: validImages(),
          variants: [
            {
              sku: uniqueName('SKU-NEW'),
              weight: 100,
              unit: ProductUnit.G,
              price: 5,
            },
            // Duplicates the pre-existing SKU above — fails after the first
            // variant (and the product row) were already written in this
            // same request, which must roll back atomically.
            { sku: existingSku, weight: 100, unit: ProductUnit.G, price: 5 },
          ],
        })
        .expect(409);

      const response = await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products`)
        .query({ search: name })
        .expect(200);

      const body = response.body as { meta: { totalCount: number } };
      expect(body.meta.totalCount).toBe(0);
    });

    it('POST /products responds 400 when a variant price exceeds the column precision', async () => {
      const admin = await createTestUser(UserRole.ADMIN);
      const category = await createTestCategory();
      mockSessionFor(admin.clerkId);

      await request(app.getHttpServer())
        .post(`${API_BASE_PATH}/products`)
        .send({
          categoryId: category.id,
          name: uniqueName('Out Of Range Price E2E'),
          ...requiredProductFields(),
          images: validImages(),
          variants: [
            {
              sku: uniqueName('SKU-OOR'),
              weight: 1,
              unit: ProductUnit.G,
              price: 999999999,
            },
          ],
        })
        .expect(400);
    });

    it('POST /products responds 400 for a PERCENT discount of 100 or more', async () => {
      const admin = await createTestUser(UserRole.ADMIN);
      const category = await createTestCategory();
      mockSessionFor(admin.clerkId);

      await request(app.getHttpServer())
        .post(`${API_BASE_PATH}/products`)
        .send({
          categoryId: category.id,
          name: uniqueName('Percent Discount E2E'),
          ...requiredProductFields(),
          images: validImages(),
          variants: [
            {
              sku: uniqueName('SKU-PCT'),
              weight: 1,
              unit: ProductUnit.G,
              price: 10,
              discountType: DiscountType.PERCENT,
              discountValue: 100,
            },
          ],
        })
        .expect(400);
    });

    it('POST /products responds 201 for a FIXED discount above 100', async () => {
      const admin = await createTestUser(UserRole.ADMIN);
      const category = await createTestCategory();
      mockSessionFor(admin.clerkId);

      const response = await request(app.getHttpServer())
        .post(`${API_BASE_PATH}/products`)
        .send({
          categoryId: category.id,
          name: uniqueName('Fixed Discount E2E'),
          ...requiredProductFields(),
          images: validImages(),
          variants: [
            {
              sku: uniqueName('SKU-FIX'),
              weight: 1,
              unit: ProductUnit.G,
              price: 500,
              discountType: DiscountType.FIXED,
              discountValue: 500,
            },
          ],
        })
        .expect(201);

      const body = response.body as { data: { id: string } };
      createdProductIds.push(body.data.id);
    });

    it('POST /products responds 400 when an image sortOrder exceeds the max bound', async () => {
      const admin = await createTestUser(UserRole.ADMIN);
      const category = await createTestCategory();
      mockSessionFor(admin.clerkId);

      await request(app.getHttpServer())
        .post(`${API_BASE_PATH}/products`)
        .send({
          categoryId: category.id,
          name: uniqueName('Huge Sort Order E2E'),
          ...requiredProductFields(),
          images: [
            {
              url: 'https://example.com/a.jpg',
              sortOrder: 1000000,
              isPrimary: true,
            },
            { url: 'https://example.com/b.jpg' },
          ],
          variants: [validVariant('SKU-SORT')],
        })
        .expect(400);
    });

    it('POST /products responds 201 for an image url over 255 characters', async () => {
      const admin = await createTestUser(UserRole.ADMIN);
      const category = await createTestCategory();
      mockSessionFor(admin.clerkId);
      const longUrl = `https://example.com/${'a'.repeat(280)}.jpg`;

      const response = await request(app.getHttpServer())
        .post(`${API_BASE_PATH}/products`)
        .send({
          categoryId: category.id,
          name: uniqueName('Long Image Url E2E'),
          ...requiredProductFields(),
          images: [
            { url: longUrl, isPrimary: true },
            { url: 'https://example.com/short.jpg' },
          ],
          variants: [validVariant('SKU-URL')],
        })
        .expect(201);

      const body = response.body as { data: { id: string } };
      createdProductIds.push(body.data.id);

      const images = await RequestContext.create(orm.em, () =>
        productImageService.findAllByProduct(body.data.id),
      );
      expect(images[0]).toMatchObject({ url: longUrl });
    });

    it('POST /products responds 404 for a nonexistent category', async () => {
      const admin = await createTestUser(UserRole.ADMIN);
      mockSessionFor(admin.clerkId);

      await request(app.getHttpServer())
        .post(`${API_BASE_PATH}/products`)
        .send({
          categoryId: '00000000-0000-0000-0000-000000000000',
          name: uniqueName('No Category Product E2E'),
          ...requiredProductFields(),
          images: validImages(),
          variants: [validVariant('SKU-CAT')],
        })
        .expect(404);
    });

    it('POST /products responds 400 with field-level errors for an invalid body', async () => {
      const admin = await createTestUser(UserRole.ADMIN);
      mockSessionFor(admin.clerkId);

      const response = await request(app.getHttpServer())
        .post(`${API_BASE_PATH}/products`)
        .send({
          categoryId: 'not-a-uuid',
          name: 'x',
          ...requiredProductFields(),
          images: validImages(),
          variants: [{ sku: 'A', weight: 0, unit: 'KG', price: 1 }],
        })
        .expect(400);

      const body = response.body as {
        statusCode: number;
        errors: Array<{ errCode: string; field: string }>;
      };
      expect(body.statusCode).toBe(400);
      expect(body.errors.map(({ errCode, field }) => [errCode, field])).toEqual(
        [
          ['isUuid', 'categoryId'],
          ['minLength', 'name'],
          ['min', 'variants.0.weight'],
        ],
      );
    });

    it('PATCH /products/:id responds 200 and updates the product', async () => {
      const admin = await createTestUser(UserRole.ADMIN);
      const category = await createTestCategory();
      mockSessionFor(admin.clerkId);
      const product = await RequestContext.create(orm.em, () =>
        productService.create({
          categoryId: category.id,
          name: uniqueName('Kenya AA E2E'),
          ...requiredProductFields(),
          images: [],
          variants: [],
        }),
      );
      createdProductIds.push(product.id);
      const newName = uniqueName('Kenya AA Renamed E2E');

      const response = await request(app.getHttpServer())
        .patch(`${API_BASE_PATH}/products/${product.id}`)
        .send({ name: newName })
        .expect(200);

      const body = response.body as { data: unknown };
      expect(body.data).toMatchObject({
        name: newName,
        slug: slugFrom(newName),
      });
    });

    it('DELETE /products/:id responds 204 and soft-deletes the product', async () => {
      const admin = await createTestUser(UserRole.ADMIN);
      const category = await createTestCategory();
      mockSessionFor(admin.clerkId);
      const product = await RequestContext.create(orm.em, () =>
        productService.create({
          categoryId: category.id,
          name: uniqueName('Sumatra Mandheling E2E'),
          ...requiredProductFields(),
          images: [],
          variants: [],
        }),
      );
      createdProductIds.push(product.id);

      await request(app.getHttpServer())
        .delete(`${API_BASE_PATH}/products/${product.id}`)
        .expect(204);

      mockSessionFor(null);
      await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products/${product.id}`)
        .expect(404);
    });

    it('GET /products includes soft-deleted rows for an ADMIN caller', async () => {
      const admin = await createTestUser(UserRole.ADMIN);
      const category = await createTestCategory();
      const product = await RequestContext.create(orm.em, () =>
        productService.create({
          categoryId: category.id,
          name: uniqueName('Deleted Visible Product E2E'),
          ...requiredProductFields(),
          images: [],
          variants: [],
        }),
      );
      createdProductIds.push(product.id);
      await RequestContext.create(orm.em, () =>
        productService.remove(product.id),
      );
      mockSessionFor(admin.clerkId);

      const response = await request(app.getHttpServer())
        .get(
          `${API_BASE_PATH}/products?search=${encodeURIComponent(product.name)}`,
        )
        .expect(200);

      const body = response.body as { data: Array<{ id: string }> };
      const ids = body.data.map((p) => p.id);
      expect(ids).toContain(product.id);
    });

    it('GET /products/:id returns a soft-deleted product for an ADMIN caller', async () => {
      const admin = await createTestUser(UserRole.ADMIN);
      const category = await createTestCategory();
      const product = await RequestContext.create(orm.em, () =>
        productService.create({
          categoryId: category.id,
          name: uniqueName('Deleted By Id Product E2E'),
          ...requiredProductFields(),
          images: [],
          variants: [],
        }),
      );
      createdProductIds.push(product.id);
      await RequestContext.create(orm.em, () =>
        productService.remove(product.id),
      );
      mockSessionFor(admin.clerkId);

      const response = await request(app.getHttpServer())
        .get(`${API_BASE_PATH}/products/${product.id}`)
        .expect(200);

      const body = response.body as { data: { id: string } };
      expect(body.data.id).toBe(product.id);
    });
  });
});
