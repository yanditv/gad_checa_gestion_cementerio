/**
 * Pruebas unitarias de la resolución de tipo de espacio en contratos:
 * prefijo de numeración, tarifa/años por tipo y validación del límite de
 * renovaciones (incluido el caso "al límite").
 *
 * No hay framework de pruebas en el backend; este script usa `node:assert` y
 * es invocable directamente con bun:
 *
 *     cd backend && bun run test/contrato.tipo-espacio.test.ts
 *
 * Sale con código 0 si todo pasa, 1 si alguna aserción falla. Cubre lo exigido
 * por la Fase 3 del plan de tipos de espacio (§10.1 TDR: exactitud de cálculos).
 */
import assert from 'node:assert/strict';
import {
  prefijoBaseDesdeTexto,
  prefijoBaseDesdeTipoEspacio,
  resolverPrefijoBase,
  resolverTarifaContrato,
  resolverAniosContrato,
  maxRenovaciones,
  validarLimiteRenovacion,
  type TipoEspacioParams,
} from '../src/modules/contrato/contrato-tipo-espacio.helper';

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

// Tipos del catálogo de ejemplo.
const boveda: TipoEspacioParams = {
  nombre: 'Bóveda',
  prefijoNumeracion: null,
  tarifaArriendo: 120,
  aniosArriendo: 5,
  vecesRenovacion: 2,
};
const nicho: TipoEspacioParams = {
  nombre: 'Nicho',
  prefijoNumeracion: null,
  tarifaArriendo: 80,
  aniosArriendo: 4,
  vecesRenovacion: 3,
};
const tumulo: TipoEspacioParams = {
  nombre: 'Túmulo',
  prefijoNumeracion: 'TML',
  tarifaArriendo: 200,
  aniosArriendo: 6,
  vecesRenovacion: 1,
};

// ---------------------------------------------------------------------------
// Prefijo desde texto libre (camino legado)
// ---------------------------------------------------------------------------
test('prefijoBaseDesdeTexto: nicho => NCH', () => {
  assert.equal(prefijoBaseDesdeTexto('Nicho'), 'NCH');
  assert.equal(prefijoBaseDesdeTexto('nicho familiar'), 'NCH');
});

test('prefijoBaseDesdeTexto: túmulo => TML', () => {
  assert.equal(prefijoBaseDesdeTexto('Túmulo'), 'TML');
  assert.equal(prefijoBaseDesdeTexto('tumulo'), 'TML');
});

test('prefijoBaseDesdeTexto: bóveda / vacío / null => CTR', () => {
  assert.equal(prefijoBaseDesdeTexto('Bóveda'), 'CTR');
  assert.equal(prefijoBaseDesdeTexto(''), 'CTR');
  assert.equal(prefijoBaseDesdeTexto(null), 'CTR');
  assert.equal(prefijoBaseDesdeTexto(undefined), 'CTR');
});

// ---------------------------------------------------------------------------
// Prefijo desde TipoEspacio (catálogo)
// ---------------------------------------------------------------------------
test('prefijoBaseDesdeTipoEspacio: usa prefijoNumeracion explícito', () => {
  assert.equal(prefijoBaseDesdeTipoEspacio(tumulo), 'TML');
  assert.equal(
    prefijoBaseDesdeTipoEspacio({ ...boveda, prefijoNumeracion: 'ctr' }),
    'CTR',
  );
  assert.equal(
    prefijoBaseDesdeTipoEspacio({ ...boveda, prefijoNumeracion: ' mau ' }),
    'MAU',
  );
});

test('prefijoBaseDesdeTipoEspacio: sin prefijo, deriva del nombre', () => {
  assert.equal(prefijoBaseDesdeTipoEspacio(boveda), 'CTR');
  assert.equal(prefijoBaseDesdeTipoEspacio(nicho), 'NCH');
});

// ---------------------------------------------------------------------------
// resolverPrefijoBase: prioridad catálogo > legado
// ---------------------------------------------------------------------------
test('resolverPrefijoBase: el catálogo manda sobre el string legado', () => {
  // tipoEspacio = Nicho, pero el legado dice "Bóveda": gana el catálogo (NCH).
  assert.equal(
    resolverPrefijoBase({ tipoEspacio: nicho, tipoLegado: 'Bóveda' }),
    'NCH',
  );
});

test('resolverPrefijoBase: sin tipoEspacio cae al string legado', () => {
  assert.equal(
    resolverPrefijoBase({ tipoEspacio: null, tipoLegado: 'Nicho A-3' }),
    'NCH',
  );
});

