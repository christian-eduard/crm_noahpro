const { test, expect } = require('@playwright/test');

test('Critical Flow: Create Lead', async ({ page }) => {
    // 1. Go to Dashboard
    await page.goto('/crm/dashboard');

    // Check if we are on login page or dashboard
    // We wait for either the login button or the dashboard header
    const loginButton = page.getByRole('button', { name: 'Iniciar Sesión' });
    const dashboardHeader = page.getByText('Pipeline de Ventas');

    try {
        await expect(loginButton.or(dashboardHeader)).toBeVisible({ timeout: 10000 });
    } catch (e) {
        console.log('Neither login nor dashboard visible immediately');
    }

    if (await loginButton.isVisible()) {
        console.log('Login required, logging in...');
        await page.fill('input[type="email"]', 'admin@stormsboys.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/crm/dashboard');
    }

    // 2. Open New Lead Modal
    console.log('Navigating to New Lead...');
    await expect(page.getByText('+ Nuevo')).toBeVisible();
    await page.getByText('+ Nuevo').click();
    await page.getByText('Nuevo Lead').click();

    // 3. Fill Form
    const timestamp = Date.now();
    const testEmail = `e2e-${timestamp}@example.com`;
    const testName = `E2E User ${timestamp}`;

    console.log(`Creating lead: ${testName}`);
    await page.fill('input[name="name"]', testName);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="phone"]', '123456789');

    // 4. Submit
    await page.getByRole('button', { name: 'Guardar Lead' }).click();

    // 5. Verify Success
    // We expect the modal to close and the new lead to appear in the list
    // Or a success notification
    console.log('Verifying creation...');
    await expect(page.getByText(testName)).toBeVisible();
});
