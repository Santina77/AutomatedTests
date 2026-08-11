import { test, expect } from '@playwright/test';

function uniqueName(label: string) {
  return `${label} ${test.info().workerIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Categories must be a single word (no spaces/punctuation), so unique test values can't use uniqueName().
function uniqueWord(label: string) {
  return `${label}${test.info().workerIndex}${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
}

test.describe('Product manager UI', () => {
  test('adds a product and shows it in the table', async ({ page }) => {
    await page.goto('/');

    const name = uniqueName('Bird Food');
    await page.getByTestId('name-input').fill(name);
    await page.getByTestId('price-input').fill('47.95');
    await page.getByTestId('category-input').fill('LawnGarden');
    await page.getByTestId('add-product-button').click();

    const row = page.getByTestId('product-row').filter({ hasText: name });
    await expect(row).toBeVisible();
    await expect(row.getByTestId('product-price')).toHaveText('47.95');
    await expect(row.getByTestId('product-category')).toHaveText('LawnGarden');
    await expect(row.getByTestId('product-in-stock')).toHaveText('Yes');

    // Clean up so the shared in-memory store doesn't accumulate test data.
    await row.getByTestId('delete-button').click();
    await expect(row).toBeHidden();
  });

  test('shows a validation error and does not add a row when name is missing', async ({ page }) => {
    await page.goto('/');

    const category = uniqueWord('NoName');
    await page.getByTestId('price-input').fill('9.99');
    await page.getByTestId('category-input').fill(category);
    await page.getByTestId('add-product-button').click();

    await expect(page.getByTestId('form-error')).toContainText('name is required');
    await expect(page.getByTestId('product-row').filter({ hasText: category })).toHaveCount(0);
  });

  test('shows a validation error and does not add a row when category has spaces or punctuation', async ({
    page,
  }) => {
    await page.goto('/');

    const name = uniqueName('Bad Category');
    await page.getByTestId('name-input').fill(name);
    await page.getByTestId('price-input').fill('9.99');
    await page.getByTestId('category-input').fill('Lawn & Garden');
    await page.getByTestId('add-product-button').click();

    await expect(page.getByTestId('form-error')).toContainText('category must be a single word');
    await expect(page.getByTestId('product-row').filter({ hasText: name })).toHaveCount(0);
  });

  test('cancel clears the form without creating a record', async ({ page }) => {
    await page.goto('/');

    const name = uniqueName('Cancelled Product');
    await page.getByTestId('name-input').fill(name);
    await page.getByTestId('price-input').fill('12.34');
    await page.getByTestId('category-input').fill('Test');
    await page.getByTestId('in-stock-input').uncheck();

    await page.getByTestId('cancel-button').click();

    await expect(page.getByTestId('name-input')).toHaveValue('');
    await expect(page.getByTestId('price-input')).toHaveValue('');
    await expect(page.getByTestId('category-input')).toHaveValue('');
    await expect(page.getByTestId('in-stock-input')).toBeChecked();

    await expect(page.getByTestId('product-row').filter({ hasText: name })).toHaveCount(0);
  });

  test('sorts the price column ascending and descending', async ({ page }) => {
    await page.goto('/');

    const prefix = uniqueName('SortTest');
    const items = [
      { suffix: 'A', price: '30.00' },
      { suffix: 'B', price: '10.00' },
      { suffix: 'C', price: '20.00' },
    ];

    for (const item of items) {
      await page.getByTestId('name-input').fill(`${prefix} ${item.suffix}`);
      await page.getByTestId('price-input').fill(item.price);
      await page.getByTestId('category-input').fill('Test');
      await page.getByTestId('add-product-button').click();
      await expect(page.getByTestId('product-row').filter({ hasText: `${prefix} ${item.suffix}` })).toBeVisible();
    }

    const rows = page.getByTestId('product-row').filter({ hasText: prefix });
    await expect(rows).toHaveCount(3);
    const prices = rows.locator('[data-testid="product-price"]');

    await page.getByTestId('price-header').click();
    await expect(page.getByTestId('price-header')).toHaveText('Price ▲');
    await expect(prices).toHaveText(['10.00', '20.00', '30.00']);

    await page.getByTestId('price-header').click();
    await expect(page.getByTestId('price-header')).toHaveText('Price ▼');
    await expect(prices).toHaveText(['30.00', '20.00', '10.00']);

    // Clean up so the shared in-memory store doesn't accumulate test data.
    while ((await rows.count()) > 0) {
      const remaining = await rows.count();
      await rows.first().getByTestId('delete-button').click();
      await expect(rows).toHaveCount(remaining - 1);
    }
  });

  test('edits a product and saves the new information', async ({ page }) => {
    await page.goto('/');

    const originalName = uniqueName('Original Item');
    await page.getByTestId('name-input').fill(originalName);
    await page.getByTestId('price-input').fill('10.00');
    await page.getByTestId('category-input').fill('Original');
    await page.getByTestId('in-stock-input').check();
    await page.getByTestId('add-product-button').click();

    const row = page.getByTestId('product-row').filter({ hasText: originalName });
    await expect(row).toBeVisible();

    await row.getByTestId('edit-button').click();
    await expect(page.getByTestId('name-input')).toHaveValue(originalName);
    await expect(page.getByTestId('price-input')).toHaveValue('10');
    await expect(page.getByTestId('category-input')).toHaveValue('Original');
    await expect(page.getByTestId('add-product-button')).toHaveText('Save Changes');

    const updatedName = uniqueName('Updated Item');
    await page.getByTestId('name-input').fill(updatedName);
    await page.getByTestId('price-input').fill('25.50');
    await page.getByTestId('category-input').fill('Updated');
    await page.getByTestId('in-stock-input').uncheck();
    await page.getByTestId('add-product-button').click();

    await expect(page.getByTestId('add-product-button')).toHaveText('Add Product');
    await expect(page.getByTestId('product-row').filter({ hasText: originalName })).toHaveCount(0);

    const updatedRow = page.getByTestId('product-row').filter({ hasText: updatedName });
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow.getByTestId('product-price')).toHaveText('25.50');
    await expect(updatedRow.getByTestId('product-category')).toHaveText('Updated');
    await expect(updatedRow.getByTestId('product-in-stock')).toHaveText('No');

    // Clean up so the shared in-memory store doesn't accumulate test data.
    await updatedRow.getByTestId('delete-button').click();
    await expect(updatedRow).toBeHidden();
  });

  test('cancel while editing discards changes and leaves the record unchanged', async ({ page }) => {
    await page.goto('/');

    const name = uniqueName('Unedited Item');
    await page.getByTestId('name-input').fill(name);
    await page.getByTestId('price-input').fill('10.00');
    await page.getByTestId('category-input').fill('Original');
    await page.getByTestId('add-product-button').click();

    const row = page.getByTestId('product-row').filter({ hasText: name });
    await row.getByTestId('edit-button').click();

    await page.getByTestId('price-input').fill('999.99');
    await page.getByTestId('category-input').fill('Changed');
    await page.getByTestId('cancel-button').click();

    await expect(page.getByTestId('add-product-button')).toHaveText('Add Product');
    await expect(page.getByTestId('name-input')).toHaveValue('');

    await expect(row.getByTestId('product-price')).toHaveText('10.00');
    await expect(row.getByTestId('product-category')).toHaveText('Original');

    // Clean up so the shared in-memory store doesn't accumulate test data.
    await row.getByTestId('delete-button').click();
    await expect(row).toBeHidden();
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
