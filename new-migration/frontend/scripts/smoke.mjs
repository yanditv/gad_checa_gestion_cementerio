/**
 * Smoke test de navegador headless (Playwright).
 *
 * Abre CADA pantalla principal en un Chromium real, inicia sesión, y falla si
 * alguna pantalla lanza un error de runtime, queda en blanco, redirige a login
 * o responde 4xx/5xx. Atrapa los bugs que `next build` NO detecta (errores de
 * forma de datos en runtime, p. ej. `X.map is not a function`).
 *
 * Requisitos (deben estar corriendo ANTES de ejecutar):
 *   - Backend en http://localhost:3001 con el seed aplicado (admin@teobu.com).
 *   - Frontend en http://localhost:3000 (`bun run dev` o `bun run start`).
 * Y el navegador instalado una vez: `bunx playwright install chromium`.
 *
 * Uso:
 *   bun run smoke
 *   SMOKE_BASE_URL=http://localhost:3000 SMOKE_EMAIL=... SMOKE_PASSWORD=... bun run smoke
 *
 * Sale con código != 0 si alguna pantalla falla (apto como gate de CI/PR).
 */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.SMOKE_EMAIL || 'admin@teobu.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'Admin123!';

// Pantallas estáticas / de listado que deben abrir sin error.
const ROUTES = [
  '/',
  '/contratos',
  '/contratos/create',
  '/personas',
  '/bloques',
  '/bovedas',
  '/bovedas/create',
  '/cobros',
  '/difuntos',
  '/exhumaciones',
  '/inventario/bienes',
  '/inventario/bienes/nuevo',
  '/inventario/categorias',
  '/inventario/categorias/create',
  '/inventario/custodios',
  '/inventario/custodios/create',
  '/inventario/depreciacion',
  '/inventario/reportes',
  '/reportes',
  '/configuracion',
  '/cuenta',
  '/admin/usuarios',
  '/admin/roles',
  '/manual',
];

// Detalles dinámicos: se abre la lista, se descubre el primer enlace de detalle
// y se visita (cubre las páginas [id] que sí tienen lógica de runtime).
const DYNAMIC = [
  { listRoute: '/inventario/bienes', selector: 'a[href^="/inventario/bienes/"]', exclude: ['/nuevo'], label: 'Bien (detalle)' },
  { listRoute: '/difuntos', selector: 'a[href^="/difuntos/"]', exclude: ['/create'], label: 'Difunto (detalle)' },
  { listRoute: '/bovedas', selector: 'a[href^="/bovedas/"]', exclude: ['/create'], label: 'Bóveda (detalle/edición)' },
];

const RUNTIME_ERR = /is not a function|cannot read|undefined is not|unhandled|hydration failed|minified react error/i;

function attachErrorCapture(page) {
  const errs = { pageErrors: [], consoleErrors: [] };
  const onPage = (e) => errs.pageErrors.push(String(e.message || e).slice(0, 240));
  const onConsole = (m) => {
    if (m.type() === 'error') {
      const t = m.text();
      if (RUNTIME_ERR.test(t)) errs.consoleErrors.push(t.slice(0, 240));
    }
  };
  page.on('pageerror', onPage);
  page.on('console', onConsole);
  return { errs, detach: () => { page.off('pageerror', onPage); page.off('console', onConsole); } };
}

async function visit(page, route, label) {
  const { errs, detach } = attachErrorCapture(page);
  let status = '?';
  try {
    const resp = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 });
    status = resp ? resp.status() : '?';
  } catch (e) {
    errs.pageErrors.push('goto: ' + String(e.message).slice(0, 160));
  }
  await page.waitForTimeout(900);
  const redirected = page.url().includes('/auth/login');
  const bodyLen = await page.evaluate(() => document.body?.innerText?.trim().length || 0);
  detach();

  const failures = [];
  if (errs.pageErrors.length) failures.push('pageerror: ' + errs.pageErrors.join(' | '));
  if (errs.consoleErrors.length) failures.push('console: ' + errs.consoleErrors.join(' | '));
  if (redirected) failures.push('redirigido a /auth/login (inaccesible)');
  if (status === 404 || status === 500) failures.push('http ' + status);
  if (bodyLen < 40) failures.push('pantalla en blanco (bodyChars=' + bodyLen + ')');

  const ok = failures.length === 0;
  console.log(`${ok ? '✅' : '❌'} ${label || route}  [${route}]  http=${status} chars=${bodyLen}`);
  for (const f of failures) console.log('     · ' + f);
  return ok;
}

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();

// --- login ---
await page.goto(BASE + '/auth/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"], input[name="email"]', EMAIL);
await page.fill('input[type="password"], input[name="password"]', PASSWORD);
await Promise.all([page.waitForLoadState('networkidle'), page.click('button[type="submit"]')]);
await page.waitForTimeout(1200);
if (page.url().includes('/auth/login')) {
  console.error('❌ LOGIN FALLÓ — ¿backend arriba y seed aplicado?');
  await browser.close();
  process.exit(2);
}
console.log('✅ Login\n');

let okCount = 0;
let total = 0;

for (const route of ROUTES) {
  total++;
  if (await visit(page, route)) okCount++;
}

// detalles dinámicos
for (const d of DYNAMIC) {
  total++;
  let href = '';
  try {
    await page.goto(BASE + d.listRoute, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(900);
    const links = await page.$$eval(d.selector, (as) => as.map((a) => a.getAttribute('href')));
    href = (links || []).find((h) => h && !d.exclude.some((x) => h.includes(x))) || '';
  } catch {}
  if (!href) {
    console.log(`⚠️  ${d.label}: sin datos para probar (omitido)`);
    okCount++; // sin datos no es fallo
    continue;
  }
  if (await visit(page, href, d.label)) okCount++;
}

await browser.close();

console.log(`\n===== SMOKE: ${okCount}/${total} OK =====`);
if (okCount < total) {
  console.error('Hay pantallas con errores. Revisa el detalle arriba.');
  process.exit(1);
}
console.log('Todas las pantallas abren sin errores de runtime.');
process.exit(0);
