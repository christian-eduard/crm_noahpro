import { test, expect } from '@playwright/test';

test.describe('LeadHunter Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // 1. Login via UI - correct path is /crm/login
        await page.goto('/crm/login');
        await page.getByPlaceholder('Usuario corporativo').fill('admin');
        await page.getByPlaceholder('••••••••').fill('admin123');
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await page.waitForURL('**/crm/dashboard**');
    });

    test('should render dashboard and show Lead Hunter section', async ({ page }) => {
        // Mock Access Check
        await page.route('**/api/hunter/access', async route => {
            await route.fulfill({ json: { hasAccess: true, remaining: 45 } });
        });

        // Mock Stats API
        await page.route('**/api/hunter/stats', async route => {
            await route.fulfill({
                json: {
                    totals: { total_searched: 10, total_leads: 2, total_analyzed: 5 },
                    today: { leads_created: 0 },
                    limits: { hunter_daily_limit: 50, hunter_prospects_today: 5 }
                }
            });
        });

        // Mock Searches API
        await page.route('**/api/hunter/searches', async route => {
            await route.fulfill({ json: [] });
        });

        // Mock Business Types
        await page.route('**/api/business-types', async route => {
            await route.fulfill({ json: [] });
        });

        // Click on Lead Hunter in sidebar
        await page.getByText('Lead Hunter').click();

        // Verify Lead Hunter header is visible
        await expect(page.getByText('Lead Hunter AI')).toBeVisible({ timeout: 10000 });

        // Verify stats are shown
        await expect(page.getByText('búsquedas restantes hoy')).toBeVisible();
    });

    test('should open prospect detail modal', async ({ page }) => {
        // Mock Prospects API
        await page.route('**/api/hunter/prospects*', async route => {
            const json = [{
                id: 1,
                name: 'Restaurante Test',
                address: 'Calle Test 123',
                business_type: 'Restaurante',
                rating: 4.5,
                reviews_count: 100,
                searched_by: 1,
                processed: false
            }];
            await route.fulfill({ json });
        });

        // Mock other APIs
        await page.route('**/api/hunter/access', async route => {
            await route.fulfill({ json: { hasAccess: true, remaining: 45 } });
        });
        await page.route('**/api/hunter/stats', async route => {
            await route.fulfill({
                json: {
                    totals: { total_searched: 10, total_leads: 2, total_analyzed: 5 },
                    today: { leads_created: 0 }
                }
            });
        });
        await page.route('**/api/hunter/searches', async route => {
            await route.fulfill({ json: [] });
        });
        await page.route('**/api/business-types', async route => {
            await route.fulfill({ json: [] });
        });

        // Navigate to Lead Hunter via sidebar
        await page.getByText('Lead Hunter').click();

        // Go to Convertidos tab to see prospects
        await page.getByText('Convertidos').click();

        // Verify prospect card is visible
        const card = page.getByText('Restaurante Test');
        await expect(card).toBeVisible({ timeout: 10000 });

        // Click to open modal
        await card.click();

        // Verify modal opens
        await expect(page.getByText('Detalle del Prospecto')).toBeVisible();
    });
});
