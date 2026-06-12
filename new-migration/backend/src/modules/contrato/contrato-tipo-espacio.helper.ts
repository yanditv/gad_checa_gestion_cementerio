/**
 * Helpers puros (sin dependencias de Prisma/Nest) para resolver el tipo de
 * espacio de una bóveda en el flujo de contratos: prefijo de numeración,
 * tarifa/años por defecto y validación del límite de renovaciones.
 *
 * Antes esta lógica vivía cableada como `tipo.includes('nicho')` en tres
 * lugares de `contrato.service.ts`. Ahora el catálogo `TipoEspacio` manda:
 * cada tipo trae su `prefijoNumeracion`, `tarifaArriendo`, `aniosArriendo` y
 * `vecesRenovacion`. Mientras la migración aditiva no haya poblado todas las
 * bóvedas (`tipoEspacioId` aún nullable, columnas legadas de `Cementerio` y
 * `Boveda.tipo` aún presentes), se conserva un *fallback* al string libre
 * `Boveda.tipo` + columnas pareadas del `Cementerio`, de modo que el sistema
 * no rompe durante la ventana de backfill.
 *
 * Son funciones puras para poder probarlas sin BD (ver
 * `test/contrato.tipo-espacio.test.ts`).
 */

/** Subconjunto del `TipoEspacio` que necesita la lógica de contratos. */
export interface TipoEspacioParams {
  nombre: string;
  prefijoNumeracion: string | null;
  tarifaArriendo: number;
  aniosArriendo: number;
  vecesRenovacion: number;
}

/** Columnas legadas del cementerio usadas sólo en el fallback de backfill. */
export interface CementerioRenovacionLegado {
  vecesRenovacionBovedas: number;
  vecesRenovacionNicho: number;
}

/**
 * Deriva el prefijo base de numeración a partir de un string de tipo libre
 * (camino legado, cuando la bóveda aún no tiene `tipoEspacio`).
 *   nicho            → NCH
 *   tumulo / túmulo  → TML
 *   resto (bóveda)   → CTR
 */
export function prefijoBaseDesdeTexto(texto: string | null | undefined): string {
  const t = (texto || 'Boveda').toLowerCase();
  if (t.includes('nicho')) return 'NCH';
  if (t.includes('tumulo') || t.includes('túmulo') || t.includes('tumul')) {
    return 'TML';
  }
  return 'CTR';
}

/**
 * Prefijo base de numeración para un tipo de espacio. Si el tipo define
 * `prefijoNumeracion`, se usa tal cual (en mayúsculas, sin espacios); si no,
 * se deriva de su `nombre` con la misma heurística legada.
 */
export function prefijoBaseDesdeTipoEspacio(
  tipoEspacio: TipoEspacioParams | null | undefined,
): string {
  const explicito = tipoEspacio?.prefijoNumeracion?.trim();
  if (explicito) {
    return explicito.toUpperCase().replace(/\s+/g, '');
  }
  return prefijoBaseDesdeTexto(tipoEspacio?.nombre);
}

/**
 * Resuelve el prefijo base de una bóveda priorizando su `tipoEspacio`
 * (catálogo) y cayendo al string legado `boveda.tipo` o al nombre del bloque
 * mientras dure el backfill.
 */
export function resolverPrefijoBase(args: {
  tipoEspacio: TipoEspacioParams | null | undefined;
  tipoLegado?: string | null;
  nombreBloque?: string | null;
}): string {
  if (args.tipoEspacio) {
    return prefijoBaseDesdeTipoEspacio(args.tipoEspacio);
  }
  return prefijoBaseDesdeTexto(args.tipoLegado || args.nombreBloque);
}

/**
 * Máximo de renovaciones permitido para una bóveda. Prioriza
 * `tipoEspacio.vecesRenovacion`; si la bóveda aún no tiene tipo asignado,
 * cae a las columnas pareadas del cementerio según el string legado.
 */
export function maxRenovaciones(args: {
  tipoEspacio: TipoEspacioParams | null | undefined;
  tipoLegado?: string | null;
  cementerioLegado?: CementerioRenovacionLegado | null;
}): number {
  if (args.tipoEspacio) {
    return args.tipoEspacio.vecesRenovacion;
  }
  const cementerio = args.cementerioLegado;
  if (!cementerio) return 0;
  return (args.tipoLegado || '').toLowerCase().includes('nicho')
    ? cementerio.vecesRenovacionNicho
    : cementerio.vecesRenovacionBovedas;
}

/**
 * Tarifa por defecto de un contrato. El tipo de espacio manda
 * (`tipoEspacio.tarifaArriendo`), pero la bóveda puede tener un precio de
 * arrendamiento propio (override editable por bóveda); si éste es > 0
 * prevalece, conservando la paridad con el legado, que tomaba siempre
 * `boveda.precioArrendamiento`. Si la bóveda no tiene tarifa propia se usa la
 * del tipo de espacio.
 */
export function resolverTarifaContrato(
  precioArrendamientoBoveda: number,
  tipoEspacio: TipoEspacioParams | null | undefined,
): number {
  if (precioArrendamientoBoveda > 0) {
    return precioArrendamientoBoveda;
  }
  return tipoEspacio?.tarifaArriendo ?? 0;
}

/**
 * Años de arriendo por defecto del contrato. El wizard envía el valor que el
 * operador elige (`numeroDeMeses`); cuando no llega un valor válido (> 0) se
 * usa `tipoEspacio.aniosArriendo` como default.
 */
export function resolverAniosContrato(
  aniosSolicitados: number | null | undefined,
  tipoEspacio: TipoEspacioParams | null | undefined,
): number {
  if (aniosSolicitados && aniosSolicitados > 0) {
    return aniosSolicitados;
  }
  return tipoEspacio?.aniosArriendo ?? 0;
}

/**
 * Valida que `vecesRenovado + 1` no supere el máximo permitido. Devuelve el
 * resultado en vez de lanzar para que el caller arme el mensaje/excepción
 * (y para poder probarlo sin acoplar a Nest).
 */
export function validarLimiteRenovacion(args: {
  vecesRenovado: number;
  tipoEspacio: TipoEspacioParams | null | undefined;
  tipoLegado?: string | null;
  cementerioLegado?: CementerioRenovacionLegado | null;
}): { permitido: boolean; max: number } {
  const max = maxRenovaciones(args);
  return { permitido: args.vecesRenovado + 1 <= max, max };
}
