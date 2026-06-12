/**
 * Importador de catastro reusable. Parsea un Buffer de Excel (formato
 * legado: hojas "nichos", "tumulos", "bovedas" con headers conocidos) y
 * hace upserts en bloque/piso/bóveda/persona/responsable/propietario/
 * difunto/contrato/cuota/pago. Devuelve un reporte estructurado para
 * persistir en `CatastroImport`.
 *
 * Reutiliza la lógica que vivía en `bootstrap/catastro-import.service.ts`
 * (semilla automática) pero acepta Buffer en vez de path y SIEMPRE hace
 * upsert sin limpieza destructiva (la versión on-demand nunca borra datos
 * existentes — paridad con la regla §2.1 "Nunca borrar físicamente").
 */
import { Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../../prisma/prisma.service';

const TARGET_SHEETS = [
  'tabla nichos',
  'tabla tumulos',
  'tabla bovedas',
  'nichos',
  'tumulos',
  'bovedas',
];

interface RegistroCatastro {
  idExcel: string;
  numeroBovedaRaw: string;
  nombreDifunto: string;
  tipo: string;
  bloque: string;
  fechaContrato?: Date;
  fechaVencimiento?: Date;
  esPropio: boolean;
  esArrendado: boolean;
  representante: string;
  contacto: string;
  correo: string;
  observaciones: string;
}

export interface ImportReport {
  registrosProcesados: number;
  bloquesCreados: number;
  bovedasCreadas: number;
  contratosCreados: number;
  errores: { fila: number; sheet: string; mensaje: string }[];
}

/**
 * Tipo de espacio del catálogo cacheado al inicio del run. Reemplaza la
 * configuración pareada del cementerio (tarifaBoveda/tarifaNicho…): la
 * tarifa y los años de arriendo se leen del `TipoEspacio` que coincida con
 * el string de tipo del Excel (match por nombre, insensible a mayúsculas).
 */
interface TipoEspacioCache {
  id: number;
  nombre: string;
  tarifaArriendo: number;
  aniosArriendo: number;
}

const DEFAULT_TARIFA = 240;
const DEFAULT_ANIOS = 5;

export class CatastroImporter {
  private readonly logger = new Logger(CatastroImporter.name);
  /** Catálogo de tipos de espacio activo, cargado una vez por run. */
  private tiposEspacio: TipoEspacioCache[] = [];

  constructor(private prisma: PrismaService) {}

  async run(buffer: Buffer, adminUserId: string): Promise<ImportReport> {
    this.tiposEspacio = await this.loadTiposEspacio();
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    const report: ImportReport = {
      registrosProcesados: 0,
      bloquesCreados: 0,
      bovedasCreadas: 0,
      contratosCreados: 0,
      errores: [],
    };

    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];
      if (!ws) continue;

      const rows = XLSX.utils.sheet_to_json<any[]>(ws, {
        header: 1,
        blankrows: false,
        raw: false,
      });
      if (!rows.length) continue;

      const headerRow = rows[0] || [];
      const normalizedHeader = headerRow
        .map((cell: unknown) => String(cell ?? '').toLowerCase())
        .join('|');
      const sheetNameNormalized = sheetName
        .toLowerCase()
        .replace(/[_-]/g, ' ')
        .trim();
      const isTarget =
        TARGET_SHEETS.some((n) => normalizedHeader.includes(n)) ||
        TARGET_SHEETS.some((n) => sheetNameNormalized.includes(n));
      if (!isTarget) {
        this.logger.log(`Hoja omitida: ${sheetName}`);
        continue;
      }

      this.logger.log(`Procesando hoja: ${sheetName} (${rows.length} filas)`);

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        if (this.isLikelyHeader(row)) continue;
        const registro = this.extractRegistro(row);
        if (!registro.idExcel && !registro.numeroBovedaRaw) continue;

        try {
          await this.procesarRegistro(registro, adminUserId, report);
          report.registrosProcesados += 1;
        } catch (err) {
          const mensaje = err instanceof Error ? err.message : String(err);
          if (report.errores.length < 100) {
            report.errores.push({ fila: i + 1, sheet: sheetName, mensaje });
          }
          this.logger.warn(
            `Error fila ${i + 1} de ${sheetName}: ${mensaje}`,
          );
        }
      }
    }

    return report;
  }

  // ---------------------------------------------------------------------------
  // Procesamiento por registro
  // ---------------------------------------------------------------------------
  private async procesarRegistro(
    registro: RegistroCatastro,
    adminUserId: string,
    report: ImportReport,
  ) {
    const { bloque, created: bloqueCreado } = await this.upsertBloque(
      registro.bloque,
      adminUserId,
    );
    if (bloqueCreado) report.bloquesCreados += 1;

    const piso = await this.upsertPiso(bloque.id);
    const { boveda, created: bovedaCreada } = await this.upsertBoveda(
      registro,
      bloque.id,
      piso.id,
      adminUserId,
    );
    if (bovedaCreada) report.bovedasCreadas += 1;

    const ocupada =
      Boolean(registro.nombreDifunto) ||
      registro.esPropio ||
      registro.esArrendado;
    if (!ocupada) {
      // Bóveda libre: nada más que hacer.
      return;
    }

    const difunto = await this.upsertDifunto(registro, boveda.id, adminUserId);
    const personaResponsable = await this.upsertPersonaResponsable(
      registro,
      adminUserId,
    );
    const propietario = await this.upsertPropietario(personaResponsable.id);
    const responsable = await this.upsertResponsable(
      personaResponsable.id,
      propietario.id,
    );

    // Si la bóveda ya tiene un contrato activo con el mismo difunto,
    // no creamos uno nuevo (idempotencia).
    const contratoExistente = await this.prisma.contrato.findFirst({
      where: {
        bovedaId: boveda.id,
        difuntoId: difunto.id,
        estado: true,
      },
    });
    if (!contratoExistente) {
      const contrato = await this.createContrato({
        bovedaId: boveda.id,
        difuntoId: difunto.id,
        responsableId: responsable.id,
        inicio: registro.fechaContrato ?? new Date(),
        fin: registro.fechaVencimiento ?? this.addYears(new Date(), 5),
        observaciones: registro.observaciones || 'Migrado desde catastro',
        adminUserId,
      });
      await this.createCuotasYPagoInicial(
        contrato.id,
        Number(contrato.montoTotal),
        personaResponsable.id,
        contrato.fechaInicio,
        adminUserId,
        registro.tipo,
      );
      report.contratosCreados += 1;
    }

    // La bóveda queda asociada al propietario actual.
    await this.prisma.boveda.update({
      where: { id: boveda.id },
      data: { propietarioId: propietario.id },
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers de parseo
  // ---------------------------------------------------------------------------
  private extractRegistro(row: any[]): RegistroCatastro {
    return {
      idExcel: this.str(row[0]),
      numeroBovedaRaw: this.str(row[1]),
      nombreDifunto: this.str(row[2]),
      tipo: this.str(row[3]) || 'Boveda',
      bloque: this.str(row[4]) || 'Bloque General',
      fechaContrato: this.parseDate(row[5]),
      fechaVencimiento: this.parseDate(row[6]),
      esPropio: this.isTrue(row[7]),
      esArrendado: this.isTrue(row[8]),
      representante: this.str(row[10]),
      contacto: this.str(row[11]),
      correo: this.str(row[12]),
      observaciones: this.str(row[13]),
    };
  }

  private async upsertBloque(nombre: string, adminUserId: string) {
    const cementerio = await this.prisma.cementerio.findFirst({
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    if (!cementerio) {
      throw new Error('No existe cementerio para importar catastro');
    }

    const existing = await this.prisma.bloque.findFirst({
      where: { nombre: nombre.trim(), cementerioId: cementerio.id },
    });
    if (existing) return { bloque: existing, created: false };

    const bloque = await this.prisma.bloque.create({
      data: {
        nombre: nombre.trim(),
        descripcion: `Migrado de catastro: ${nombre.trim()}`,
        estado: true,
        cementerioId: cementerio.id,
        usuarioCreadorId: adminUserId,
      },
    });
    return { bloque, created: true };
  }

  /**
   * El formato legado del catastro no distingue pisos: todas las bóvedas
   * importadas se asocian a un piso `numero: 1` por bloque. Si en el
   * futuro el Excel incluye un campo de piso, extender aquí.
   *
   * Nota de auditoría: `Piso` no expone `usuarioCreadorId` en el schema
   * (ver `prisma/schema.prisma`), por eso no se registra el admin que
   * disparó la creación. Limitación de schema, no del importador.
   */
  private async upsertPiso(bloqueId: number) {
    const existing = await this.prisma.piso.findFirst({
      where: { bloqueId, numero: 1 },
    });
    if (existing) return existing;
    return this.prisma.piso.create({
      data: {
        bloqueId,
        numero: 1,
        descripcion: 'Migrado',
        estado: true,
      },
    });
  }

  private async upsertBoveda(
    registro: RegistroCatastro,
    bloqueId: number,
    pisoId: number,
    adminUserId: string,
  ) {
    const numero =
      registro.numeroBovedaRaw || registro.idExcel || `BOV-${Date.now()}`;
    const existing = await this.prisma.boveda.findFirst({
      where: { numero: numero.trim(), bloqueId },
    });
    if (existing) return { boveda: existing, created: false };

    const tipoEspacio = this.matchTipoEspacio(registro.tipo);
    const tarifa = tipoEspacio?.tarifaArriendo ?? DEFAULT_TARIFA;
    const boveda = await this.prisma.boveda.create({
      data: {
        numero: numero.trim(),
        capacidad: 1,
        // `tipo` (string libre) se mantiene durante la ventana de backfill
        // aditivo; el DROP de la columna es un paso manual posterior. La FK
        // `tipoEspacioId` apunta al catálogo y manda en tarifa/años.
        tipo: registro.tipo || 'Boveda',
        tipoEspacioId: tipoEspacio?.id ?? null,
        estado: true,
        observaciones: registro.observaciones || 'Migrado de catastro',
        precio: tarifa,
        precioArrendamiento: tarifa,
        bloqueId,
        pisoId,
        usuarioCreadorId: adminUserId,
      },
    });
    return { boveda, created: true };
  }

  private async upsertDifunto(
    registro: RegistroCatastro,
    bovedaId: number,
    adminUserId: string,
  ) {
    const [nombre, ...resto] = (registro.nombreDifunto || 'DIFUNTO DESCONOCIDO')
      .split(/\s+/)
      .filter(Boolean);
    const apellido = resto.join(' ') || '(MIGRACION)';
    const existing = await this.prisma.difunto.findFirst({
      where: {
        nombre: { equals: nombre, mode: 'insensitive' },
        apellido: { equals: apellido, mode: 'insensitive' },
      },
    });
    if (existing) return existing;

    return this.prisma.difunto.create({
      data: {
        nombre,
        apellido,
        numeroIdentificacion: '9999999999',
        fechaDefuncion: registro.fechaContrato ?? new Date(),
        estado: true,
        bovedaId,
        usuarioCreadorId: adminUserId,
      },
    });
  }

  private async upsertPersonaResponsable(
    registro: RegistroCatastro,
    adminUserId: string,
  ) {
    const representante = registro.representante || 'CONTRIBUYENTE DESCONOCIDO';
    const [nombre, ...resto] = representante.split(/\s+/).filter(Boolean);
    const apellido = resto.join(' ') || '(MIGRACION)';
    const numeroIdentificacion =
      registro.contacto || this.makeMigrationId(`${nombre} ${apellido}`);

    const existing = await this.prisma.persona.findFirst({
      where: { numeroIdentificacion, tipoPersona: 'Persona' },
    });
    if (existing) return existing;

    return this.prisma.persona.create({
      data: {
        numeroIdentificacion,
        nombre: nombre || 'SIN',
        apellido: apellido || 'NOMBRE',
        telefono: registro.contacto || null,
        email: registro.correo || `${numeroIdentificacion}@migracion.local`,
        direccion: 'CEMENTERIO',
        tipoIdentificacion: 'CED',
        estado: true,
        tipoPersona: 'Persona',
        usuarioCreadorId: adminUserId,
      },
    });
  }

  /**
   * Nota de auditoría: `Propietario` y `Responsable` no tienen
   * `usuarioCreadorId` en el schema actual, por lo que el admin que
   * disparó la creación queda en logs de aplicación únicamente.
   */
  private async upsertPropietario(personaId: number) {
    const existing = await this.prisma.propietario.findFirst({
      where: { personaId },
    });
    if (existing) return existing;
    return this.prisma.propietario.create({
      data: { personaId, estado: true },
    });
  }

  private async upsertResponsable(personaId: number, propietarioId: number) {
    const existing = await this.prisma.responsable.findFirst({
      where: { personaId },
    });
    if (existing) return existing;
    return this.prisma.responsable.create({
      data: {
        personaId,
        propietarioId,
        parentesco: 'Representante',
        estado: true,
      },
    });
  }

  private async createContrato(params: {
    bovedaId: number;
    difuntoId: number;
    responsableId: number;
    inicio: Date;
    fin: Date;
    observaciones: string;
    adminUserId: string;
  }) {
    const numeroSecuencial = await this.generateNumeroContrato(
      params.bovedaId,
      false,
    );
    const numeroDeMeses = Math.max(
      1,
      (params.fin.getFullYear() - params.inicio.getFullYear()) * 12 +
        (params.fin.getMonth() - params.inicio.getMonth()),
    );

    // Recupera la tarifa del `TipoEspacio` de la bóveda. Nunca hardcodear:
    // el GAD ajusta el monto en el catálogo de tipos de espacio y la
    // importación debe respetarlo. Fallback al string legado durante el
    // backfill (bóvedas aún sin FK).
    const boveda = await this.prisma.boveda.findUnique({
      where: { id: params.bovedaId },
      select: { tipo: true, tipoEspacio: { select: { tarifaArriendo: true } } },
    });
    const tarifa = boveda?.tipoEspacio
      ? Number(boveda.tipoEspacio.tarifaArriendo)
      : this.tarifaPorTipo(boveda?.tipo);

    const contrato = await this.prisma.contrato.create({
      data: {
        numeroSecuencial,
        fechaInicio: params.inicio,
        fechaFin: params.fin,
        numeroDeMeses,
        montoTotal: tarifa,
        estado: true,
        observaciones: params.observaciones,
        bovedaId: params.bovedaId,
        difuntoId: params.difuntoId,
        usuarioCreadorId: params.adminUserId,
      },
    });

    await this.prisma.contratoResponsable.upsert({
      where: {
        contratoId_responsableId: {
          contratoId: contrato.id,
          responsableId: params.responsableId,
        },
      },
      update: {},
      create: {
        contratoId: contrato.id,
        responsableId: params.responsableId,
      },
    });

    return contrato;
  }

  /**
   * Crea las cuotas y un pago inicial que las cubre. El número de cuotas
   * se toma de `Cementerio.aniosArriendoBovedas/Nicho` (default 5).
   *
   * Nota de auditoría: `Cuota` no tiene `usuarioCreadorId` en el schema,
   * por eso no se registra el admin a nivel de fila para cuotas. `Pago`
   * sí lo tiene y se rellena con `adminUserId`.
   */
  private async createCuotasYPagoInicial(
    contratoId: number,
    montoTotal: number,
    personaId: number,
    fechaInicio: Date,
    adminUserId: string,
    tipoBoveda?: string | null,
  ) {
    const anios = this.aniosPorTipo(tipoBoveda);
    const cuotaMonto = Number((montoTotal / anios).toFixed(2));
    const cuotas: { id: number; monto: number }[] = [];

    for (let i = 1; i <= anios; i++) {
      const cuota = await this.prisma.cuota.create({
        data: {
          contratoId,
          numero: i,
          monto: cuotaMonto,
          fechaVencimiento: this.addYears(fechaInicio, i),
          fechaPago: new Date(),
          pagada: true,
          intereses: 0,
          estado: true,
        },
      });
      cuotas.push({ id: cuota.id, monto: Number(cuota.monto) });
    }

    const pago = await this.prisma.pago.create({
      data: {
        numeroRecibo: `MIGRACION-${contratoId}-${Date.now()}`,
        monto: cuotas.reduce((acc, c) => acc + c.monto, 0),
        fechaPago: new Date(),
        metodoPago: 'Efectivo',
        referencia: `MIGRACION-${personaId}`,
        observacion: 'Pago inicial de migración',
        estado: true,
        usuarioCreadorId: adminUserId,
      },
    });

    await this.prisma.cuotaPago.createMany({
      data: cuotas.map((c) => ({ cuotaId: c.id, pagoId: pago.id })),
    });
  }

  /**
   * Genera el siguiente número secuencial usando max+1 sobre el prefijo
   * del año en curso. `CLAUDE.md §2.1` exige secuencias PostgreSQL en
   * runtime para evitar race conditions; el importador on-demand corre
   * uno a la vez (administrador sube Excel desde UI), así que el riesgo
   * es nulo. Si se hace import paralelo en el futuro, migrar a
   * `nextval('contrato_numero_YYYY_seq')`.
   */
  private async generateNumeroContrato(
    bovedaId: number,
    isRenovacion = false,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const boveda = await this.prisma.boveda.findUnique({
      where: { id: bovedaId },
      include: { piso: { include: { bloque: true } } },
    });
    const tipo = (
      boveda?.tipo ||
      boveda?.piso?.bloque?.nombre ||
      'Boveda'
    ).toLowerCase();

    const basePrefix = tipo.includes('nicho')
      ? 'NCH'
      : tipo.includes('tumulo') || tipo.includes('tumul')
        ? 'TML'
        : 'CTR';
    const prefix = isRenovacion ? `RNV-${basePrefix}` : basePrefix;

    const gadCode = 'GADCHECA';

    const lastContrato = await this.prisma.contrato.findFirst({
      where: {
        numeroSecuencial: { startsWith: `${prefix}-${gadCode}-${year}-` },
      },
      orderBy: { id: 'desc' },
      select: { numeroSecuencial: true },
    });

    const nextNumber = lastContrato
      ? Number(lastContrato.numeroSecuencial.split('-').pop() || '0') + 1
      : 1;
    return `${prefix}-${gadCode}-${year}-${String(nextNumber).padStart(3, '0')}`;
  }

  // ---------------------------------------------------------------------------
  // Utils
  // ---------------------------------------------------------------------------
  private str(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  private parseDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    const strVal = this.str(value);
    if (!strVal) return undefined;
    const parsed = new Date(strVal);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    return undefined;
  }

  private isTrue(value: unknown): boolean {
    const v = this.str(value).toLowerCase();
    return ['x', 'si', 'sí', '1', 'true'].includes(v);
  }

  private makeMigrationId(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    return `MIG${Math.abs(hash % 1_000_000)
      .toString()
      .padStart(6, '0')}`;
  }

  /**
   * Carga el catálogo de tipos de espacio activo. Reemplaza las columnas
   * pareadas del cementerio (tarifa/años Bóveda vs Nicho) por filas
   * configurables. Cada bóveda/contrato resuelve su tarifa y años buscando
   * el tipo cuyo `nombre` coincide con el string de tipo del Excel.
   */
  private async loadTiposEspacio(): Promise<TipoEspacioCache[]> {
    const tipos = await this.prisma.tipoEspacio.findMany({
      where: { estado: true },
      select: {
        id: true,
        nombre: true,
        tarifaArriendo: true,
        aniosArriendo: true,
      },
    });
    return tipos.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      tarifaArriendo: Number(t.tarifaArriendo),
      aniosArriendo: t.aniosArriendo,
    }));
  }

  /**
   * Empareja el string de tipo del Excel con un `TipoEspacio` del catálogo.
   * Primero intenta igualdad exacta de nombre (insensible a mayúsculas y
   * acentos); si no, coincidencia por substring en cualquier dirección
   * (p. ej. "nicho doble" → "Nicho"). Devuelve `null` si no hay catálogo o
   * no hay coincidencia, dejando que el caller aplique el fallback legado.
   */
  private matchTipoEspacio(tipo?: string | null): TipoEspacioCache | null {
    if (!this.tiposEspacio.length) return null;
    const objetivo = this.normalizeTipo(tipo);
    if (!objetivo) {
      // Sin tipo en el Excel: usa el primero que parezca "Bóveda".
      return (
        this.tiposEspacio.find(
          (t) => this.normalizeTipo(t.nombre) === 'boveda',
        ) ??
        this.tiposEspacio[0] ??
        null
      );
    }
    const exacto = this.tiposEspacio.find(
      (t) => this.normalizeTipo(t.nombre) === objetivo,
    );
    if (exacto) return exacto;
    return (
      this.tiposEspacio.find((t) => {
        const nombre = this.normalizeTipo(t.nombre);
        return nombre.includes(objetivo) || objetivo.includes(nombre);
      }) ?? null
    );
  }

  /** Normaliza un string de tipo: minúsculas, sin acentos ni espacios extra. */
  private normalizeTipo(value?: string | null): string {
    return (value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim();
  }

  /**
   * Tarifa por tipo (string legado). Usado sólo como fallback cuando la
   * bóveda aún no tiene FK al catálogo durante el backfill aditivo.
   */
  private tarifaPorTipo(tipo?: string | null): number {
    const match = this.matchTipoEspacio(tipo);
    return match?.tarifaArriendo ?? DEFAULT_TARIFA;
  }

  /**
   * Años de arriendo por tipo (string legado). Usado para fijar el número de
   * cuotas; lee el catálogo y cae a `DEFAULT_ANIOS` si no hay coincidencia.
   */
  private aniosPorTipo(tipo?: string | null): number {
    const match = this.matchTipoEspacio(tipo);
    return match?.aniosArriendo ?? DEFAULT_ANIOS;
  }

  private addYears(date: Date, years: number): Date {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
  }

  private isLikelyHeader(row: any[]): boolean {
    const r0 = this.str(row[0]).toLowerCase();
    const r1 = this.str(row[1]).toLowerCase();
    const r2 = this.str(row[2]).toLowerCase();
    const probe = `${r0}|${r1}|${r2}`;
    return (
      probe.includes('id') ||
      probe.includes('numero') ||
      probe.includes('número') ||
      probe.includes('difunto') ||
      probe.includes('tipo')
    );
  }
}
