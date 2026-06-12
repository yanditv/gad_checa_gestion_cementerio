import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';

type RegistroCatastro = {
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
};

/**
 * Tipo de espacio del catálogo cacheado al inicio del run, para resolver
 * tarifa y años de arriendo por nombre (reemplaza las columnas pareadas del
 * cementerio Bóveda/Nicho).
 */
interface TipoEspacioCache {
  id: number;
  nombre: string;
  tarifaArriendo: number;
  aniosArriendo: number;
}

const DEFAULT_TARIFA = 240;
const DEFAULT_ANIOS = 5;

@Injectable()
export class CatastroImportService {
  private readonly logger = new Logger(CatastroImportService.name);
  private tiposEspacio: TipoEspacioCache[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async run(adminUserId: string) {
    const enabled = process.env.CATASTRO_IMPORT_ENABLED === '1';
    if (!enabled) {
      this.logger.log('Importación de catastro deshabilitada (CATASTRO_IMPORT_ENABLED != 1)');
      return;
    }

    const configuredPath = process.env.CATASTRO_FILE_PATH;
    const defaultPath = path.resolve(process.cwd(), '../gad_checa_gestion_cementerio/CATASTRO_FINAL.xlsx');
    const excelPath = configuredPath ? path.resolve(configuredPath) : defaultPath;

    if (!fs.existsSync(excelPath)) {
      this.logger.warn(`Archivo de catastro no encontrado: ${excelPath}`);
      return;
    }

    const force = process.env.CATASTRO_IMPORT_FORCE === '1';
    const contratosCount = await this.prisma.contrato.count();
    if (contratosCount > 0 && !force) {
      this.logger.log(
        `Catastro no importado: ya existen ${contratosCount} contratos. Use CATASTRO_IMPORT_FORCE=1 para forzar.`,
      );
      return;
    }

    if (force) {
      await this.clearExistingData();
    }

    await this.importFromExcel(excelPath, adminUserId);
  }

  private async clearExistingData() {
    this.logger.warn('Forzando limpieza de datos para reimportar catastro...');

    await this.prisma.cuotaPago.deleteMany();
    await this.prisma.pago.deleteMany();
    await this.prisma.cuota.deleteMany();
    await this.prisma.contratoResponsable.deleteMany();
    await this.prisma.contrato.deleteMany();
    await this.prisma.difunto.deleteMany();
    await this.prisma.responsable.deleteMany();

    await this.prisma.boveda.updateMany({
      data: { propietarioId: null },
    });
    await this.prisma.propietario.deleteMany();
    await this.prisma.persona.deleteMany({
      where: { tipoPersona: { in: ['Persona', 'Responsable', 'Propietario'] } },
    });
    await this.prisma.boveda.deleteMany();
    await this.prisma.piso.deleteMany();
    await this.prisma.bloque.deleteMany();
  }

  private async importFromExcel(excelPath: string, adminUserId: string) {
    this.logger.log(`Iniciando importación de catastro desde ${excelPath}`);

    this.tiposEspacio = await this.loadTiposEspacio();
    const workbook = XLSX.readFile(excelPath, { cellDates: true });
    const targetSheets = ['tabla nichos', 'tabla tumulos', 'tabla bovedas', 'nichos', 'tumulos', 'bovedas'];

    let registrosProcesados = 0;
    let contratosCreados = 0;

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
      const sheetNameNormalized = sheetName.toLowerCase().replace(/[_-]/g, ' ').trim();
      const isTargetByHeader = targetSheets.some((name) => normalizedHeader.includes(name));
      const isTargetByName = targetSheets.some((name) => sheetNameNormalized.includes(name));

      if (!isTargetByHeader && !isTargetByName) {
        this.logger.log(`Hoja omitida: ${sheetName}`);
        continue;
      }

      this.logger.log(`Procesando hoja: ${sheetName} (${rows.length} filas)`);

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        if (this.isLikelyHeader(row)) continue;
        const registro = this.extractRegistro(row);

        if (!registro.idExcel && !registro.numeroBovedaRaw) {
          continue;
        }

        const bloque = await this.upsertBloque(registro.bloque, adminUserId);
        const piso = await this.upsertPiso(bloque.id);
        const boveda = await this.upsertBoveda(registro, bloque.id, piso.id, adminUserId);

        const ocupada = Boolean(registro.nombreDifunto) || registro.esPropio || registro.esArrendado;
        if (!ocupada) {
          await this.prisma.boveda.update({
            where: { id: boveda.id },
            data: { estado: true, propietarioId: null },
          });
          registrosProcesados++;
          continue;
        }

        const difunto = await this.upsertDifunto(registro, boveda.id, adminUserId);
        const personaResponsable = await this.upsertPersonaResponsable(registro, adminUserId);
        const propietario = await this.upsertPropietario(personaResponsable.id);
        const responsable = await this.upsertResponsable(personaResponsable.id, propietario.id);

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
          contrato.montoTotal,
          personaResponsable.id,
          contrato.fechaInicio,
          registro.tipo,
        );

        await this.prisma.boveda.update({
          where: { id: boveda.id },
          data: { estado: false, propietarioId: propietario.id },
        });

        contratosCreados++;
        registrosProcesados++;
      }
    }

    this.logger.log(`Importación de catastro completada. Registros: ${registrosProcesados}, contratos: ${contratosCreados}`);
  }

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
    if (!cementerio) throw new Error('No existe cementerio para importar catastro');

    const existing = await this.prisma.bloque.findFirst({
      where: { nombre: nombre.trim(), cementerioId: cementerio.id },
    });
    if (existing) return existing;

    return this.prisma.bloque.create({
      data: {
        nombre: nombre.trim(),
        descripcion: `Migrado de catastro: ${nombre.trim()}`,
        estado: true,
        cementerioId: cementerio.id,
        usuarioCreadorId: adminUserId,
      },
    });
  }

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

  private async upsertBoveda(registro: RegistroCatastro, bloqueId: number, pisoId: number, adminUserId: string) {
    const numero = registro.numeroBovedaRaw || registro.idExcel || `BOV-${Date.now()}`;
    const existing = await this.prisma.boveda.findFirst({
      where: { numero: numero.trim(), bloqueId },
    });
    if (existing) return existing;

    const tipoEspacio = this.matchTipoEspacio(registro.tipo);
    const tarifa = tipoEspacio?.tarifaArriendo ?? DEFAULT_TARIFA;

    return this.prisma.boveda.create({
      data: {
        numero: numero.trim(),
        capacidad: 1,
        // `tipo` (string) se mantiene durante el backfill aditivo; la FK
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
  }

  private async upsertDifunto(registro: RegistroCatastro, bovedaId: number, adminUserId: string) {
    const [nombre, ...resto] = (registro.nombreDifunto || 'DIFUNTO DESCONOCIDO').split(/\s+/).filter(Boolean);
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

  private async upsertPersonaResponsable(registro: RegistroCatastro, adminUserId: string) {
    const representante = registro.representante || 'CONTRIBUYENTE DESCONOCIDO';
    const [nombre, ...resto] = representante.split(/\s+/).filter(Boolean);
    const apellido = resto.join(' ') || '(MIGRACION)';
    const numeroIdentificacion = this.makeMigrationId(`${nombre} ${apellido}`);

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

  private async upsertPropietario(personaId: number) {
    const existing = await this.prisma.propietario.findFirst({ where: { personaId } });
    if (existing) return existing;
    return this.prisma.propietario.create({
      data: { personaId, estado: true },
    });
  }

  private async upsertResponsable(personaId: number, propietarioId: number) {
    const existing = await this.prisma.responsable.findFirst({ where: { personaId } });
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
    const numeroSecuencial = await this.generateNumeroContrato(params.bovedaId, false);
    const numeroDeMeses = Math.max(
      1,
      (params.fin.getFullYear() - params.inicio.getFullYear()) * 12 + (params.fin.getMonth() - params.inicio.getMonth()),
    );

    // La tarifa sale del `TipoEspacio` de la bóveda (catálogo configurable),
    // ya no de un valor hardcodeado. Fallback al string legado durante el
    // backfill y a `DEFAULT_TARIFA` si no hay coincidencia.
    const boveda = await this.prisma.boveda.findUnique({
      where: { id: params.bovedaId },
      select: { tipo: true, tipoEspacio: { select: { tarifaArriendo: true } } },
    });
    const montoTotal = boveda?.tipoEspacio
      ? Number(boveda.tipoEspacio.tarifaArriendo)
      : this.tarifaPorTipo(boveda?.tipo);

    const contrato = await this.prisma.contrato.create({
      data: {
        numeroSecuencial,
        fechaInicio: params.inicio,
        fechaFin: params.fin,
        numeroDeMeses,
        montoTotal,
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

  private async createCuotasYPagoInicial(
    contratoId: number,
    montoTotal: any,
    personaId: number,
    fechaInicio: Date,
    tipoBoveda?: string | null,
  ) {
    const total = Number(montoTotal);
    // El número de cuotas/años sale del `TipoEspacio` (catálogo), ya no de
    // un 5 hardcodeado. Se garantiza al menos 1 cuota.
    const anios = Math.max(1, this.aniosPorTipo(tipoBoveda));
    const cuotaMonto = Number((total / anios).toFixed(2));
    const cuotas = [];

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
      cuotas.push(cuota);
    }

    const pago = await this.prisma.pago.create({
      data: {
        numeroRecibo: `MIGRACION-${contratoId}-${Date.now()}`,
        monto: cuotas.reduce((acc, c) => acc + Number(c.monto), 0),
        fechaPago: new Date(),
        metodoPago: 'Efectivo',
        referencia: `MIGRACION-${personaId}`,
        observacion: 'Pago inicial de migración',
        estado: true,
      },
    });

    await this.prisma.cuotaPago.createMany({
      data: cuotas.map((c) => ({ cuotaId: c.id, pagoId: pago.id })),
    });
  }

  /**
   * Carga el catálogo de tipos de espacio activo (Bóveda, Nicho, Túmulo…).
   * Reemplaza las columnas pareadas del cementerio por filas configurables.
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
   * Empareja el string de tipo del Excel con un `TipoEspacio` del catálogo:
   * igualdad de nombre (insensible a mayúsculas/acentos) y, si falla,
   * coincidencia por substring. Devuelve `null` si no hay catálogo o no hay
   * coincidencia, dejando que el caller aplique el fallback legado.
   */
  private matchTipoEspacio(tipo?: string | null): TipoEspacioCache | null {
    if (!this.tiposEspacio.length) return null;
    const objetivo = this.normalizeTipo(tipo);
    if (!objetivo) {
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

  private normalizeTipo(value?: string | null): string {
    return (value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim();
  }

  /** Tarifa por tipo (fallback de string legado durante el backfill). */
  private tarifaPorTipo(tipo?: string | null): number {
    return this.matchTipoEspacio(tipo)?.tarifaArriendo ?? DEFAULT_TARIFA;
  }

  /** Años de arriendo por tipo (catálogo); cae a `DEFAULT_ANIOS`. */
  private aniosPorTipo(tipo?: string | null): number {
    return this.matchTipoEspacio(tipo)?.aniosArriendo ?? DEFAULT_ANIOS;
  }

  private async generateNumeroContrato(bovedaId: number, isRenovacion = false): Promise<string> {
    const year = new Date().getFullYear();
    const boveda = await this.prisma.boveda.findUnique({
      where: { id: bovedaId },
      include: { piso: { include: { bloque: true } } },
    });
    const tipo = (boveda?.tipo || boveda?.piso?.bloque?.nombre || 'Boveda').toLowerCase();

    const basePrefix = tipo.includes('nicho') ? 'NCH' : tipo.includes('tumulo') || tipo.includes('tumul') ? 'TML' : 'CTR';
    const prefix = isRenovacion ? `RNV-${basePrefix}` : basePrefix;

    const gadInfo = await this.prisma.gADInformacion.findFirst({
      select: { nombre: true },
    });
    const gadName = gadInfo?.nombre || 'GAD CHECA';
    const gadCode = gadName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'GADCHECA';

    const lastContrato = await this.prisma.contrato.findFirst({
      where: {
        AND: [
          { numeroSecuencial: { startsWith: `${prefix}-` } },
          { numeroSecuencial: { contains: `-${year}-` } },
        ],
      },
      orderBy: { id: 'desc' },
      select: { numeroSecuencial: true },
    });

    const nextNumber = lastContrato ? Number(lastContrato.numeroSecuencial.split('-').pop() || '0') + 1 : 1;
    return `${prefix}-${gadCode}-${year}-${String(nextNumber).padStart(3, '0')}`;
  }

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
    return `MIG${Math.abs(hash % 1000000)
      .toString()
      .padStart(6, '0')}`;
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
