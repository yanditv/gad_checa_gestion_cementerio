/**
 * Pruebas unitarias del motor de depreciación (línea recta CGE 406-03).
 *
 * No hay framework de pruebas instalado en el backend (no jest/vitest); este
 * script usa `node:assert` y es invocable directamente con bun:
 *
 *     cd backend && bun run test/depreciacion.calc.test.ts
 *
 * Sale con código 0 si todo pasa, 1 si alguna aserción falla. Cubre los casos
 * exigidos por §10.1 del TDR: bien nuevo, a mitad de vida útil, totalmente
 * depreciado y con override de valor residual / vida útil.
 */
import assert from 'node:assert/strict';
import {
  calcularDepreciacion,
  mesesEntre,
  fechaCortePeriodo,
  type BienDepreciable,
  type CategoriaDepreciacion,
} from '../src/modules/inventario/depreciacion.calc';

let pasadas = 0;
let fallidas = 0;

function test(nombre: string, fn: () => void): void {
  try {
    fn();
    pasadas += 1;
    // eslint-disable-next-line no-console
    console.log(`  ✓ ${nombre}`);
  } catch (err) {
    fallidas += 1;
    // eslint-disable-next-line no-console
    console.error(`  ✗ ${nombre}`);
    // eslint-disable-next-line no-console
    console.error(`      ${(err as Error).message}`);
  }
}

// Categoría de equipo de cómputo: 3 años de vida útil, 10 % residual.
const categoriaComputo: CategoriaDepreciacion = {
  vidaUtilAnios: 3,
  valorResidualPct: 10,
};

// Bien base: 1000 adquirido el 2020-01-15.
const bienBase: BienDepreciable = {
  valorAdquisicion: 1000,
  fechaAdquisicion: new Date(2020, 0, 15),
  valorResidual: null,
  vidaUtilMesesOverride: null,
};

// ---------------------------------------------------------------------------
// mesesEntre
// ---------------------------------------------------------------------------
test('mesesEntre: cuenta meses calendario completos', () => {
  assert.equal(mesesEntre(new Date(2020, 0, 15), new Date(2020, 6, 15)), 6);
  assert.equal(mesesEntre(new Date(2020, 0, 15), new Date(2020, 6, 14)), 5);
  assert.equal(mesesEntre(new Date(2020, 0, 15), new Date(2021, 0, 15)), 12);
});

test('mesesEntre: nunca es negativo', () => {
  assert.equal(mesesEntre(new Date(2021, 0, 1), new Date(2020, 0, 1)), 0);
});

// ---------------------------------------------------------------------------
// Caso 1 — Bien nuevo (mismo mes de adquisición): sin depreciación acumulada
// ---------------------------------------------------------------------------
test('bien nuevo: 0 meses => valor en libros = valor de adquisición', () => {
  const corte = new Date(2020, 0, 20); // 5 días después de adquirir
  const r = calcularDepreciacion(bienBase, categoriaComputo, corte);

  assert.equal(r.valorResidual, 100); // 10 % de 1000
  assert.equal(r.vidaUtilMeses, 36); // 3 años * 12
  assert.equal(r.depreciacionMensual, 25); // (1000-100)/36
  assert.equal(r.mesesTranscurridos, 0);
  assert.equal(r.depreciacionAcumulada, 0);
  assert.equal(r.valorEnLibros, 1000);
  assert.equal(r.totalmenteDepreciado, false);
});

// ---------------------------------------------------------------------------
// Caso 2 — Mitad de vida útil (18 de 36 meses)
// ---------------------------------------------------------------------------
test('mitad de vida: 18 meses => acumulada 450, en libros 550', () => {
  const corte = new Date(2021, 6, 15); // 18 meses después de 2020-01-15
  const r = calcularDepreciacion(bienBase, categoriaComputo, corte);

  assert.equal(r.mesesTranscurridos, 18);
  assert.equal(r.depreciacionAcumulada, 450); // 25 * 18
  assert.equal(r.valorEnLibros, 550); // 1000 - 450
  assert.equal(r.totalmenteDepreciado, false);
});

