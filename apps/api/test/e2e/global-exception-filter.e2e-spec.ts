import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../../src/app.module.js';
import { CategoryService } from './../../src/modules/category/services/category.service.js';
import { API_BASE_PATH } from './../utils/api-path.util.js';
import { initTestApp } from './../utils/init-test-app.util.js';

describe('GlobalExceptionFilter (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CategoryService)
      .useValue({
        findAll: () => {
          throw new Error('unexpected database failure');
        },
      })
      .compile();

    app = await initTestApp(moduleFixture);
    // The filter logs the thrown error on purpose; keep it out of the test output.
    app.useLogger(false);
  });

  afterAll(async () => {
    await app.close();
  });

  it('responds 500 with the consistent error envelope when a route throws a non-HttpException error', async () => {
    const response = await request(app.getHttpServer())
      .get(`${API_BASE_PATH}/categories`)
      .expect(500);

    const body = response.body as {
      statusCode: number;
      message: string;
      errors: unknown[];
    };
    expect(body.statusCode).toBe(500);
    expect(typeof body.message).toBe('string');
    expect(body.errors.length).toBeGreaterThan(0);
    expect(JSON.stringify(response.body)).not.toContain(
      'unexpected database failure',
    );
  });
});
