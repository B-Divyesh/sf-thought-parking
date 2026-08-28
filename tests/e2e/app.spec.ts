import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('captures, persists, reviews, promotes, and restores a thought', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Catch a thought/);
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

test('@claim:voice-capture records a local voice clip with clear recorder state in demo', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Record voice' }).click();
  await expect(page.getByText(/Recording 0:/)).toBeVisible();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Stop recording' }).click();
  await expect(page.getByText(/Voice clip ready/)).toBeVisible();
  await page.getByRole('button', { name: /Park thought/ }).click();
  await page.getByRole('link', { name: /Review/ }).click();
  await page.getByRole('button', { name: /Start this review/ }).click();
  await page.getByRole('button', { name: 'Archive' }).click();
  await page.getByRole('button', { name: 'Archive' }).click();
  await expect(page.getByText('Voice note')).toBeVisible();
  await expect(page.locator('audio')).toHaveCount(1);
});

test('@claim:global-hotkey supports the global capture hotkey, direct legal routes, and 390px layout', async ({ page }) => {
  await page.goto('/demo/');
  await page.getByRole('link', { name: 'Privacy' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy stays parked.');
  await page.keyboard.press('Control+Shift+Space');
  await expect(page).toHaveURL(/\/?\?demo=1$/);
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

test('@claim:supporter-license shows the one-time price and restores a valid supporter license after leaving demo', async ({ page }) => {
  await page.route('**/api/v1/products/thought-parking/verify**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }),
  }));
  await page.goto('/demo/');
  await page.getByRole('button', { name: 'Start for real' }).click();
  await page.getByRole('link', { name: 'My data' }).click();
  await expect(page.getByRole('link', { name: /Buy once · \$7/ })).toHaveAttribute(
    'href', 'https://api.sociobot.in/api/v1/products/thought-parking/checkout',
  );
  await page.goto('/?license=demo-return-license');
  await page.getByRole('link', { name: 'My data' }).click();
  await expect(page.getByText('Supporter tape unlocked')).toBeVisible();
  await expect(page.getByLabel('Your return-to-work cue')).toBeVisible();
  await expect(page.getByText('captures / 14 days')).toBeVisible();
});

test('keeps an unverified pasted license locked when verification is unavailable', async ({ page }) => {
  await page.route('**/api/v1/products/thought-parking/verify**', (route) => route.abort('failed'));
  await page.goto('/settings/');
  await expect(page.getByRole('link', { name: /Buy once/ })).toHaveAttribute(
    'href',
    'https://api.sociobot.in/api/v1/products/thought-parking/checkout',
  );
  await page.getByText('Have a license?').click();
  await page.getByLabel('Paste license token').fill('not-a-real-license');
  await page.getByRole('button', { name: 'Verify and restore' }).click();
  await expect(page.getByText(/Could not reach the license service/)).toBeVisible();
  await expect(page.getByText('Supporter tape unlocked')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('sb_license:thought-parking'))).toBeNull();
});

test('keeps a previously verified license unlocked during a verification outage', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sb_license:thought-parking', 'previously-verified-token');
    localStorage.setItem('sb_license_verdict:thought-parking', JSON.stringify({
      valid: true,
      reason: 'ok',
      checkedAt: Date.now() - 86_400_001,
    }));
  });
  await page.route('**/api/v1/products/thought-parking/verify**', (route) => route.abort('failed'));
  await page.goto('/settings/');
  await expect(page.getByText('Supporter tape unlocked')).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('sb_license:thought-parking'))).toBe('previously-verified-token');
});

test('locks supporter features when a verified license is revoked', async ({ page }) => {
  await page.route('**/api/v1/products/thought-parking/verify**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: false, reason: 'revoked', expires_at: null }),
  }));
  await page.goto('/?license=revoked-license-token');
  await page.getByRole('link', { name: 'My data' }).click();
  await expect(page.getByText(/no longer active \(revoked\)/)).toBeVisible();
  await expect(page.getByText('Supporter tape unlocked')).toHaveCount(0);
});

test('keeps a rate-limited license restore locked and explains recovery', async ({ page }) => {
  await page.route('**/api/v1/products/thought-parking/verify**', (route) => route.fulfill({
    status: 429,
    headers: { 'Retry-After': '60' },
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Too many requests' }),
  }));
  await page.goto('/settings/');
  await page.getByText('Have a license?').click();
  await page.getByLabel('Paste license token').fill('rate-limited-token');
  await page.getByRole('button', { name: 'Verify and restore' }).click();
  await expect(page.getByText(/Could not reach the license service/)).toBeVisible();
  await expect(page.getByText('Supporter tape unlocked')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('sb_license:thought-parking'))).toBeNull();
});