test('resolverPrefijoBase: sin tipo ni legado usa el nombre del bloque', () => {
  assert.equal(
    resolverPrefijoBase({
      tipoEspacio: null,
      tipoLegado: null,
      nombreBloque: 'Túmulos Norte',
    }),
    'TML',
  );
});

// ---------------------------------------------------------------------------
// Tarifa por tipo (override por bóveda)
// ---------------------------------------------------------------------------
test('resolverTarifaContrato: usa la tarifa del tipo cuando la bóveda no tiene', () => {
  assert.equal(resolverTarifaContrato(0, boveda), 120);
  assert.equal(resolverTarifaContrato(0, nicho), 80);
  assert.equal(resolverTarifaContrato(0, tumulo), 200);
});

test('resolverTarifaContrato: el override por bóveda (>0) prevalece', () => {
  assert.equal(resolverTarifaContrato(150, boveda), 150);
});

test('resolverTarifaContrato: sin tipo ni override => 0', () => {
  assert.equal(resolverTarifaContrato(0, null), 0);
});

// ---------------------------------------------------------------------------
// Años por tipo (default editable)
// ---------------------------------------------------------------------------
test('resolverAniosContrato: usa el valor solicitado cuando es válido', () => {
  assert.equal(resolverAniosContrato(3, boveda), 3);
});

test('resolverAniosContrato: cae al default del tipo cuando no hay valor', () => {
  assert.equal(resolverAniosContrato(0, boveda), 5);
  assert.equal(resolverAniosContrato(null, nicho), 4);
  assert.equal(resolverAniosContrato(undefined, tumulo), 6);
});

// ---------------------------------------------------------------------------
// maxRenovaciones: catálogo vs fallback legado
// ---------------------------------------------------------------------------
test('maxRenovaciones: lo toma del tipoEspacio cuando existe', () => {
  assert.equal(maxRenovaciones({ tipoEspacio: boveda }), 2);
  assert.equal(maxRenovaciones({ tipoEspacio: nicho }), 3);
});

test('maxRenovaciones: fallback a columnas del cementerio según string legado', () => {
  const cementerioLegado = {
    vecesRenovacionBovedas: 2,
    vecesRenovacionNicho: 4,
  };
  assert.equal(
    maxRenovaciones({
      tipoEspacio: null,
      tipoLegado: 'Nicho',
      cementerioLegado,
    }),
    4,
  );
  assert.equal(
    maxRenovaciones({
      tipoEspacio: null,
      tipoLegado: 'Bóveda',
      cementerioLegado,
    }),
    2,
  );
});

// ---------------------------------------------------------------------------
// validarLimiteRenovacion: incluido el caso "al límite"
// ---------------------------------------------------------------------------
test('renovación permitida por debajo del límite', () => {
  // Bóveda permite 2. Origen con 0 renovaciones => 0+1=1 <= 2 OK.
  const r = validarLimiteRenovacion({ vecesRenovado: 0, tipoEspacio: boveda });
  assert.equal(r.permitido, true);
  assert.equal(r.max, 2);
});

test('renovación AL límite (última permitida)', () => {
  // Bóveda permite 2. Origen con 1 renovación => 1+1=2 <= 2: aún permitida.
  const r = validarLimiteRenovacion({ vecesRenovado: 1, tipoEspacio: boveda });
  assert.equal(r.permitido, true);
  assert.equal(r.max, 2);
});

test('renovación que SUPERA el límite se rechaza', () => {
  // Bóveda permite 2. Origen con 2 renovaciones => 2+1=3 > 2: rechazada.
  const r = validarLimiteRenovacion({ vecesRenovado: 2, tipoEspacio: boveda });
  assert.equal(r.permitido, false);
  assert.equal(r.max, 2);
});

test('límite de renovación del nicho (3) difiere del de la bóveda (2)', () => {
  assert.equal(
    validarLimiteRenovacion({ vecesRenovado: 2, tipoEspacio: nicho }).permitido,
    true, // 2+1=3 <= 3
  );
  assert.equal(
    validarLimiteRenovacion({ vecesRenovado: 3, tipoEspacio: nicho }).permitido,
    false, // 3+1=4 > 3
  );
});

test('túmulo: límite 1 — sólo una renovación permitida', () => {
  assert.equal(
    validarLimiteRenovacion({ vecesRenovado: 0, tipoEspacio: tumulo }).permitido,
    true, // 0+1=1 <= 1
  );
  assert.equal(
    validarLimiteRenovacion({ vecesRenovado: 1, tipoEspacio: tumulo }).permitido,
    false, // 1+1=2 > 1
  );
});

// ---------------------------------------------------------------------------
// Resumen
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-console
console.log(`\nResultado: ${pasadas} pasadas, ${fallidas} fallidas`);
if (fallidas > 0) {
  process.exit(1);
}