// ---------------------------------------------------------------------------
// Caso 3 — Totalmente depreciado (>= vida útil): valor en libros = residual
// ---------------------------------------------------------------------------
test('totalmente depreciado: pasada la vida útil => en libros = residual', () => {
  const corte = new Date(2025, 0, 15); // 60 meses (> 36)
  const r = calcularDepreciacion(bienBase, categoriaComputo, corte);

  assert.equal(r.mesesTranscurridos, 36); // acotado a la vida útil
  assert.equal(r.depreciacionAcumulada, 900); // base depreciable completa
  assert.equal(r.valorEnLibros, 100); // = valor residual, nunca menos
  assert.equal(r.totalmenteDepreciado, true);
});

test('justo al fin de la vida útil (36 meses exactos)', () => {
  const corte = new Date(2023, 0, 15); // 36 meses
  const r = calcularDepreciacion(bienBase, categoriaComputo, corte);

  assert.equal(r.mesesTranscurridos, 36);
  assert.equal(r.depreciacionAcumulada, 900);
  assert.equal(r.valorEnLibros, 100);
  assert.equal(r.totalmenteDepreciado, true);
});

// ---------------------------------------------------------------------------
// Caso 4 — Con override de valor residual y de vida útil
// ---------------------------------------------------------------------------
test('override de valor residual: usa el del bien, no el % de categoría', () => {
  const bien: BienDepreciable = {
    ...bienBase,
    valorResidual: 200, // override explícito (vs 10 % = 100)
  };
  const corte = new Date(2021, 6, 15); // 18 meses
  const r = calcularDepreciacion(bien, categoriaComputo, corte);

  assert.equal(r.valorResidual, 200);
  // (1000-200)/36 = 22.2222 -> 22.22
  assert.equal(r.depreciacionMensual, 22.22);
  // acumulada teórica = 800 * 18 / 36 = 400
  assert.equal(r.depreciacionAcumulada, 400);
  assert.equal(r.valorEnLibros, 600);
});

test('override de vida útil en meses: cambia el ritmo de depreciación', () => {
  const bien: BienDepreciable = {
    ...bienBase,
    vidaUtilMesesOverride: 24, // 2 años en vez de 3
  };
  const corte = new Date(2021, 0, 15); // 12 meses
  const r = calcularDepreciacion(bien, categoriaComputo, corte);

  assert.equal(r.vidaUtilMeses, 24);
  assert.equal(r.depreciacionMensual, 37.5); // (1000-100)/24
  assert.equal(r.mesesTranscurridos, 12);
  assert.equal(r.depreciacionAcumulada, 450); // 37.5 * 12
  assert.equal(r.valorEnLibros, 550);
});

// ---------------------------------------------------------------------------
// Caso borde — valor residual >= valor de adquisición => no deprecia
// ---------------------------------------------------------------------------
test('residual >= adquisición: no hay depreciación', () => {
  const bien: BienDepreciable = {
    ...bienBase,
    valorResidual: 1000,
  };
  const corte = new Date(2025, 0, 15);
  const r = calcularDepreciacion(bien, categoriaComputo, corte);

  assert.equal(r.depreciacionMensual, 0);
  assert.equal(r.depreciacionAcumulada, 0);
  assert.equal(r.valorEnLibros, 1000);
});

// ---------------------------------------------------------------------------
// fechaCortePeriodo
// ---------------------------------------------------------------------------
test('fechaCortePeriodo: devuelve el último día del mes', () => {
  const corte = fechaCortePeriodo(2024, 2); // febrero bisiesto
  assert.equal(corte.getMonth(), 1); // febrero (0-index)
  assert.equal(corte.getDate(), 29);
});

// ---------------------------------------------------------------------------
// Resumen
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-console
console.log(`\nResultado: ${pasadas} pasadas, ${fallidas} fallidas`);
if (fallidas > 0) {
  process.exit(1);
}
