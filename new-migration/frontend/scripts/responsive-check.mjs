/**
 * Chequeo de responsive (Playwright headless).
 *
 * Inicia sesión y, para un conjunto representativo de pantallas, verifica en
 * cuatro viewports (375 / 768 / 1024 / 1440) que NO haya scroll horizontal
 * (`scrollWidth > clientWidth`). Cuando lo hay, reporta los elementos que se
 * salen del viewport para poder corregirlos.
 *
 * Requisitos: backend en :3001 (seed) y frontend en :3000 (o SMOKE_BASE_URL).
 *
 * Uso:
 *   bun run responsive
 *   SMOKE_BASE_URL=http://localhost:3000 bun run responsive
 *
 * Sale != 0 si alguna ruta desborda en algún viewport (apto como gate).
 */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.SMOKE_EMAIL || 'admin@teobu.com';
const PASSWORD = process.env.SMOKE_PASSWORD || 'Admin123!';

const VIEWPORTS = [
  { w: 375, h: 812, label: 'móvil' },
  { w: 768, h: 1024, label: 'tablet' },
  { w: 1024, h: 768, label: 'laptop' },
  { w: 1440, h: 900, label: 'desktop' },
];

// Representativas: dashboard, listados, tabla ancha, wizard, formularios, detalle.
const ROUTES = [
  '/',
  '/contratos',
  '/contratos/create',
  '/personas',
  '/bovedas',
  '/difuntos',
  '/reportes/bovedas',
  '/reportes/ingresos',
  '/cobros',
  '/inventario/bienes',
  '/cuenta',
  '/admin/usuarios',
  '/configuracion',
];

/** Mide desborde horizontal y reporta los elementos culpables. */
async function overflowReport(page) {
  return page.evaluate(() => {
    const docW = document.documentElement.clientWidth;
    const scrollW = document.documentElement.scrollWidth;
    const overflow = scrollW - docW;
    const culprits = [];
    if (overflow > 1) {
      const all = document.body.querySelectorAll('*');
      for (const el of all) {
        const r = el.getBoundingClientRect();
        // Elemento que se sale por la derecha del viewport de forma significativa.
        if (r.right > docW + 1 && r.width > 0 && r.width <= scrollW) {
          const cls = (el.className && typeof el.className === 'string')
            ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
            : '';
          culprits.push(
            `${el.tagName.toLowerCase()}${cls} (right=${Math.round(r.right)} w=${Math.round(r.width)})`,
          );
        }
      }
    }
    // Dedup y top 5 más anchos.
    const uniq = [...new Set(culprits)].slice(0, 5);
    return { docW, scrollW, overflow, culprits: uniq };
  });
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

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

let offenders = 0;
let checks = 0;

for (const route of ROUTES) {
  await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(500);
  const lineParts = [];
  let routeBad = false;
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.waitForTimeout(350);
    checks++;
    const r = await overflowReport(page);
    if (r.overflow > 1) {
      routeBad = true;
      offenders++;
      lineParts.push(`❌${vp.w}(+${r.overflow})`);
      console.log(`❌ ${route} @${vp.w} (${vp.label}): desborde +${r.overflow}px`);
      for (const c of r.culprits) console.log('     · ' + c);
    } else {
      lineParts.push(`✅${vp.w}`);
    }
  }
  if (!routeBad) console.log(`✅ ${route}  ${lineParts.join(' ')}`);
}

await browser.close();
console.log(`\n===== RESPONSIVE: ${checks - offenders}/${checks} viewports OK =====`);
if (offenders > 0) {
  console.error(`${offenders} combinaciones con scroll horizontal. Revisa arriba.`);
  process.exit(1);
}
console.log('Sin scroll horizontal en ningún viewport.');
process.exit(0);
