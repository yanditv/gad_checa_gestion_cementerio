/**
 * Motor de cálculo de depreciación — línea recta (Norma de Control Interno
 * CGE 406-03, bienes de larga duración).
 *
 * Esta unidad es **pura** (sin dependencias de Prisma ni Nest) para poder
 * cubrirla con pruebas unitarias del cálculo (garantía §10.1 del TDR).
 */

/** Datos mínimos del bien necesarios para el cálculo. */
export interface BienDepreciable {
  /** Valor de adquisición (> 0). */
  valorAdquisicion: number;
  /** Fecha de adquisición. */
  fechaAdquisicion: Date;
  /**
   * Valor residual del bien (override). Si es `null`/`undefined`, se calcula a
   * partir del porcentaje de la categoría.
   */
  valorResidual?: number | null;
  /**
   * Vida útil en meses (override). Si es `null`/`undefined`, se deriva de
   * `categoria.vidaUtilAnios`.
   */
  vidaUtilMesesOverride?: number | null;
}

/** Datos de la categoría relevantes para la depreciación. */
export interface CategoriaDepreciacion {
  /** Vida útil en años (tabla CGE 406-03). */
  vidaUtilAnios: number;
  /** Porcentaje de valor residual por defecto (ej. 10 = 10 %). */
  valorResidualPct: number;
}

/** Resultado del cálculo de depreciación a una fecha de corte. */
export interface ResultadoDepreciacion {
  /** Valor residual efectivo aplicado. */
  valorResidual: number;
  /** Vida útil efectiva en meses. */
  vidaUtilMeses: number;
  /** Depreciación de un mes completo (lineal). */
  depreciacionMensual: number;
  /** Meses transcurridos computables (acotado a la vida útil). */
  mesesTranscurridos: number;
  /** Depreciación acumulada a la fecha de corte. */
  depreciacionAcumulada: number;
  /** Valor en libros a la fecha de corte (nunca < valor residual). */
  valorEnLibros: number;
  /** `true` si el bien ya alcanzó el fin de su vida útil contable. */
  totalmenteDepreciado: boolean;
}

/** Redondea a 2 decimales evitando errores de coma flotante. */
function redondear2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/**
 * Meses calendario completos transcurridos entre dos fechas. Un mes se cuenta
 * sólo cuando se ha cumplido el día del mes de la fecha de adquisición.
 * Nunca devuelve negativos.
 */
export function mesesEntre(desde: Date, hasta: Date): number {
  let meses =
    (hasta.getFullYear() - desde.getFullYear()) * 12 +
    (hasta.getMonth() - desde.getMonth());
  if (hasta.getDate() < desde.getDate()) {
    meses -= 1;
  }
  return meses < 0 ? 0 : meses;
}

/**
 * Calcula la depreciación de un bien a una fecha de corte por el método de
 * línea recta (CGE 406-03).
 *
 * - `valorResidual   = bien.valorResidual ?? valorAdquisicion * pct/100`
 * - `vidaUtilMeses   = override ?? categoria.vidaUtilAnios * 12`
 * - `depreciacionMensual = (valorAdquisicion - valorResidual) / vidaUtilMeses`
 * - `mesesTranscurridos  = min(mesesEntre(fechaAdquisicion, fechaCorte), vidaUtilMeses)`
 * - `valorEnLibros   = max(valorAdquisicion - acumulada, valorResidual)`
 */
export function calcularDepreciacion(
  bien: BienDepreciable,
  categoria: CategoriaDepreciacion,
  fechaCorte: Date,
): ResultadoDepreciacion {
  const valorAdquisicion = bien.valorAdquisicion;

  const valorResidual = redondear2(
    bien.valorResidual ?? (valorAdquisicion * categoria.valorResidualPct) / 100,
  );

  const vidaUtilMeses =
    bien.vidaUtilMesesOverride ?? categoria.vidaUtilAnios * 12;

  const baseDepreciable = Math.max(valorAdquisicion - valorResidual, 0);

  const depreciacionMensual =
    vidaUtilMeses > 0 ? redondear2(baseDepreciable / vidaUtilMeses) : 0;

  const mesesBrutos = mesesEntre(bien.fechaAdquisicion, fechaCorte);
  const mesesTranscurridos = Math.min(mesesBrutos, vidaUtilMeses);

  // Acumulada calculada sobre la base teórica (no sobre el mensual redondeado)
  // para evitar arrastre de error; el último periodo se ajusta al residual.
  let depreciacionAcumulada =
    vidaUtilMeses > 0
      ? redondear2((baseDepreciable * mesesTranscurridos) / vidaUtilMeses)
      : 0;

  // No depreciar por debajo de la base depreciable.
  if (depreciacionAcumulada > baseDepreciable) {
    depreciacionAcumulada = baseDepreciable;
  }

  const valorEnLibros = redondear2(
    Math.max(valorAdquisicion - depreciacionAcumulada, valorResidual),
  );

  return {
    valorResidual,
    vidaUtilMeses,
    depreciacionMensual,
    mesesTranscurridos,
    depreciacionAcumulada,
    valorEnLibros,
    totalmenteDepreciado: mesesTranscurridos >= vidaUtilMeses,
  };
}

/** Último día del mes/año dado (fecha de corte del periodo). */
export function fechaCortePeriodo(anio: number, mes: number): Date {
  // `mes` es 1-12; `new Date(anio, mes, 0)` da el último día de ese mes.
  return new Date(anio, mes, 0, 23, 59, 59, 999);
}
