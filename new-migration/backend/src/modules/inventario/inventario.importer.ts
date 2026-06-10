/**
 * Importador de inventario de bienes reusable (Fase 9 TDR — GEN-R8).
 *
 * Parsea un Buffer de Excel con los bienes institucionales del GAD y hace
 * upserts en `CategoriaBien` / `Custodio` / `Bien`. Reusa la misma librería
 * de Excel que el catastro (`xlsx`).
 *
 * Mapeo por encabezado (no posicional): tolera el orden real del archivo del
 * GAD buscando columnas por nombre normalizado. Las columnas mínimas son
 * `codigo` (placa) y `descripcion`; el resto son opcionales.
 *
 * Reglas (CLAUDE.md §2.1):
 *   - Upsert sin borrado destructivo: nunca elimina bienes existentes.
 *   - Auditoría manual: `usuarioCreadorId` / `usuarioActualizadorId` con el
 *     admin que disparó la importación.
 *   - Cada bien se procesa dentro de una `$transaction` (Bien + MovimientoBien
 *     'alta' cuando es nuevo) para no dejar bienes sin historial.
 *   - Filas con error se reportan (máx 100) sin abortar el resto.
 */
import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import { PrismaService } from '../../prisma/prisma.service';

export interface InventarioImportReport {
  registrosProcesados: number;
  categoriasCreadas: number;
  custodiosCreados: number;
  bienesCreados: number;
  bienesActualizados: number;
  errores: { fila: number; sheet: string; mensaje: string }[];
}

/** Registro normalizado extraído de una fila del Excel. */
interface RegistroBien {
  codigo: string;
  descripcion: string;
  categoria: string;
  custodio: string;
  identificacionCustodio: string;
  marca: string;
  modelo: string;
  serie: string;
  fechaAdquisicion?: Date;
  valorAdquisicion?: number;
  fuenteFinanciamiento: string;
  estadoConservacion: string;
  ubicacion: string;
  vidaUtilAnios?: number;
}

/**
 * Diccionario de alias de encabezado → campo. Las claves están normalizadas
 * (minúsculas, sin tildes ni espacios). El primer alias que aparezca en la
 * fila de cabecera gana esa columna.
 */
const HEADER_ALIASES: Record<keyof RegistroBien, string[]> = {
  codigo: ['codigo', 'placa', 'codigobien', 'placainstitucional', 'codbien'],
  descripcion: ['descripcion', 'nombre', 'detalle', 'denominacion', 'bien'],
  categoria: ['categoria', 'tipobien', 'grupo', 'tipo', 'clase'],
  custodio: ['custodio', 'responsable', 'funcionario', 'nombrecustodio'],
  identificacionCustodio: [
    'identificacion',
    'cedula',
    'cedulacustodio',
    'idcustodio',
    'documentocustodio',
  ],
  marca: ['marca'],
  modelo: ['modelo'],
  serie: ['serie', 'numeroserie', 'nserie', 'serial'],
  fechaAdquisicion: [
    'fechaadquisicion',
    'fechacompra',
    'fecha',
    'fechaingreso',
  ],
  valorAdquisicion: [
    'valoradquisicion',
    'valor',
    'costo',
    'valorcompra',
    'precio',
  ],
  fuenteFinanciamiento: [
    'fuentefinanciamiento',
    'fuente',
    'financiamiento',
    'origen',
  ],
  estadoConservacion: [
    'estadoconservacion',
    'estado',
    'conservacion',
    'condicion',
  ],
  ubicacion: ['ubicacion', 'dependencia', 'oficina', 'departamento', 'area'],
  vidaUtilAnios: ['vidautil', 'vidautilanios', 'anosvidautil', 'vidautilanos'],
};

const DEFAULT_VIDA_UTIL_ANIOS = 10;
const DEFAULT_CATEGORIA = 'Sin categoría';

export class InventarioImporter {
  private readonly logger = new Logger(InventarioImporter.name);

  // Cachés por run para evitar consultas repetidas.
  private categoriaCache = new Map<string, number>();
  private custodioCache = new Map<string, number>();

  constructor(private prisma: PrismaService) {}

