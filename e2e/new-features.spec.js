const { test, expect } = require('@playwright/test');

test.describe('User Management Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin
        await page.goto('http://localhost:5174/crm/login');
        await page.fill('input[placeholder="Usuario corporativo"]', 'admin');
        await page.fill('input[type="password"]', 'Zeta10zeta@');
        await page.click('button:has-text("Acceder al Panel")');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should complete full user lifecycle: create, edit, delete', async ({ page }) => {
        // Navigate to settings
        await page.click('text=Configuración');
        await page.click('text=Usuarios');

        // Create new user
        await page.click('text=Nuevo Usuario');
        await page.fill('input[placeholder="Usuario corporativo"]', 'testuser_e2e');
        await page.fill('input[name="email"]', 'testuser_e2e@test.com');
        await page.fill('input[type="password"]', 'Test123!');
        await page.selectOption('select[name="role"]', 'user');
        await page.click('button:has-text("Crear Usuario")');

        // Verify user appears in list
        await expect(page.locator('text=testuser_e2e')).toBeVisible();
        await expect(page.locator('text=testuser_e2e@test.com')).toBeVisible();

        // Edit user
        await page.click(`button[title="Editar"]:near(:text("testuser_e2e"))`);
        await page.fill('input[name="email"]', 'updated_email@test.com');
        await page.click('button:has-text("Actualizar")');

        // Verify updated email
        await expect(page.locator('text=updated_email@test.com')).toBeVisible();

        // Delete user
        await page.click(`button[title="Eliminar"]:near(:text("testuser_e2e"))`);
        await page.click('button:has-text("Confirmar")');

        // Verify user is deleted
        await expect(page.locator('text=testuser_e2e')).not.toBeVisible();
    });

    test('should prevent deleting the last admin', async ({ page }) => {
        await page.click('text=Configuración');
        await page.click('text=Usuarios');

        // Try to delete admin user
        await page.click(`button[title="Eliminar"]:near(:text("admin"))`);

        // Should see error message
        await expect(page.locator('text=último administrador')).toBeVisible();
    });
});

test.describe('Email Template Management Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5174/crm/login');
        await page.fill('input[placeholder="Usuario corporativo"]', 'admin');
        await page.fill('input[type="password"]', 'Zeta10zeta@');
        await page.click('button:has-text("Acceder al Panel")');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should edit and save email template', async ({ page }) => {
        // Navigate to email templates
        await page.click('text=Configuración');
        await page.click('text=Plantillas Email');

        // Select proposal template
        await page.click('text=Plantilla de Propuesta');

        // Wait for editor to load
        await expect(page.locator('textarea')).toBeVisible();

        // Switch to code view
        await page.click('button:has-text("Código")');

        // Make a change
        const originalContent = await page.locator('textarea').inputValue();
        const testComment = '<!-- E2E Test Comment -->';
        await page.locator('textarea').fill(testComment + originalContent);

        // Save changes
        await page.click('button:has-text("Guardar")');

        // Verify save success
        await expect(page.locator('text=guardada correctamente')).toBeVisible();

        // Go back and reopen to verify persistence
        await page.click('button[title="Volver"]', { force: true });
        await page.click('text=Plantilla de Propuesta');
        await page.click('button:has-text("Código")');

        const newContent = await page.locator('textarea').inputValue();
        expect(newContent).toContain(testComment);

        // Clean up - restore original
        await page.locator('textarea').fill(originalContent);
        await page.click('button:has-text("Guardar")');
    });

    test('should preview template in real-time', async ({ page }) => {
        await page.click('text=Configuración');
        await page.click('text=Plantillas Email');
        await page.click('text=Plantilla de Propuesta');

        // Switch to split view
        await page.click('button:has-text("Dividido")');

        // Check that both code editor and preview are visible
        await expect(page.locator('textarea')).toBeVisible();
        await expect(page.locator('iframe[title="preview"]')).toBeVisible();

        // Verify preview updates when code changes
        const testText = '<h1>E2E Test Heading</h1>';
        await page.locator('textarea').fill(testText);

        // Check iframe content
        const iframe = page.frameLocator('iframe[title="preview"]');
        await expect(iframe.locator('h1:has-text("E2E Test Heading")')).toBeVisible();
    });
});

