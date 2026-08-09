import { test, expect } from '@playwright/test';

const PROJECT_ID = process.env.PROJECT_ID;

test.describe('Products records', () => {
  test('GET /api/collections/products/records returns 200 with JSON body', async ({ request }) => {
    const response = await request.get('/api/collections/products/records', {
      params: { project_id: PROJECT_ID ?? '' },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body).toBeTruthy();
    // TODO: replace with real assertions once the response schema is confirmed,
    // e.g. expect(Array.isArray(body.records)).toBe(true);
  });

  test('GET /api/collections/products/records rejects an invalid API key', async ({ request }) => {
    const response = await request.get('/api/collections/products/records', {
      params: { project_id: PROJECT_ID ?? '' },
      headers: { 'X-API-Key': 'invalid-key' },
    });

    expect([401, 403]).toContain(response.status());
  });
});
