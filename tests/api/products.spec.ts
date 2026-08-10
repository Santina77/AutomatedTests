import { test, expect } from '@playwright/test';

const RECORDS_PATH = '/api/products';

function uniqueName(label: string) {
  return `${label} ${test.info().workerIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

test.describe('GET /api/products', () => {
  test('returns 200 with a products array', async ({ request }) => {
    const response = await request.get(RECORDS_PATH);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(Array.isArray(body.products)).toBe(true);
  });

  test('returns 404 for an unknown id', async ({ request }) => {
    const response = await request.get(`${RECORDS_PATH}/does-not-exist`);
    expect(response.status()).toBe(404);
  });
});

test.describe('POST /api/products', () => {
  test('creates a product and returns it', async ({ request }) => {
    const payload = {
      name: uniqueName('Bird Food'),
      price: 47.95,
      category: 'Lawn & Garden',
      in_stock: true,
    };

    const response = await request.post(RECORDS_PATH, { data: payload });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.product).toMatchObject(payload);
    expect(body.product.id).toBeTruthy();
    expect(body.product.created_at).toBeTruthy();

    // Clean up so the in-memory store doesn't accumulate test data.
    const deleteResponse = await request.delete(`${RECORDS_PATH}/${body.product.id}`);
    expect(deleteResponse.status()).toBe(204);
  });

  test('rejects a payload missing name with 400', async ({ request }) => {
    const response = await request.post(RECORDS_PATH, {
      data: { price: 9.99, category: 'Test', in_stock: true },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('name is required');
  });

  test('rejects a non-positive price with 400', async ({ request }) => {
    const response = await request.post(RECORDS_PATH, {
      data: { name: uniqueName('Invalid Price'), price: -5, category: 'Test', in_stock: true },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('price must be a positive number');
  });
});

test.describe('DELETE /api/products/:id', () => {
  test('returns 404 when deleting an unknown id', async ({ request }) => {
    const response = await request.delete(`${RECORDS_PATH}/does-not-exist`);
    expect(response.status()).toBe(404);
  });
});
