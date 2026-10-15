// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');

const credentials = {
  username: process.env.SAUCEDEMO_USERNAME || 'standard_user',
  password: process.env.SAUCEDEMO_PASSWORD || 'secret_sauce',
};
const productName = 'Sauce Labs Backpack';

function parseCurrencyCents(text) {
  const match = text.match(/\$([\d,]+\.\d{2})/);
  expect(match, `Expected a currency amount in "${text}"`).not.toBeNull();
  return Math.round(Number(match[1].replaceAll(',', '')) * 100);
}

test('standard user completes an order for one Sauce Labs Backpack', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByPlaceholder('Username')).toBeVisible();
  await expect(page.getByPlaceholder('Password')).toBeVisible();
  await page.getByPlaceholder('Username').fill(credentials.username);
  await page.getByPlaceholder('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL(/inventory\.html$/);
  await expect(page.getByText('Products', { exact: true })).toBeVisible();

  const inventoryItems = page.getByTestId('inventory-item');
  await expect(inventoryItems.last()).toBeVisible();
  expect(await inventoryItems.count()).toBeGreaterThan(0);

  const productCard = inventoryItems.filter({
    has: page.getByText(productName, { exact: true }),
  });
  await expect(productCard).toBeVisible();
  const productPriceCents = parseCurrencyCents(
    await productCard.getByTestId('inventory-item-price').innerText(),
  );

  await productCard.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.getByTestId('shopping-cart-badge')).toHaveText('1');
  await page.getByTestId('shopping-cart-link').click();

  await expect(page).toHaveURL(/cart\.html$/);
  const cartItems = page.locator('.cart_item');
  await expect(cartItems).toHaveCount(1);
  const cartItem = cartItems.first();
  await expect(cartItem.getByTestId('inventory-item-name')).toHaveText(productName);
  await expect(cartItem.locator('.cart_quantity')).toHaveText('1');

  await page.getByRole('button', { name: 'Checkout' }).click();
  await expect(page.getByText('Checkout: Your Information', { exact: true })).toBeVisible();
  await page.getByPlaceholder('First Name').fill('Test');
  await page.getByPlaceholder('Last Name').fill('User');
  await page.getByPlaceholder('Zip/Postal Code').fill('12345');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(/checkout-step-two\.html$/);
  await expect(page.getByText('Checkout: Overview', { exact: true })).toBeVisible();
  await expect(page.getByTestId('inventory-item-name')).toHaveText(productName);
  await expect(page.locator('.cart_quantity')).toHaveText('1');

  const subtotalCents = parseCurrencyCents(
    await page.getByTestId('subtotal-label').innerText(),
  );
  const taxCents = parseCurrencyCents(await page.getByTestId('tax-label').innerText());
  const totalCents = parseCurrencyCents(await page.getByTestId('total-label').innerText());

  expect(subtotalCents).toBe(productPriceCents);
  expect(taxCents).toBeGreaterThan(0);
  expect(totalCents).toBe(subtotalCents + taxCents);

  await page.getByRole('button', { name: 'Finish' }).click();

  await expect(page).toHaveURL(/checkout-complete\.html$/);
  await expect(page.getByRole('heading', { name: 'Thank you for your order!' })).toBeVisible();
  await expect(page.getByTestId('complete-text')).toContainText('Your order has been dispatched');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Generate PDF order' }).click(),
  ]);
  const pdfFilename = download.suggestedFilename();
  expect(pdfFilename).toMatch(/^swag-labs-order-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.pdf$/i);

  const pdfPath = testInfo.outputPath(pdfFilename);
  await download.saveAs(pdfPath);
  const pdfContents = await fs.readFile(pdfPath);
  expect(pdfContents.subarray(0, 5).toString()).toBe('%PDF-');
  await testInfo.attach(pdfFilename, {
    path: pdfPath,
    contentType: 'application/pdf',
  });

  await page.getByRole('button', { name: 'Back Home' }).click();
});