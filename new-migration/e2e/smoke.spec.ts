import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('shows login form', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel('Correo electrónico')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar/i })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Correo electrónico').fill('noexiste@test.com');
    await page.getByLabel('Contraseña').fill('wrong');
    await page.getByRole('button', { name: /iniciar/i }).click();
    await expect(page.locator('text=credenciales')).toBeVisible({ timeout: 5000 });
  });

  test('can login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Correo electrónico').fill('admin@teobu.com');
    await page.getByLabel('Contraseña').fill('Admin123.');
    await page.getByRole('button', { name: /iniciar/i }).click();
    await page.waitForURL(/^(?!.*\/auth\/).*$/);
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Correo electrónico').fill('admin@teobu.com');
    await page.getByLabel('Contraseña').fill('Admin123.');
    await page.getByRole('button', { name: /iniciar/i }).click();
    await page.waitForURL(/^(?!.*\/auth\/).*$/);
  });

  test('sidebar navigates to contratos', async ({ page }) => {
    await page.getByRole('link', { name: /contratos/i }).first().click();
    await expect(page).toHaveURL(/\/contratos/);
    await expect(page.locator('h1')).toContainText(/contrato/i);
  });

  test('sidebar navigates to bovedas', async ({ page }) => {
    await page.getByRole('link', { name: /bóvedas/i }).first().click();
    await expect(page).toHaveURL(/\/bovedas/);
    await expect(page.locator('h1')).toContainText(/bóveda/i);
  });

  test('sidebar navigates to personas', async ({ page }) => {
    await page.getByRole('link', { name: /personas/i }).first().click();
    await expect(page).toHaveURL(/\/personas/);
    await expect(page.locator('h1')).toContainText(/persona/i);
  });

  test('sidebar navigates to reportes', async ({ page }) => {
    await page.getByRole('link', { name: /reportes/i }).first().click();
    await expect(page).toHaveURL(/\/reportes/);
    await expect(page.locator('h1')).toContainText(/reporte/i);
  });

  test('header shows user info', async ({ page }) => {
    await expect(page.locator('header')).toBeVisible();
  });

  test('notifications badge visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: /notif/i })).toBeVisible();
  });

  test('manual page loads', async ({ page }) => {
    await page.goto('/manual');
    await expect(page.locator('h1')).toContainText(/manual/i);
  });
});

test.describe('Listados', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Correo electrónico').fill('admin@teobu.com');
    await page.getByLabel('Contraseña').fill('Admin123.');
    await page.getByRole('button', { name: /iniciar/i }).click();
    await page.waitForURL(/^(?!.*\/auth\/).*$/);
  });

  test('contratos list loads', async ({ page }) => {
    await page.goto('/contratos');
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('bovedas list loads', async ({ page }) => {
    await page.goto('/bovedas');
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('personas list loads', async ({ page }) => {
    await page.goto('/personas');
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('difuntos list loads', async ({ page }) => {
    await page.goto('/difuntos');
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('pagos list loads', async ({ page }) => {
    await page.goto('/pagos');
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('bloques list loads', async ({ page }) => {
    await page.goto('/bloques');
    await expect(page.locator('table, .card, section')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Admin-only pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Correo electrónico').fill('admin@teobu.com');
    await page.getByLabel('Contraseña').fill('Admin123.');
    await page.getByRole('button', { name: /iniciar/i }).click();
    await page.waitForURL(/^(?!.*\/auth\/).*$/);
  });

  test('configuracion loads with cementerio tab', async ({ page }) => {
    await page.goto('/configuracion');
    await expect(page.locator('h1')).toContainText(/configuración/i);
    await page.getByRole('button', { name: /cementerio/i }).click();
    await expect(page.getByText(/datos del cementerio/i)).toBeVisible();
  });

  test('catastro import page loads', async ({ page }) => {
    await page.goto('/configuracion/catastro');
    await expect(page.locator('h1')).toContainText(/importación/i);
    await expect(page.getByText(/subir/i)).toBeVisible();
  });

  test('usuarios admin page loads', async ({ page }) => {
    await page.goto('/admin/usuarios');
    await expect(page.locator('h1')).toContainText(/usuario/i);
  });

  test('roles admin page loads', async ({ page }) => {
    await page.goto('/admin/roles');
    await expect(page.locator('h1')).toContainText(/rol/i);
  });

  test('notificaciones page loads', async ({ page }) => {
    await page.goto('/notify');
    await expect(page.locator('h1')).toContainText(/notif/i);
  });
});

test.describe('Reportes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Correo electrónico').fill('admin@teobu.com');
    await page.getByLabel('Contraseña').fill('Admin123.');
    await page.getByRole('button', { name: /iniciar/i }).click();
    await page.waitForURL(/^(?!.*\/auth\/).*$/);
  });

  test('ingresos report loads', async ({ page }) => {
    await page.goto('/reportes/ingresos');
    await expect(page.locator('h1')).toContainText(/ingreso/i);
  });

  test('cuentas por cobrar report loads', async ({ page }) => {
    await page.goto('/reportes/cuentas-por-cobrar');
    await expect(page.locator('h1')).toContainText(/cobrar/i);
  });

  test('bovedas report loads', async ({ page }) => {
    await page.goto('/reportes/bovedas');
    await expect(page.locator('h1')).toContainText(/bóveda/i);
  });

  test('bloques report loads', async ({ page }) => {
    await page.goto('/reportes/bloques');
    await expect(page.locator('h1')).toContainText(/bloque/i);
  });
});

test.describe('Flujo crear contrato (wizard)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Correo electrónico').fill('admin@teobu.com');
    await page.getByLabel('Contraseña').fill('Admin123.');
    await page.getByRole('button', { name: /iniciar/i }).click();
    await page.waitForURL(/^(?!.*\/auth\/).*$/);
  });

  test('wizard page loads', async ({ page }) => {
    await page.goto('/contratos/create');
    await expect(page.locator('h1')).toContainText(/nuevo/i);
  });

  test('step 1 shows bloque selection', async ({ page }) => {
    await page.goto('/contratos/create');
    await expect(page.getByText(/bóveda|bloque/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Flujo cobrar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Correo electrónico').fill('admin@teobu.com');
    await page.getByLabel('Contraseña').fill('Admin123.');
    await page.getByRole('button', { name: /iniciar/i }).click();
    await page.waitForURL(/^(?!.*\/auth\/).*$/);
  });

  test('cobros page loads', async ({ page }) => {
    await page.goto('/cobros');
    await expect(page.locator('h1')).toContainText(/cobro/i);
  });
});

test.describe('Manual de usuario', () => {
  test('manual page loads without auth', async ({ page }) => {
    await page.goto('/manual');
    await expect(page.locator('h1')).toContainText(/manual/i);
  });
});
