import { test, expect } from '@playwright/test';

const RECORDS_PATH = '/api/products';

function uniqueName(label: string) {
  return `${label} ${test.info().workerIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Categories must be a single word (no spaces/punctuation), so unique test values can't use uniqueName().
function uniqueWord(label: string) {
  return `${label}${test.info().workerIndex}${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
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
      category: 'LawnGarden',
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

  test('rejects a payload missing name with 400 and does not create a record', async ({ request }) => {
    const category = uniqueWord('NoName');

    const response = await request.post(RECORDS_PATH, {
      data: { price: 9.99, category, in_stock: true },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('name is required');
    expect(body.product).toBeUndefined();

    const listResponse = await request.get(RECORDS_PATH);
    const listBody = await listResponse.json();
    expect(listBody.products.some((p: { category: string }) => p.category === category)).toBe(false);
  });

  test('rejects a non-positive price with 400', async ({ request }) => {
    const response = await request.post(RECORDS_PATH, {
      data: { name: uniqueName('Invalid Price'), price: -5, category: 'Test', in_stock: true },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('price must be a positive number');
  });

  test('rejects a category with spaces or punctuation with 400 and does not create a record', async ({
    request,
  }) => {
    const name = uniqueName('Bad Category');

    const response = await request.post(RECORDS_PATH, {
      data: { name, price: 9.99, category: 'Lawn & Garden', in_stock: true },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('category must be a single word');
    expect(body.product).toBeUndefined();

    const listResponse = await request.get(RECORDS_PATH);
    const listBody = await listResponse.json();
    expect(listBody.products.some((p: { name: string }) => p.name === name)).toBe(false);
  });
});

test.describe('PUT /api/products/:id', () => {
  test('updates a record with new information', async ({ request }) => {
    const createResponse = await request.post(RECORDS_PATH, {
      data: { name: uniqueName('Original'), price: 10, category: 'Original', in_stock: true },
    });
    const { product } = await createResponse.json();

    const updatedPayload = {
      name: uniqueName('Updated'),
      price: 25.5,
      category: 'Updated',
      in_stock: false,
    };
    const response = await request.put(`${RECORDS_PATH}/${product.id}`, { data: updatedPayload });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.product).toMatchObject({ id: product.id, ...updatedPayload });

    const getResponse = await request.get(`${RECORDS_PATH}/${product.id}`);
    const getBody = await getResponse.json();
    expect(getBody.product).toMatchObject(updatedPayload);

    // Clean up so the in-memory store doesn't accumulate test data.
    await request.delete(`${RECORDS_PATH}/${product.id}`);
  });

  test('returns 404 when updating an unknown id', async ({ request }) => {
    const response = await request.put(`${RECORDS_PATH}/does-not-exist`, {
      data: { name: uniqueName('Ghost'), price: 5, category: 'Test', in_stock: true },
    });
    expect(response.status()).toBe(404);
  });

  test('rejects an update missing name with 400 and leaves the record unchanged', async ({ request }) => {
    const original = { name: uniqueName('Untouched'), price: 10, category: 'Original', in_stock: true };
    const createResponse = await request.post(RECORDS_PATH, { data: original });
    const { product } = await createResponse.json();

    const response = await request.put(`${RECORDS_PATH}/${product.id}`, {
      data: { price: 99, category: 'Changed', in_stock: false },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('name is required');

    const getResponse = await request.get(`${RECORDS_PATH}/${product.id}`);
    const getBody = await getResponse.json();
    expect(getBody.product).toMatchObject(original);

    // Clean up so the in-memory store doesn't accumulate test data.
    await request.delete(`${RECORDS_PATH}/${product.id}`);
  });
});

test.describe('DELETE /api/products/:id', () => {
  test('returns 404 when deleting an unknown id', async ({ request }) => {
    const response = await request.delete(`${RECORDS_PATH}/does-not-exist`);
    expect(response.status()).toBe(404);
  });
});
