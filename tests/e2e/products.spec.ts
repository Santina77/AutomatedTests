import { test, expect } from '@playwright/test';

function uniqueName(label: string) {
  return `${label} ${test.info().workerIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

test.describe('Product manager UI', () => {
  test('adds a product and shows it in the table', async ({ page }) => {
    await page.goto('/');

    const name = uniqueName('Bird Food');
    await page.getByTestId('name-input').fill(name);
    await page.getByTestId('price-input').fill('47.95');
    await page.getByTestId('category-input').fill('Lawn & Garden');
    await page.getByTestId('add-product-button').click();

    const row = page.getByTestId('product-row').filter({ hasText: name });
    await expect(row).toBeVisible();
    await expect(row.getByTestId('product-price')).toHaveText('47.95');
    await expect(row.getByTestId('product-category')).toHaveText('Lawn & Garden');
    await expect(row.getByTestId('product-in-stock')).toHaveText('Yes');

    // Clean up so the shared in-memory store doesn't accumulate test data.
    await row.getByTestId('delete-button').click();
    await expect(row).toBeHidden();
  });

  test('shows a validation error when name is missing', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('price-input').fill('9.99');
    await page.getByTestId('category-input').fill('Test');
    await page.getByTestId('add-product-button').click();

    await expect(page.getByTestId('form-error')).toContainText('name is required');
  });

  test('deletes a product from the table', async ({ page }) => {
    await page.goto('/');

    const name = uniqueName('Temporary Item');
    await page.getByTestId('name-input').fill(name);
    await page.getByTestId('price-input').fill('5');
    await page.getByTestId('category-input').fill('Test');
    await page.getByTestId('add-product-button').click();

    const row = page.getByTestId('product-row').filter({ hasText: name });
    await expect(row).toBeVisible();

    await row.getByTestId('delete-button').click();
    await expect(row).toBeHidden();
  });
});
