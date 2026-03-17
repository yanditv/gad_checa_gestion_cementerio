import { Inject, Injectable, Logger } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { AuditService } from '../common/services/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import appConfig from '../config/appConfig';

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

@Injectable()
export class CatastroImportService {
  private readonly logger = new Logger(CatastroImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {}

  async run(adminUserId: string) {
    const enabled = this.config.catastroImport.enabled;
    if (!enabled) {
      this.logger.log('Importación de catastro deshabilitada (CATASTRO_IMPORT_ENABLED != 1)');
      return;
    }

    const configuredPath = this.config.catastroImport.filePath;
    const defaultPath = path.resolve(process.cwd(), '../gad_checa_gestion_cementerio/CATASTRO_FINAL.xlsx');
    const excelPath = configuredPath ? path.resolve(configuredPath) : defaultPath;

    if (!fs.existsSync(excelPath)) {
      this.logger.warn(`Archivo de catastro no encontrado: ${excelPath}`);
      return;
    }

    const force = this.config.catastroImport.force;
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

        await this.createCuotasYPagoInicial(contrato.id, contrato.montoTotal, personaResponsable.id, contrato.fechaInicio);

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

    const createdBlock = await this.prisma.bloque.create({
      data: {
        nombre: nombre.trim(),
        descripcion: `Migrado de catastro: ${nombre.trim()}`,
        estado: true,
        cementerioId: cementerio.id,
      },
    });

    await this.auditService.logCreate('Bloque', createdBlock.id, adminUserId, {
      source: 'catastro-import',
    });

    return createdBlock;
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

    const createdVault = await this.prisma.boveda.create({
      data: {
        numero: numero.trim(),
        capacidad: 1,
        tipo: registro.tipo || 'Boveda',
        estado: true,
        observaciones: registro.observaciones || 'Migrado de catastro',
        precio: 240,
        precioArrendamiento: 240,
        bloqueId,
        pisoId,
      },
    });

    await this.auditService.logCreate('Boveda', createdVault.id, adminUserId, {
      source: 'catastro-import',
    });

    return createdVault;
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

    const createdDeceased = await this.prisma.difunto.create({
      data: {
        nombre,
        apellido,
        numeroIdentificacion: '9999999999',
        fechaDefuncion: registro.fechaContrato ?? new Date(),
        estado: true,
        bovedaId,
      },
    });

    await this.auditService.logCreate('Difunto', createdDeceased.id, adminUserId, {
      source: 'catastro-import',
    });

    return createdDeceased;
  }

  private async upsertPersonaResponsable(registro: RegistroCatastro, adminUserId: string) {
    const representante = registro.representante || 'CONTRIBUYENTE DESCONOCIDO';
    const [nombre, ...resto] = representante.split(/\s+/).filter(Boolean);
    const apellido = resto.join(' ') || '(MIGRACION)';
    const numeroIdentificacion = registro.contacto || this.makeMigrationId(`${nombre} ${apellido}`);

    const existing = await this.prisma.persona.findFirst({
      where: { numeroIdentificacion, tipoPersona: 'Persona' },
    });
    if (existing) return existing;

    const createdPerson = await this.prisma.persona.create({
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
      },
    });

    await this.auditService.logCreate('Persona', createdPerson.id, adminUserId, {
      source: 'catastro-import',
    });

    return createdPerson;
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

    const contrato = await this.prisma.contrato.create({
      data: {
        numeroSecuencial,
        fechaInicio: params.inicio,
        fechaFin: params.fin,
        numeroDeMeses,
        montoTotal: 240,
        estado: true,
        observaciones: params.observaciones,
        bovedaId: params.bovedaId,
        difuntoId: params.difuntoId,
      },
    });

    await this.auditService.logCreate('Contrato', contrato.id, params.adminUserId, {
      source: 'catastro-import',
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

  private async createCuotasYPagoInicial(contratoId: number, montoTotal: any, personaId: number, fechaInicio: Date) {
    const total = Number(montoTotal);
    const cuotaMonto = Number((total / 5).toFixed(2));
    const cuotas = [];

    for (let i = 1; i <= 5; i++) {
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

  private async generateNumeroContrato(bovedaId: number, isRenovacion = false): Promise<string> {
    const year = new Date().getFullYear();
    const boveda = await this.prisma.boveda.findUnique({
      where: { id: bovedaId },
      include: { piso: { include: { bloque: true } } },
    });
    const tipo = (boveda?.tipo || boveda?.piso?.bloque?.nombre || 'Boveda').toLowerCase();

    const basePrefix = tipo.includes('nicho') ? 'NCH' : tipo.includes('tumulo') || tipo.includes('tumul') ? 'TML' : 'CTR';
    const prefix = isRenovacion ? `RNV-${basePrefix}` : basePrefix;

    const lastContrato = await this.prisma.contrato.findFirst({
      where: {
        numeroSecuencial: {
          startsWith: `${prefix}-GADCHECA-${year}-`,
        },
      },
      orderBy: { id: 'desc' },
      select: { numeroSecuencial: true },
    });

    const nextNumber = lastContrato ? Number(lastContrato.numeroSecuencial.split('-').pop() || '0') + 1 : 1;
    return `${prefix}-GADCHECA-${year}-${String(nextNumber).padStart(3, '0')}`;
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