  async run(
    buffer: Buffer,
    adminUserId: string,
  ): Promise<InventarioImportReport> {
    this.categoriaCache = new Map();
    this.custodioCache = new Map();

    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    const report: InventarioImportReport = {
      registrosProcesados: 0,
      categoriasCreadas: 0,
      custodiosCreados: 0,
      bienesCreados: 0,
      bienesActualizados: 0,
      errores: [],
    };

    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];
      if (!ws) continue;

      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
        header: 1,
        blankrows: false,
        raw: false,
      });
      if (rows.length < 2) {
        this.logger.log(`Hoja omitida (sin filas de datos): ${sheetName}`);
        continue;
      }

      const headerRow = (rows[0] ?? []).map((c) => this.normalizeHeader(c));
      const columnMap = this.buildColumnMap(headerRow);

      if (columnMap.codigo === undefined && columnMap.descripcion === undefined) {
        this.logger.log(
          `Hoja omitida (sin columnas codigo/descripcion): ${sheetName}`,
        );
        continue;
      }

      this.logger.log(
        `Procesando hoja: ${sheetName} (${rows.length - 1} filas de datos)`,
      );

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] ?? [];
        const registro = this.extractRegistro(row, columnMap);

        // Salta filas totalmente vacías.
        if (!registro.codigo && !registro.descripcion) continue;

        try {
          this.validar(registro);
          await this.procesarRegistro(registro, adminUserId, report);
          report.registrosProcesados += 1;
        } catch (err) {
          const mensaje = err instanceof Error ? err.message : String(err);
          if (report.errores.length < 100) {
            report.errores.push({ fila: i + 1, sheet: sheetName, mensaje });
          }
          this.logger.warn(`Error fila ${i + 1} de ${sheetName}: ${mensaje}`);
        }
      }
    }

    return report;
  }

  // ---------------------------------------------------------------------------
  // Procesamiento por registro
  // ---------------------------------------------------------------------------
  private async procesarRegistro(
    registro: RegistroBien,
    adminUserId: string,
    report: InventarioImportReport,
  ): Promise<void> {
    const categoriaId = await this.upsertCategoria(
      registro,
      adminUserId,
      report,
    );
    const custodioId = await this.upsertCustodio(
      registro,
      adminUserId,
      report,
    );

    await this.prisma.$transaction(async (tx) => {
      const existente = await tx.bien.findUnique({
        where: { codigo: registro.codigo },
        select: { id: true },
      });

      if (existente) {
        // Upsert no destructivo: actualiza datos del bien existente.
        await tx.bien.update({
          where: { id: existente.id },
          data: {
            descripcion: registro.descripcion,
            marca: registro.marca || null,
            modelo: registro.modelo || null,
            serie: registro.serie || null,
            ...(registro.fechaAdquisicion && {
              fechaAdquisicion: registro.fechaAdquisicion,
            }),
            ...(registro.valorAdquisicion !== undefined && {
              valorAdquisicion: new Prisma.Decimal(registro.valorAdquisicion),
            }),
            fuenteFinanciamiento: registro.fuenteFinanciamiento || null,
            estadoConservacion: registro.estadoConservacion,
            ubicacion: registro.ubicacion || null,
            categoriaId,
            custodioId,
            fechaActualizacion: new Date(),
            usuarioActualizadorId: adminUserId,
          },
        });
        report.bienesActualizados += 1;
        return;
      }

      const bien = await tx.bien.create({
        data: {
          codigo: registro.codigo,
          descripcion: registro.descripcion,
          marca: registro.marca || null,
          modelo: registro.modelo || null,
          serie: registro.serie || null,
          fechaAdquisicion: registro.fechaAdquisicion ?? new Date(),
          valorAdquisicion: new Prisma.Decimal(registro.valorAdquisicion ?? 0),
          fuenteFinanciamiento: registro.fuenteFinanciamiento || null,
          estadoConservacion: registro.estadoConservacion,
          ubicacion: registro.ubicacion || null,
          categoriaId,
          custodioId,
          estado: true,
          usuarioCreadorId: adminUserId,
        },
      });

      await tx.movimientoBien.create({
        data: {
          bienId: bien.id,
          tipo: 'alta',
          detalle: 'Alta por migración de inventario',
          custodioNuevoId: bien.custodioId,
          ubicacionNueva: bien.ubicacion,
          usuarioCreadorId: adminUserId,
        },
      });

      report.bienesCreados += 1;
    });
  }

  // ---------------------------------------------------------------------------
  // Upserts de catálogos
  // ---------------------------------------------------------------------------
  private async upsertCategoria(
    registro: RegistroBien,
    adminUserId: string,
    report: InventarioImportReport,
  ): Promise<number> {
    const nombre = registro.categoria.trim() || DEFAULT_CATEGORIA;
    const key = nombre.toLowerCase();

    const cached = this.categoriaCache.get(key);
    if (cached !== undefined) return cached;

    const existente = await this.prisma.categoriaBien.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existente) {
      this.categoriaCache.set(key, existente.id);
      return existente.id;
    }

    const creada = await this.prisma.categoriaBien.create({
      data: {
        nombre,
        vidaUtilAnios: registro.vidaUtilAnios ?? DEFAULT_VIDA_UTIL_ANIOS,
        estado: true,
        usuarioCreadorId: adminUserId,
      },
      select: { id: true },
    });
    this.categoriaCache.set(key, creada.id);
    report.categoriasCreadas += 1;
    return creada.id;
  }

  private async upsertCustodio(
    registro: RegistroBien,
    adminUserId: string,
    report: InventarioImportReport,
  ): Promise<number | null> {
    const nombre = registro.custodio.trim();
    if (!nombre) return null;

    const key = `${nombre.toLowerCase()}|${registro.identificacionCustodio.trim().toLowerCase()}`;

    const cached = this.custodioCache.get(key);
    if (cached !== undefined) return cached;

    const identificacion = registro.identificacionCustodio.trim() || null;
    const existente = await this.prisma.custodio.findFirst({
      where: {
        nombre: { equals: nombre, mode: 'insensitive' },
        ...(identificacion ? { identificacion } : {}),
      },
      select: { id: true },
    });
    if (existente) {
      this.custodioCache.set(key, existente.id);
      return existente.id;
    }

    const creado = await this.prisma.custodio.create({
      data: {
        nombre,
        identificacion,
        estado: true,
        usuarioCreadorId: adminUserId,
      },
      select: { id: true },
    });
    this.custodioCache.set(key, creado.id);
    report.custodiosCreados += 1;
    return creado.id;
  }

  // ---------------------------------------------------------------------------
  // Validación
  // ---------------------------------------------------------------------------
  private validar(registro: RegistroBien): void {
    if (!registro.codigo) {
      throw new Error('La columna "código/placa" es obligatoria');
    }
    if (!registro.descripcion) {
      throw new Error('La columna "descripción" es obligatoria');
    }
    if (
      registro.valorAdquisicion !== undefined &&
      registro.valorAdquisicion < 0
    ) {
      throw new Error('El valor de adquisición no puede ser negativo');
    }
  }

  // ---------------------------------------------------------------------------
  // Parseo
  // ---------------------------------------------------------------------------
  private buildColumnMap(
    header: string[],
  ): Partial<Record<keyof RegistroBien, number>> {
    const map: Partial<Record<keyof RegistroBien, number>> = {};
    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [
      keyof RegistroBien,
      string[],
    ][]) {
      const idx = header.findIndex((h) => aliases.includes(h));
      if (idx >= 0) map[field] = idx;
    }
    return map;
  }

  private extractRegistro(
    row: unknown[],
    columnMap: Partial<Record<keyof RegistroBien, number>>,
  ): RegistroBien {
    const get = (field: keyof RegistroBien): unknown => {
      const idx = columnMap[field];
      return idx === undefined ? undefined : row[idx];
    };

    const estadoConservacion =
      this.normalizeEstadoConservacion(this.str(get('estadoConservacion'))) ||
      'bueno';

    return {
      codigo: this.str(get('codigo')),
      descripcion: this.str(get('descripcion')),
      categoria: this.str(get('categoria')),
      custodio: this.str(get('custodio')),
      identificacionCustodio: this.str(get('identificacionCustodio')),
      marca: this.str(get('marca')),
      modelo: this.str(get('modelo')),
      serie: this.str(get('serie')),
      fechaAdquisicion: this.parseDate(get('fechaAdquisicion')),
      valorAdquisicion: this.parseNumber(get('valorAdquisicion')),
      fuenteFinanciamiento: this.str(get('fuenteFinanciamiento')),
      estadoConservacion,
      ubicacion: this.str(get('ubicacion')),
      vidaUtilAnios: this.parseInt(get('vidaUtilAnios')),
    };
  }

  // ---------------------------------------------------------------------------
  // Utils
  // ---------------------------------------------------------------------------
  private normalizeHeader(value: unknown): string {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '') // quita tildes
      .replace(/[^a-z0-9]/g, ''); // quita espacios/símbolos
  }

  private normalizeEstadoConservacion(value: string): string {
    const v = value.toLowerCase();
    if (v.includes('buen')) return 'bueno';
    if (v.includes('regular')) return 'regular';
    if (v.includes('mal')) return 'malo';
    return '';
  }

  private str(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  private parseNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : undefined;
    }
    // Limpia separadores de miles y símbolos de moneda comunes.
    const cleaned = String(value)
      .replace(/[^0-9,.-]/g, '')
      .replace(/\.(?=\d{3}(\D|$))/g, '') // puntos de miles
      .replace(',', '.');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private parseInt(value: unknown): number | undefined {
    const n = this.parseNumber(value);
    if (n === undefined) return undefined;
    return Math.trunc(n);
  }

  private parseDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    const strVal = this.str(value);
    if (!strVal) return undefined;

    // Formato dd/mm/yyyy o dd-mm-yyyy (común en Ecuador).
    const dmy = strVal.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (dmy) {
      const day = Number(dmy[1]);
      const month = Number(dmy[2]) - 1;
      let year = Number(dmy[3]);
      if (year < 100) year += 2000;
      const d = new Date(year, month, day);
      if (!Number.isNaN(d.getTime())) return d;
    }

    const parsed = new Date(strVal);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    return undefined;
  }
}