test('meets the 44px touch-target baseline on every route at 390px', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'Touch-target geometry is specific to the 390px project.');
  for (const path of ['/', '/review/', '/settings/', '/privacy/', '/terms/']) {
    await page.goto(path);
    const undersized = await page.locator('a:visible, button:visible, summary:visible, input:visible:not(.visually-hidden), textarea:visible, label.file-button:visible').evaluateAll((elements) => elements
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { label: element.getAttribute('aria-label') || element.textContent?.trim() || element.tagName, width: rect.width, height: rect.height };
      })
      .filter(({ width, height }) => width < 44 || height < 44));
    expect(undersized, `${path} contains undersized touch targets`).toEqual([]);
  }
});

test('ships immutable assets and restrictive production response policies', async ({ request }) => {
  const response = await request.get('/staticwebapp.config.json');
  expect(response.ok()).toBe(true);
  const config = await response.json();
  expect(config.routes).toEqual(expect.arrayContaining([
    expect.objectContaining({ route: '/assets/*', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } }),
    expect.objectContaining({ route: '/sw.js', headers: { 'Cache-Control': 'no-cache' } }),
  ]));
  expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
  expect(config.globalHeaders['Content-Security-Policy']).toContain('https://api.sociobot.in');
  expect(config.globalHeaders['Permissions-Policy']).toContain('microphone=(self)');
  expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
  const worker = await (await request.get('/sw.js')).text();
  expect(worker).toContain("const VERSION = 'thought-parking-v6'");
  expect(worker).toContain('self.skipWaiting()');
  expect(worker).toContain('self.clients.claim()');
});

test('offers an explicit action when a service-worker update is waiting', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser is sufficient for the update UI path.');
  await page.goto('/');
  await page.evaluate(() => dispatchEvent(new Event('sw-update')));
  await expect(page.getByText('A fresh tape is ready.')).toBeVisible();
  await page.getByRole('button', { name: 'Update now' }).click();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('thought-parking:apply-update'))).toBe('1');
});

test('@claim:private-local-capture keeps demo capture traffic on the product origin', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  await page.goto('/demo/');
  await page.getByLabel('What pulled your attention?').fill('Private local thought');
  await page.getByRole('button', { name: /Park thought/ }).click();
  await page.getByRole('button', { name: 'Record voice' }).click();
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: 'Stop recording' }).click();
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:offline-reload loads the demo and its data while offline', async ({ page, context }, testInfo) => {
  expect(['chromium', 'mobile-390']).toContain(testInfo.project.name);
  await page.goto('/demo/');
  await page.getByLabel('What pulled your attention?').fill('Offline thought');
  await page.getByRole('button', { name: /Park thought/ }).click();
  await page.waitForFunction(() => navigator.serviceWorker?.controller);
  await context.setOffline(true);
  await page.goto('/demo/', { waitUntil: 'domcontentloaded' });
  const offlineState = page.getByRole('status').filter({ hasText: 'Offline · still saving' });
  await expect(offlineState).toBeVisible();
  if (testInfo.project.name === 'mobile-390') {
    const box = await offlineState.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  }
  await page.getByRole('link', { name: /Review/ }).click();
  await page.getByRole('button', { name: /Start this review/ }).click();
  await page.getByRole('button', { name: 'Archive' }).click();
  await page.getByRole('button', { name: 'Archive' }).click();
  await expect(page.getByText('Offline thought')).toBeVisible();
  await context.setOffline(false);
});

test('@claim:isolated-demo loads sample data without writing to a real parking lot', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('What pulled your attention?').fill('Real thought stays private');
  await page.getByRole('button', { name: /Park thought/ }).click();
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo\//);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('Check whether the library keeps spare bus passes at the desk.')).toHaveCount(0);
  await expect(page.getByText('2', { exact: true }).first()).toBeVisible();
  await page.getByLabel('What pulled your attention?').fill('Demo-only thought');
  await page.getByRole('button', { name: /Park thought/ }).click();
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole('link', { name: /Review/ }).click();
  await page.getByRole('button', { name: /Start this review/ }).click();
  await expect(page.getByText('Real thought stays private')).toBeVisible();
  await expect(page.getByText('Demo-only thought')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('demo:thought-parking:draft'))).toBeNull();
});

test('@claim:json-backup exports a versioned JSON backup from demo data', async ({ page }) => {
  await page.goto('/settings/?demo=1');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const stream = await (await download).createReadStream();
  let json = '';
  for await (const chunk of stream!) json += chunk.toString();
  const payload = JSON.parse(json);
  expect(payload).toMatchObject({ product: 'thought-parking', version: 1 });
  expect(payload.thoughts).toHaveLength(3);
});

test('sets route-specific titles and moves focus to the destination heading', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy' }).click();
  await expect(page).toHaveTitle('Privacy — Thought Parking');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.locator('#route-announcer')).toHaveText('Privacy page');
  await page.getByRole('link', { name: 'Review' }).click();
  await expect(page).toHaveTitle('Review — Thought Parking');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
});
