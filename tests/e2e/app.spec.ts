import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('captures, persists, reviews, promotes, and restores a thought', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Park it/);
  await page.getByLabel('What pulled your attention?').fill('Look up the library opening hours');
  await page.getByRole('button', { name: /Park thought/ }).click();
  await expect(page.getByText('Thought parked.')).toBeVisible();
  await expect(page.getByText('1', { exact: true }).first()).toBeVisible();

  await page.reload();
  await page.getByRole('link', { name: /Review/ }).click();
  await page.getByRole('button', { name: /Start this review/ }).click();
  await expect(page.getByText('Look up the library opening hours')).toBeVisible();
  await page.getByRole('button', { name: /Promote/ }).click();
  await expect(page.getByRole('heading', { name: 'The lot is clear.' })).toBeVisible();
  await page.getByText('Recently handled').click();
  await expect(page.getByText('promoted', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Put back' }).click();
  await expect(page.getByText('Look up the library opening hours')).toBeVisible();
  expect(errors).toEqual([]);
});

test('records a local voice clip with clear recorder state', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Record voice' }).click();
  await expect(page.getByText(/Recording 0:/)).toBeVisible();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Stop recording' }).click();
  await expect(page.getByText(/Voice clip ready/)).toBeVisible();
  await page.getByRole('button', { name: /Park thought/ }).click();
  await page.getByRole('link', { name: /Review/ }).click();
  await page.getByRole('button', { name: /Start this review/ }).click();
  await expect(page.getByText('Voice note')).toBeVisible();
  await expect(page.locator('audio')).toHaveCount(1);
});

test('supports the global capture hotkey, direct legal routes, and 390px layout', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy stays parked.');
  await page.keyboard.press('Control+Shift+Space');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByLabel('What pulled your attention?')).toBeFocused();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('has no serious accessibility violations on primary screens', async ({ page }) => {
  for (const path of ['/', '/review/', '/settings/', '/privacy/', '/terms/']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
  }
});

test('restores a supporter license through the Sociobot contract', async ({ page }) => {
  await page.route('**/api/v1/products/thought-parking/verify**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }),
  }));
  await page.goto('/?license=test-license-token');
  await page.getByRole('link', { name: 'My data' }).click();
  await expect(page.getByText('Supporter tape unlocked')).toBeVisible();
  await expect(page).not.toHaveURL(/license=/);
  await page.getByLabel('Your return-to-work cue').fill('Back to the page I was reading.');
  await page.getByRole('button', { name: 'Save cue' }).click();
  await expect(page.getByText('Return cue saved.')).toBeVisible();
});

test('loads the app and existing data while offline', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for the service-worker offline path.');
  await page.goto('/');
  await page.getByLabel('What pulled your attention?').fill('Offline thought');
  await page.getByRole('button', { name: /Park thought/ }).click();
  await page.waitForFunction(() => navigator.serviceWorker?.controller);
  await context.setOffline(true);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Offline · still saving')).toBeVisible();
  await page.getByRole('link', { name: /Review/ }).click();
  await page.getByRole('button', { name: /Start this review/ }).click();
  await expect(page.getByText('Offline thought')).toBeVisible();
  await context.setOffline(false);
});