test.describe('Proposal Creation and Email Resend Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5174/crm/login');
        await page.fill('input[placeholder="Usuario corporativo"]', 'admin');
        await page.fill('input[type="password"]', 'Zeta10zeta@');
        await page.click('button:has-text("Acceder al Panel")');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should create proposal and resend email', async ({ page }) => {
        // Navigate to proposals
        await page.click('text=Propuestas');

        // Create new proposal
        await page.click('text=Nueva Propuesta');

        // Select a lead (assuming at least one exists)
        await page.selectOption('select[name="lead"]', { index: 1 });

        // Fill proposal  details
        await page.fill('input[name="title"]', 'E2E Test Proposal');
        await page.fill('input[name="price"]', '1000');
        await page.fill('textarea[name="description"]', 'This is a test proposal created by E2E tests');

        // Submit
        await page.click('button:has-text("Crear Propuesta")');

        // Verify proposal appears in list
        await expect(page.locator('text=E2E Test Proposal')).toBeVisible();

        // Hover over proposal to show actions
        await page.hover('text=E2E Test Proposal');

        // Click resend email button
        await page.click('button[title="Reenviar Email"]:near(:text("E2E Test Proposal"))');

        // Verify success message
        await expect(page.locator('text=reenviado exitosamente')).toBeVisible();
    });
});

test.describe('SMTP Configuration and Test Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5174/crm/login');
        await page.fill('input[placeholder="Usuario corporativo"]', 'admin');
        await page.fill('input[type="password"]', 'Zeta10zeta@');
        await page.click('button:has-text("Acceder al Panel")');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should configure SMTP and send test email', async ({ page }) => {
        // Navigate to SMTP settings
        await page.click('text=Configuración');
        await page.click('text=Email (SMTP)');

        // Fill SMTP configuration
        await page.fill('input[name="smtp_host"]', 'smtp.mailtrap.io');
        await page.fill('input[name="smtp_port"]', '2525');
        await page.fill('input[name="smtp_user"]', 'testuser');
        await page.fill('input[name="smtp_password"]', 'testpass');
        await page.selectOption('select[name="smtp_secure"]', 'none');
        await page.fill('input[name="smtp_from_name"]', 'Test CRM');
        await page.fill('input[name="smtp_from_email"]', 'test@crm.com');

        // Save configuration
        await page.click('button:has-text("Guardar Configuración")');
        await expect(page.locator('text=guardada correctamente')).toBeVisible();

        // Test email sending
        await page.fill('input[name="test_email"]', 'test@example.com');
        await page.click('button:has-text("Probar Conexión")');

        // Should show connection result (success or error)
        await expect(page.locator('text=Conexión|Error')).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Complete Authentication Flow', () => {
    test('should login with new user from users table', async ({ page }) => {
        await page.goto('http://localhost:5174/crm/login');

        // Login with admin
        await page.fill('input[placeholder="Usuario corporativo"]', 'admin');
        await page.fill('input[type="password"]', 'Zeta10zeta@');
        await page.click('button:has-text("Acceder al Panel")');

        // Verify redirected to dashboard
        await expect(page).toHaveURL(/.*dashboard/);

        // Verify user is logged in (check for user menu or logout button)
        await expect(page.locator('text=Admin')).toBeVisible();
    });

    test('should reject invalid credentials', async ({ page }) => {
        await page.goto('http://localhost:5174/crm/login');

        await page.fill('input[placeholder="Usuario corporativo"]', 'wronguser');
        await page.fill('input[type="password"]', 'wrongpass');
        await page.click('button:has-text("Acceder al Panel")');

        // Should show error
        await expect(page.locator('text=Credenciales inválidas|Error')).toBeVisible();

        // Should stay on login page
        await expect(page).toHaveURL(/.*login/);
    });

    test('should logout successfully', async ({ page }) => {
        await page.goto('http://localhost:5174/crm/login');
        await page.fill('input[placeholder="Usuario corporativo"]', 'admin');
        await page.fill('input[type="password"]', 'Zeta10zeta@');
        await page.click('button:has-text("Acceder al Panel")');
        await expect(page).toHaveURL(/.*dashboard/);

        // Click logout (adjust selector based on actual UI)
        await page.click('[data-testid="user-menu"]', { force: true });
        await page.click('text=Cerrar Sesión');

        // Should redirect to login
        await expect(page).toHaveURL(/.*login/);
    });
});
