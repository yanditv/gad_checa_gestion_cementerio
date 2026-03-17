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
    const contractCount = await this.prisma.contract.count();
    if (contractCount > 0 && !force) {
      this.logger.log(
        `Catastro no importado: ya existen ${contractCount} contratos. Use CATASTRO_IMPORT_FORCE=1 para forzar.`,
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

    await this.prisma.installmentPayment.deleteMany();
    await this.prisma.payment.deleteMany();
    await this.prisma.installment.deleteMany();
    await this.prisma.contractAssignment.deleteMany();
    await this.prisma.contract.deleteMany();
    await this.prisma.deceased.deleteMany();
    await this.prisma.responsibleParty.deleteMany();

    await this.prisma.vault.updateMany({
      data: { ownerId: null },
    });
    await this.prisma.owner.deleteMany();
    await this.prisma.person.deleteMany({
      where: { personType: { in: ['Persona', 'Responsable', 'Propietario'] } },
    });
    await this.prisma.vault.deleteMany();
    await this.prisma.floor.deleteMany();
    await this.prisma.block.deleteMany();
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
          await this.prisma.vault.update({
            where: { id: boveda.id },
            data: { isActive: true, ownerId: null },
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

        await this.createCuotasYPagoInicial(contrato.id, contrato.totalAmount, personaResponsable.id, contrato.startDate);

        await this.prisma.vault.update({
          where: { id: boveda.id },
          data: { isActive: false, ownerId: propietario.id },
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
    const cemetery = await this.prisma.cemetery.findFirst({
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    if (!cemetery) throw new Error('No existe cementerio para importar catastro');

    const existing = await this.prisma.block.findFirst({
      where: { name: nombre.trim(), cemeteryId: cemetery.id },
    });
    if (existing) return existing;

    const createdBlock = await this.prisma.block.create({
      data: {
        name: nombre.trim(),
        description: `Migrado de catastro: ${nombre.trim()}`,
        isActive: true,
        cemeteryId: cemetery.id,
      },
    });

    await this.auditService.log({
      action: 'CREATE',
      entityName: 'Block',
      entityId: createdBlock.id,
      actorId: adminUserId,
      details: {
        source: 'catastro-import',
      },
    });

    return createdBlock;
  }

  private async upsertPiso(blockId: string) {
    const existing = await this.prisma.floor.findFirst({
      where: { blockId, number: 1 },
    });
    if (existing) return existing;

    return this.prisma.floor.create({
      data: {
        blockId,
        number: 1,
        description: 'Migrado',
        isActive: true,
      },
    });
  }

  private async upsertBoveda(registro: RegistroCatastro, blockId: string, floorId: string, adminUserId: string) {
    const numero = registro.numeroBovedaRaw || registro.idExcel || `BOV-${Date.now()}`;
    const existing = await this.prisma.vault.findFirst({
      where: { number: numero.trim(), blockId },
    });
    if (existing) return existing;

    const createdVault = await this.prisma.vault.create({
      data: {
        number: numero.trim(),
        capacity: 1,
        type: registro.tipo || 'Boveda',
        isActive: true,
        notes: registro.observaciones || 'Migrado de catastro',
        price: 240,
        rentalPrice: 240,
        blockId,
        floorId,
      },
    });

    await this.auditService.log({
      action: 'CREATE',
      entityName: 'Vault',
      entityId: createdVault.id,
      actorId: adminUserId,
      details: {
        source: 'catastro-import',
      },
    });

    return createdVault;
  }

  private async upsertDifunto(registro: RegistroCatastro, vaultId: string, adminUserId: string) {
    const [nombre, ...resto] = (registro.nombreDifunto || 'DIFUNTO DESCONOCIDO').split(/\s+/).filter(Boolean);
    const apellido = resto.join(' ') || '(MIGRACION)';
    const existing = await this.prisma.deceased.findFirst({
      where: {
        firstName: { equals: nombre, mode: 'insensitive' },
        lastName: { equals: apellido, mode: 'insensitive' },
      },
    });
    if (existing) return existing;

    const createdDeceased = await this.prisma.deceased.create({
      data: {
        firstName: nombre,
        lastName: apellido,
        identificationNumber: '9999999999',
        deathDate: registro.fechaContrato ?? new Date(),
        isActive: true,
        vaultId,
      },
    });

    await this.auditService.log({
      action: 'CREATE',
      entityName: 'Deceased',
      entityId: createdDeceased.id,
      actorId: adminUserId,
      details: {
        source: 'catastro-import',
      },
    });

    return createdDeceased;
  }

  private async upsertPersonaResponsable(registro: RegistroCatastro, adminUserId: string) {
    const representante = registro.representante || 'CONTRIBUYENTE DESCONOCIDO';
    const [nombre, ...resto] = representante.split(/\s+/).filter(Boolean);
    const apellido = resto.join(' ') || '(MIGRACION)';
    const numeroIdentificacion = registro.contacto || this.makeMigrationId(`${nombre} ${apellido}`);

    const existing = await this.prisma.person.findFirst({
      where: { identificationNumber: numeroIdentificacion, personType: 'Persona' },
    });
    if (existing) return existing;

    const createdPerson = await this.prisma.person.create({
      data: {
        identificationNumber: numeroIdentificacion,
        firstName: nombre || 'SIN',
        lastName: apellido || 'NOMBRE',
        phone: registro.contacto || null,
        email: registro.correo || `${numeroIdentificacion}@migracion.local`,
        address: 'CEMENTERIO',
        identificationType: 'CED',
        isActive: true,
        personType: 'Persona',
      },
    });

    await this.auditService.log({
      action: 'CREATE',
      entityName: 'Person',
      entityId: createdPerson.id,
      actorId: adminUserId,
      details: {
        source: 'catastro-import',
      },
    });

    return createdPerson;
  }

  private async upsertPropietario(personId: string) {
    const existing = await this.prisma.owner.findFirst({ where: { personId } });
    if (existing) return existing;
    return this.prisma.owner.create({
      data: { personId, isActive: true },
    });
  }

  private async upsertResponsable(personId: string, ownerId: string) {
    const existing = await this.prisma.responsibleParty.findFirst({ where: { personId } });
    if (existing) return existing;
    return this.prisma.responsibleParty.create({
      data: {
        personId,
        ownerId,
        relationship: 'Representante',
        isActive: true,
      },
    });
  }

  private async createContrato(params: {
    bovedaId: string;
    difuntoId: string;
    responsableId: string;
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

    const contrato = await this.prisma.contract.create({
      data: {
        sequentialNumber: numeroSecuencial,
        startDate: params.inicio,
        endDate: params.fin,
        monthCount: numeroDeMeses,
        totalAmount: 240,
        isActive: true,
        notes: params.observaciones,
        vaultId: params.bovedaId,
        deceasedId: params.difuntoId,
      },
    });

    await this.auditService.log({
      action: 'CREATE',
      entityName: 'Contract',
      entityId: contrato.id,
      actorId: params.adminUserId,
      details: {
        source: 'catastro-import',
      },
    });

    await this.prisma.contractAssignment.upsert({
      where: {
        contractId_responsiblePartyId: {
          contractId: contrato.id,
          responsiblePartyId: params.responsableId,
        },
      },
      update: {},
      create: {
        contractId: contrato.id,
        responsiblePartyId: params.responsableId,
      },
    });

    return contrato;
  }

  private async createCuotasYPagoInicial(contractId: string, montoTotal: any, personId: string, fechaInicio: Date) {
    const total = Number(montoTotal);
    const cuotaMonto = Number((total / 5).toFixed(2));
    const cuotas = [];

    for (let i = 1; i <= 5; i++) {
      const cuota = await this.prisma.installment.create({
        data: {
          contractId,
          number: i,
          amount: cuotaMonto,
          dueDate: this.addYears(fechaInicio, i),
          paidAt: new Date(),
          interestAmount: 0,
          isActive: true,
        },
      });
      cuotas.push(cuota);
    }

    const pago = await this.prisma.payment.create({
      data: {
        receiptNumber: `MIGRACION-${contractId}-${Date.now()}`,
        amount: cuotas.reduce((acc, c) => acc + Number(c.amount), 0),
        paidAt: new Date(),
        paymentMethod: 'Efectivo',
        reference: `MIGRACION-${personId}`,
        note: 'Pago inicial de migración',
        isActive: true,
      },
    });

    await this.prisma.installmentPayment.createMany({
      data: cuotas.map((c) => ({ installmentId: c.id, paymentId: pago.id })),
    });
  }

  private async generateNumeroContrato(bovedaId: string, isRenovacion = false): Promise<string> {
    const year = new Date().getFullYear();
    const boveda = await this.prisma.vault.findUnique({
      where: { id: bovedaId },
      include: { floor: { include: { block: true } } },
    });
    const tipo = (boveda?.type || boveda?.floor?.block?.name || 'Boveda').toLowerCase();

    const basePrefix = tipo.includes('nicho') ? 'NCH' : tipo.includes('tumulo') || tipo.includes('tumul') ? 'TML' : 'CTR';
    const prefix = isRenovacion ? `RNV-${basePrefix}` : basePrefix;

    const lastContrato = await this.prisma.contract.findFirst({
      where: {
        sequentialNumber: {
          startsWith: `${prefix}-GADCHECA-${year}-`,
        },
      },
      orderBy: { id: 'desc' },
      select: { sequentialNumber: true },
    });

    const nextNumber = lastContrato ? Number(lastContrato.sequentialNumber.split('-').pop() || '0') + 1 : 1;
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
