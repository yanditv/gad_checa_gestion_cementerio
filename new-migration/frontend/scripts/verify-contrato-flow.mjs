import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const baseUrl = process.env.TEST_FRONTEND_URL || 'http://localhost:3002';
const artifactsDir = join(process.cwd(), 'tmp', 'playwright');
mkdirSync(artifactsDir, { recursive: true });
const postResults = [];

function log(step, detail) {
  console.log(`[${step}] ${detail}`);
}

function wizardNextButton(page) {
  return page.locator('button.btn.btn-primary').filter({ hasText: 'Siguiente' }).last();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('response', async (response) => {
    if (response.url().includes('/contratos') && response.request().method() === 'POST') {
      let body = null;
      try {
        body = await response.text();
      } catch {
        body = null;
      }
      postResults.push({
        url: response.url(),
        status: response.status(),
        body,
      });
    }
  });

  page.on('requestfailed', (request) => {
    if (request.url().includes('/contratos') && request.method() === 'POST') {
      postResults.push({
        url: request.url(),
        status: 'REQUEST_FAILED',
        body: request.failure()?.errorText || 'Unknown error',
      });
    }
  });

  try {
    log('open', `${baseUrl}/contratos/create`);
    await page.goto(`${baseUrl}/contratos/create`, { waitUntil: 'networkidle', timeout: 60000 });

    await page.screenshot({ path: join(artifactsDir, '01-create-page.png'), fullPage: true });

    log('modal', 'Abrir búsqueda de bóvedas');
    await page.getByRole('button', { name: /buscar/i }).click();
    await page.waitForTimeout(1000);

    const modal = page.locator('.modal-content');
    await modal.waitFor({ state: 'visible', timeout: 15000 });
    await page.screenshot({ path: join(artifactsDir, '02-boveda-modal.png'), fullPage: true });

    const selectButtons = modal.getByRole('button', { name: /seleccionar/i });
    const availableBovedas = await selectButtons.count();
    if (availableBovedas === 0) {
      throw new Error('No hay bóvedas disponibles en el modal');
    }

    await selectButtons.first().click();
    await page.waitForTimeout(500);

    log('step1', 'Completar difunto');
    await wizardNextButton(page).click();
    await page.getByLabel(/cedula/i).fill(`999999${Date.now().toString().slice(-4)}`);
    await page.getByLabel(/nombres/i).fill('Difunto Prueba');
    await page.getByLabel(/apellidos/i).fill('Migracion');
    await page.getByLabel(/fecha de nacimiento/i).fill('1970-01-01');
    await page.getByLabel(/fecha de defuncion/i).fill('2024-01-01');
    await wizardNextButton(page).click();

    log('step2', 'Agregar responsable existente');
    const existingResponsible = page.locator('button.btn.btn-light.border.w-100.text-start.mb-2').first();
    if (await existingResponsible.count()) {
      await existingResponsible.waitFor({ state: 'visible', timeout: 5000 });
      await existingResponsible.click();
    } else {
      log('step2', 'No hay responsables existentes visibles, creando uno nuevo');
      await page.locator('button.btn.btn-success').filter({ has: page.locator('i.ti.ti-plus') }).first().click();
      await page.getByLabel(/^Nombres$/i).fill('Responsable');
      await page.getByLabel(/^Apellidos$/i).fill('Prueba');
      await page.getByLabel(/numero identificacion/i).fill(`888888${Date.now().toString().slice(-4)}`);
      await page.getByRole('button', { name: /^guardar$/i }).click();
    }
    await wizardNextButton(page).click();

    log('step3', 'Confirmar pago');
    await page.getByLabel(/numero de comprobante/i).fill(`TEST-${Date.now()}`);
    await wizardNextButton(page).click();

    log('save', 'Guardar contrato');
    await page.getByRole('button', { name: /finalizar y guardar/i }).click();
    await page.screenshot({ path: join(artifactsDir, '03-after-save-click.png'), fullPage: true });
    await page.waitForURL(/\/contratos\/\d+$/, { timeout: 60000 });

    const detailUrl = page.url();
    log('detail', detailUrl);
    await page.screenshot({ path: join(artifactsDir, '03-contrato-detail.png'), fullPage: true });

    const printLink = page.getByRole('link', { name: /imprimir contrato/i }).first();
    const [printPage] = await Promise.all([
      context.waitForEvent('page'),
      printLink.click(),
    ]);

    await printPage.waitForLoadState('networkidle', { timeout: 60000 });
    await printPage.screenshot({ path: join(artifactsDir, '04-contrato-print.png'), fullPage: true });

    const pdfPath = join(artifactsDir, 'contrato-print.pdf');
    await printPage.pdf({ path: pdfPath, format: 'A4', printBackground: true });
    log('pdf', pdfPath);

    console.log(JSON.stringify({
      success: true,
      detailUrl,
      printUrl: printPage.url(),
      artifactsDir,
      pdfPath,
    }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    postResults,
  }, null, 2));
  console.error(JSON.stringify({
    success: false,
    message: error.message,
    stack: error.stack,
  }, null, 2));
  process.exit(1);
});
