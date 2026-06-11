import { chromium } from 'playwright';
const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000';
const API = 'http://localhost:3001';
const EMAIL = process.env.E2E_EMAIL || 'admin@teobu.com';
const PASSWORD = process.env.E2E_PASSWORD || 'Admin123!';
let total = 0, passed = 0, authToken = null;

async function test(name, fn) {
  total++;
  try { await fn(); passed++; console.log('  OK ' + name); }
  catch (e) { console.log('  FAIL ' + name + ' — ' + e.message); }
}

function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

async function api(method, path, body?) {
  const h = { 'Content-Type': 'application/json' };
  if (authToken) h['Authorization'] = 'Bearer ' + authToken;
  const r = await fetch(API + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || 'HTTP ' + r.status); }
  return r.json();
}
const apiPost = (path, body) => api('POST', path, body);
const apiDelete = (path) => api('DELETE', path);

async function login(page) {
  const r = await fetch(API + '/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!r.ok) throw new Error('Login failed: ' + r.status);
  const data = await r.json();
  authToken = data.token || (data.data && data.data.token);
  if (!authToken) throw new Error('No token in login response');

  await page.context().addCookies([{ name: 'cementerio_auth', value: authToken, url: BASE }]);
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  if (page.url().includes('/auth/login')) throw new Error('Login redirect');
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  console.log('Login');
  await login(page);

  let bloqueId = null;

  try {
    console.log('\nBloques');

    await test('Navegar /bloques', async () => {
      await page.goto(BASE + '/bloques', { waitUntil: 'domcontentloaded', timeout: 30000 });
      const h1 = await page.textContent('h1');
      if (!h1 || !norm(h1).includes('bloque')) throw new Error('h1: ' + h1);
    });

    await test('Crear bloque 2pisos x3bovedas', async () => {
      const data = await apiPost('/bloques', {
        nombre: 'E2E ' + Date.now(), cementerioId: 1, tipo: 'Bovedas',
        tarifaBase: 0, numeroPisos: 2, bovedasPorPiso: 3,
      });
      bloqueId = String((data.data || data).id);

      await page.goto(BASE + '/bloques/' + bloqueId, { waitUntil: 'domcontentloaded', timeout: 30000 });
      for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(500);
        const t = norm(await page.textContent('body'));
        if (t.includes('informacion') || t.includes('piso 1')) break;
      }
      const body = norm(await page.textContent('body'));
      if (!body.includes('piso 1') || !body.includes('piso 2')) throw new Error('Pisos missing');
      if (!body.includes('vista gr')) throw new Error('Rejilla missing');
    });

    console.log('\nBovedas');

    await test('Navegar /bovedas', async () => {
      await page.goto(BASE + '/bovedas', { waitUntil: 'domcontentloaded', timeout: 30000 });
      const h1 = await page.textContent('h1');
      if (!h1 || !norm(h1).includes('boved')) throw new Error('h1: ' + h1);
    });

    await test('Detalle boveda con secciones', async () => {
      await page.goto(BASE + '/bovedas', { waitUntil: 'domcontentloaded', timeout: 30000 });
      for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(500);
        const t = norm(await page.textContent('body'));
        if (t.includes('disponible') || t.includes('ocupada') || t.includes('no hay bovedas')) break;
      }
      const links = page.locator('a[title="Ver"]');
      if (await links.count() === 0) throw new Error('No Ver links');
      const href = await links.first().getAttribute('href');
      await page.goto(BASE + href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(500);
        const t = norm(await page.textContent('body'));
        if (t.includes('informacion')) break;
      }
      const body = norm(await page.textContent('body'));
      if (!body.includes('informacion')) throw new Error('Info missing');
      if (!body.includes('propietario')) throw new Error('Propietario missing');
    });

  } finally {
    // Limpiar datos creados
    if (bloqueId) {
      try { await apiDelete('/bloques/' + bloqueId); } catch {}
    }
    await browser.close();
  }

  console.log('\n===== E2E: ' + passed + '/' + total + ' OK =====');
  process.exit(passed === total ? 0 : 1);
}

run().catch(e => { console.error('\nFatal:', e.message); process.exit(1); });
