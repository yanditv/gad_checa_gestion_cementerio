import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';
import {
  CreateContratoSimpleDto,
  CreateContratoWizardDto,
  PlanCuota,
} from './dto/create-contrato.dto';
import { RenovarContratoDto } from './dto/renovar-contrato.dto';
import { RelacionarContratosDto } from './dto/relacionar-contratos.dto';
import { UpdateContratoDto } from './dto/request/update-contrato.dto';

type Tx = Prisma.TransactionClient;

interface CuotaPlanRow {
  numero: number;
  monto: number;
  fechaVencimiento: Date;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const desiredMonth = d.getMonth() + months;
  d.setMonth(desiredMonth);
  return d;
}

@Injectable()
export class ContratoService {
  constructor(private prisma: PrismaService) {}

  async getCreateMetadata() {
    const [descuentos, bancos] = await this.prisma.$transaction([
      this.prisma.descuento.findMany({
        where: { estado: true },
        orderBy: { porcentaje: 'desc' },
      }),
      this.prisma.banco.findMany({
        where: { estado: true },
        orderBy: { nombre: 'asc' },
      }),
    ]);

    return {
      descuentos,
      bancos,
      tiposPago: ['Efectivo', 'Transferencia', 'Banco'],
      numeroDeMesesDefault: 5,
    };
  }

  async getBovedasDisponibles(query: PaginationQueryDto, tipo?: string) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim();
    const today = new Date();

    const where: any = {
      estado: true,
      contratos: {
        none: {
          estado: true,
          OR: [{ fechaFin: null }, { fechaFin: { gte: today } }],
        },
      },
      ...(tipo ? { tipo: { equals: tipo, mode: 'insensitive' } } : {}),
      ...(search
        ? {
            OR: [
              { numero: { contains: search, mode: 'insensitive' } },
              { tipo: { contains: search, mode: 'insensitive' } },
              { bloque: { is: { nombre: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.boveda.findMany({
        where,
        include: {
          bloque: { include: { cementerio: true } },
          piso: true,
          propietario: { include: { persona: true } },
        },
        orderBy: [{ numero: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.boveda.count({ where }),
    ]);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getNumeroSecuencialPreview(bovedaId?: number, isRenovacion = false) {
    const numeroSecuencial = await this.previewNumeroContrato(bovedaId, isRenovacion);
    const boveda = bovedaId
      ? await this.prisma.boveda.findUnique({ where: { id: Number(bovedaId) } })
      : null;

    return {
      numeroSecuencial,
      montoTotal: boveda ? Number(boveda.precioArrendamiento) : 0,
      boveda,
    };
  }

  async findAll(query: PaginationQueryDto & { estado?: string }) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim();

    // Filtro por estado — paridad legado ContratosController.cs:86-105
    //   activos    : estado=true && fechaFin >= hoy (o sin fecha fin)
    //   porvencer  : estado=true && fechaFin entre hoy y hoy+30d
    //   vencidos   : estado=true && fechaFin < hoy
    //   inactivos  : estado=false
    //   (vacío)    : todos los estado=true
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const en30dias = new Date(today);
    en30dias.setDate(en30dias.getDate() + 30);

    const filtroEstado: any = (() => {
      switch ((query.estado ?? '').toLowerCase()) {
        case 'activos':
          return {
            estado: true,
            OR: [{ fechaFin: null }, { fechaFin: { gte: today } }],
          };
        case 'porvencer':
          return {
            estado: true,
            fechaFin: { gte: today, lte: en30dias },
          };
        case 'vencidos':
          return {
            estado: true,
            fechaFin: { lt: today },
          };
        case 'inactivos':
          return { estado: false };
        default:
          return { estado: true };
      }
    })();

    // Búsqueda multi-palabra — paridad legado: cada palabra debe coincidir
    // contra al menos uno de los campos (AND palabra a palabra, OR campo a campo).
    const palabras = search ? search.split(/\s+/).filter(Boolean) : [];
    const filtroBusqueda =
      palabras.length > 0
        ? {
            AND: palabras.map((palabra) => ({
              OR: [
                { numeroSecuencial: { contains: palabra, mode: 'insensitive' } },
                { difunto: { is: { nombre: { contains: palabra, mode: 'insensitive' } } } },
                { difunto: { is: { apellido: { contains: palabra, mode: 'insensitive' } } } },
                {
                  difunto: {
                    is: {
                      numeroIdentificacion: {
                        contains: palabra,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
                { boveda: { is: { numero: { contains: palabra, mode: 'insensitive' } } } },
              ],
            })),
          }
        : {};

    const where: any = { ...filtroEstado, ...filtroBusqueda };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contrato.findMany({
        where,
        include: {
          boveda: {
            include: {
              bloque: { include: { cementerio: true } },
              piso: true,
              propietario: { include: { persona: true } },
            },
          },
          difunto: true,
          responsables: {
            include: { responsable: { include: { persona: true } } },
          },
          cuotas: { where: { estado: true } },
        },
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.contrato.count({ where }),
    ]);

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: number) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id },
      include: {
        boveda: {
          include: {
            bloque: { include: { cementerio: true } },
            piso: true,
            propietario: { include: { persona: true } },
          },
        },
        difunto: true,
        responsables: {
          include: {
            responsable: { include: { persona: true, propietario: true } },
          },
        },
        cuotas: {
          include: { pagos: { include: { pago: { include: { banco: true } } } } },
          orderBy: { numero: 'asc' },
        },
        descuento: true,
        // Renovaciones encadenadas: contrato del que se deriva y los que se derivan de éste.
        contratoOrigen: {
          select: {
            id: true,
            numeroSecuencial: true,
            fechaInicio: true,
            fechaFin: true,
          },
        },
        contratosHijos: {
          where: { estado: true },
          select: {
            id: true,
            numeroSecuencial: true,
            fechaInicio: true,
            fechaFin: true,
          },
          orderBy: { fechaInicio: 'asc' },
        },
        contratoRelacionado: {
          select: {
            id: true,
            numeroSecuencial: true,
            difunto: { select: { nombre: true, apellido: true } },
          },
        },
      },
    });
    if (!contrato) throw new NotFoundException('Contrato no encontrado');
    return contrato;
  }

  /**
   * Entry point del controller. Acepta dos shapes:
   *   - Wizard completo (`contrato + difunto + responsables + pago`).
   *   - Simple (campos del contrato + responsablesIds).
   * El controller pasa `any` porque la validación de DTO ocurre aquí
   * según el shape detectado (class-validator no soporta polimorfismo).
   */
  async create(data: any, userId?: string) {
    if (data?.contrato && data?.difunto && data?.responsables && data?.pago) {
      return this.createWizard(data as CreateContratoWizardDto, userId);
    }
    return this.createSimple(data as CreateContratoSimpleDto, userId);
  }

  private async createSimple(data: CreateContratoSimpleDto, userId?: string) {
    const { responsablesIds, ...contratoData } = data;

    return this.prisma.$transaction(async (tx) => {
      const numeroSecuencial = await this.generateNumeroContratoAtomic(
        tx,
        contratoData.bovedaId,
        false,
      );

      return tx.contrato.create({
        data: {
          ...contratoData,
          fechaInicio: new Date(contratoData.fechaInicio),
          numeroSecuencial,
          usuarioCreadorId: userId ?? null,
          responsables: responsablesIds?.length
            ? {
                create: responsablesIds.map((id) => ({ responsableId: id })),
              }
            : undefined,
        },
        include: {
          responsables: {
            include: { responsable: { include: { persona: true } } },
          },
        },
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Numeración secuencial
  //
  // El legado calcula el siguiente número con `max(numero) + 1`, lo que crea
  // race conditions si dos operadores guardan un contrato a la vez. Aquí
  // serializamos el cálculo con `pg_advisory_xact_lock` dentro de la
  // transacción del create, de modo que el lock se libera automáticamente
  // al commit/rollback.
  //
  //   preview*  → fuera de transacción; usado solo para mostrar el número
  //               en la UI antes de guardar. Puede quedar desactualizado
  //               si entre el preview y el guardado se creó otro contrato.
  //   atomic*   → dentro de transacción; garantiza unicidad.
  // ---------------------------------------------------------------------------

  private async resolveNumberPrefix(
    bovedaId?: number,
    isRenovacion = false,
  ): Promise<{ prefix: string; year: number; pattern: string }> {
    const year = new Date().getFullYear();
    const boveda = bovedaId
      ? await this.prisma.boveda.findUnique({
          where: { id: Number(bovedaId) },
          include: { piso: { include: { bloque: true } } },
        })
      : null;

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

    return { prefix, year, pattern: `${prefix}-GADCHECA-${year}-` };
  }

  /** Hash determinista a int32 para clave de advisory lock. */
  private advisoryLockKey(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    return hash;
  }

  private async previewNumeroContrato(
    bovedaId?: number,
    isRenovacion = false,
  ): Promise<string> {
    const { prefix, year, pattern } = await this.resolveNumberPrefix(
      bovedaId,
      isRenovacion,
    );

    const last = await this.prisma.contrato.findFirst({
      where: { numeroSecuencial: { startsWith: pattern } },
      orderBy: { numeroSecuencial: 'desc' },
      select: { numeroSecuencial: true },
    });

    const nextNumber = last
      ? Number(last.numeroSecuencial.split('-').pop() || '0') + 1
      : 1;
    return `${prefix}-GADCHECA-${year}-${String(nextNumber).padStart(3, '0')}`;
  }

  private async generateNumeroContratoAtomic(
    tx: Tx,
    bovedaId?: number,
    isRenovacion = false,
  ): Promise<string> {
    const { prefix, year, pattern } = await this.resolveNumberPrefix(
      bovedaId,
      isRenovacion,
    );

    const lockKey = this.advisoryLockKey(`contrato:${prefix}:${year}`);
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${lockKey})`);

    const last = await tx.contrato.findFirst({
      where: { numeroSecuencial: { startsWith: pattern } },
      orderBy: { numeroSecuencial: 'desc' },
      select: { numeroSecuencial: true },
    });

    const nextNumber = last
      ? Number(last.numeroSecuencial.split('-').pop() || '0') + 1
      : 1;
    return `${prefix}-GADCHECA-${year}-${String(nextNumber).padStart(3, '0')}`;
  }

  /**
   * Crea el contrato completo (wizard de 5 pasos) en una sola transacción:
   *
   *   1. Valida bóveda disponible (sin contrato vigente que la ocupe, salvo
   *      contratoRelacionado explícito).
   *   2. Valida fechas del difunto (nacimiento < defunción).
   *   3. Si es renovación, valida que el contrato origen no haya superado el
   *      máximo de renovaciones configurado en `Cementerio.vecesRenovacion*`.
   *   4. Calcula subtotal/descuento/total server-side a partir de la bóveda
   *      y el descuento elegido — el cliente NO controla el monto.
   *   5. Genera N cuotas según el plan elegido.
   *   6. Persiste difunto, responsables (existentes o nuevos), contrato,
   *      cuotas, y opcionalmente el pago inicial cubriendo las cuotas
   *      marcadas como pagadas.
   *   7. Numera contrato y recibo con advisory locks (atómico bajo concurrencia).
   */
  private async createWizard(dto: CreateContratoWizardDto, userId?: string) {
    const { contrato, difunto, responsables, pago } = dto;

    // -- Validaciones de dominio (no dependen de la transacción).
    if (responsables.length === 0) {
      throw new BadRequestException('Debe registrar al menos un responsable');
    }

    if (difunto.fechaNacimiento && difunto.fechaFallecimiento) {
      const nac = new Date(difunto.fechaNacimiento);
      const def = new Date(difunto.fechaFallecimiento);
      if (def < nac) {
        throw new UnprocessableEntityException(
          'La fecha de fallecimiento no puede ser anterior a la fecha de nacimiento',
        );
      }
    }

    const boveda = await this.prisma.boveda.findUnique({
      where: { id: Number(contrato.bovedaId) },
      include: { bloque: { include: { cementerio: true } } },
    });
    if (!boveda || !boveda.estado) {
      throw new BadRequestException('La bóveda seleccionada no existe o está inactiva');
    }

    // Sólo se permite reutilizar bóveda si esta nueva contrato apunta a un
    // contratoRelacionado explícito o si es una renovación.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const conflictos = await this.prisma.contrato.count({
      where: {
        bovedaId: boveda.id,
        estado: true,
        OR: [{ fechaFin: null }, { fechaFin: { gte: today } }],
      },
    });
    if (
      conflictos > 0 &&
      !contrato.contratoRelacionadoId &&
      !contrato.esRenovacion
    ) {
      throw new ConflictException(
        'La bóveda ya tiene un contrato vigente. Use "renovar" o "relacionar contratos" si corresponde.',
      );
    }

    // Validación de renovación contra el cementerio.
    if (contrato.esRenovacion && contrato.contratoOrigenId) {
      const origen = await this.prisma.contrato.findUnique({
        where: { id: contrato.contratoOrigenId },
        select: { vecesRenovado: true },
      });
      if (!origen) {
        throw new BadRequestException('El contrato origen no existe');
      }
      const cementerio = boveda.bloque.cementerio;
      const maxRenovaciones =
        (boveda.tipo || '').toLowerCase().includes('nicho')
          ? cementerio.vecesRenovacionNicho
          : cementerio.vecesRenovacionBovedas;
      if (origen.vecesRenovado + 1 > maxRenovaciones) {
        throw new UnprocessableEntityException(
          `El contrato no puede renovarse más de ${maxRenovaciones} vez(ces) (límite del cementerio).`,
        );
      }
    }

    // -- Cálculo de montos server-side: el subtotal es el precio de
    // arrendamiento de la bóveda. El cliente no puede manipularlo.
    const montoSubtotal = Number(boveda.precioArrendamiento);
    let descuentoPorcentaje = 0;
    if (contrato.descuentoId) {
      const descuento = await this.prisma.descuento.findUnique({
        where: { id: contrato.descuentoId },
      });
      if (!descuento || !descuento.estado) {
        throw new BadRequestException(
          'El descuento seleccionado no existe o está inactivo',
        );
      }
      descuentoPorcentaje = Number(descuento.porcentaje);
    }
    const montoDescuento = round2(
      montoSubtotal * (descuentoPorcentaje / 100),
    );
    const montoTotal = round2(montoSubtotal - montoDescuento);

    // -- Generación de cuotas según el plan.
    const fechaInicio = new Date(contrato.fechaInicio);
    const fechaFin = addYears(fechaInicio, contrato.numeroDeMeses);
    const cuotasPlan = this.generarCuotasPlan(
      pago.plan,
      fechaInicio,
      contrato.numeroDeMeses,
      montoTotal,
    );

    // Validar que cuotasSeleccionadas sean un subconjunto válido.
    const numerosValidos = new Set(cuotasPlan.map((c) => c.numero));
    const seleccionadas = (pago.cuotasSeleccionadas ?? []).filter((n) =>
      numerosValidos.has(n),
    );

    // -- Persistencia transaccional.
    return this.prisma.$transaction(async (tx) => {
      const numeroSecuencial = await this.generateNumeroContratoAtomic(
        tx,
        boveda.id,
        !!contrato.esRenovacion,
      );

      const difuntoCreado = await tx.difunto.create({
        data: {
          nombre: difunto.nombres,
          apellido: difunto.apellidos,
          numeroIdentificacion: difunto.numeroIdentificacion || null,
          fechaNacimiento: difunto.fechaNacimiento
            ? new Date(difunto.fechaNacimiento)
            : null,
          fechaDefuncion: difunto.fechaFallecimiento
            ? new Date(difunto.fechaFallecimiento)
            : null,
          bovedaId: boveda.id,
          estado: true,
          usuarioCreadorId: userId ?? null,
        },
      });

      const responsablesIds: number[] = [];
      for (const item of responsables) {
        if (item.esExistente && item.id) {
          let responsable = await tx.responsable.findFirst({
            where: { personaId: item.id },
          });
          if (!responsable) {
            responsable = await tx.responsable.create({
              data: {
                personaId: item.id,
                parentesco: item.parentesco || null,
                estado: true,
              },
            });
          }
          responsablesIds.push(responsable.id);
          continue;
        }

        if (!item.nombres || !item.apellidos || !item.numeroIdentificacion) {
          throw new BadRequestException(
            'Los responsables nuevos requieren nombres, apellidos e identificación',
          );
        }

        const persona = await tx.persona.create({
          data: {
            nombre: item.nombres,
            apellido: item.apellidos,
            numeroIdentificacion: item.numeroIdentificacion,
            tipoIdentificacion: item.tipoIdentificacion || 'CED',
            telefono: item.telefono || null,
            email: item.email || null,
            direccion: item.direccion || null,
            tipoPersona: 'Responsable',
            estado: true,
            usuarioCreadorId: userId ?? null,
          },
        });
        const responsable = await tx.responsable.create({
          data: {
            personaId: persona.id,
            parentesco: item.parentesco || null,
            estado: true,
          },
        });
        responsablesIds.push(responsable.id);
      }

      const contratoCreado = await tx.contrato.create({
        data: {
          numeroSecuencial,
          fechaInicio,
          fechaFin,
          numeroDeMeses: contrato.numeroDeMeses,
          montoSubtotal: new Prisma.Decimal(montoSubtotal),
          montoDescuento: new Prisma.Decimal(montoDescuento),
          montoTotal: new Prisma.Decimal(montoTotal),
          observaciones: contrato.observaciones || null,
          estado: true,
          esRenovacion: !!contrato.esRenovacion,
          vecesRenovado: 0,
          descuentoId: contrato.descuentoId ?? null,
          contratoOrigenId: contrato.contratoOrigenId ?? null,
          contratoRelacionadoId: contrato.contratoRelacionadoId ?? null,
          bovedaId: boveda.id,
          difuntoId: difuntoCreado.id,
          usuarioCreadorId: userId ?? null,
          responsables: {
            create: responsablesIds.map((id) => ({ responsableId: id })),
          },
        },
      });

      // Si es renovación, incrementar contador del contrato origen.
      if (contrato.esRenovacion && contrato.contratoOrigenId) {
        await tx.contrato.update({
          where: { id: contrato.contratoOrigenId },
          data: { vecesRenovado: { increment: 1 } },
        });
      }

      if (cuotasPlan.length > 0) {
        await tx.cuota.createMany({
          data: cuotasPlan.map((c) => ({
            numero: c.numero,
            monto: new Prisma.Decimal(c.monto),
            fechaVencimiento: c.fechaVencimiento,
            contratoId: contratoCreado.id,
            estado: true,
          })),
        });
      }

      // Pago inicial si hay cuotas seleccionadas.
      if (seleccionadas.length > 0) {
        const cuotasCreadas = await tx.cuota.findMany({
          where: {
            contratoId: contratoCreado.id,
            numero: { in: seleccionadas },
          },
        });
        const montoPago = cuotasCreadas.reduce(
          (sum, c) => sum + Number(c.monto),
          0,
        );

        const pagoSubtotal = descuentoPorcentaje > 0
          ? round2(montoSubtotal * (seleccionadas.length / cuotasPlan.length))
          : round2(montoPago);
        const pagoDescuento = descuentoPorcentaje > 0
          ? round2(pagoSubtotal - montoPago)
          : 0;

        const numeroRecibo = await this.generateNumeroReciboAtomic(tx);
        const fechaPago = pago.fechaPago ? new Date(pago.fechaPago) : new Date();
        const pagoCreado = await tx.pago.create({
          data: {
            numeroRecibo,
            monto: new Prisma.Decimal(round2(montoPago)),
            montoSubtotal: new Prisma.Decimal(pagoSubtotal),
            montoDescuento: new Prisma.Decimal(pagoDescuento),
            fechaPago,
            metodoPago: pago.tipoPago,
            referencia: pago.numeroComprobante || null,
            observacion: pago.observacion || null,
            bancoId: pago.bancoId ?? null,
            descuentoId: contrato.descuentoId ?? null,
            estado: true,
            usuarioCreadorId: userId ?? null,
          },
        });

        await tx.cuotaPago.createMany({
          data: cuotasCreadas.map((c) => ({
            cuotaId: c.id,
            pagoId: pagoCreado.id,
          })),
        });
        await tx.cuota.updateMany({
          where: { id: { in: cuotasCreadas.map((c) => c.id) } },
          data: { pagada: true, fechaPago },
        });
      }

      return tx.contrato.findUnique({
        where: { id: contratoCreado.id },
        include: {
          boveda: { include: { bloque: true, piso: true } },
          difunto: true,
          responsables: {
            include: { responsable: { include: { persona: true } } },
          },
          cuotas: {
            orderBy: { numero: 'asc' },
            include: { pagos: { include: { pago: true } } },
          },
        },
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Distribuye `montoTotal` en cuotas según el plan elegido. Todas las cuotas
   * tienen el mismo monto excepto la última, que absorbe el redondeo para
   * que la suma cierre exactamente al total.
   */
  private generarCuotasPlan(
    plan: PlanCuota,
    fechaInicio: Date,
    years: number,
    montoTotal: number,
  ): CuotaPlanRow[] {
    if (years <= 0 || montoTotal <= 0) return [];

    if (plan === 'unico') {
      return [
        {
          numero: 1,
          monto: round2(montoTotal),
          fechaVencimiento: fechaInicio,
        },
      ];
    }

    const totalCuotas =
      plan === 'mensual'
        ? years * 12
        : plan === 'trimestral'
          ? years * 4
          : plan === 'semestral'
            ? years * 2
            : years; // anual

    const mesesEntreCuotas =
      plan === 'mensual'
        ? 1
        : plan === 'trimestral'
          ? 3
          : plan === 'semestral'
            ? 6
            : 12;

    const cuotaBase = round2(montoTotal / totalCuotas);
    const cuotas: CuotaPlanRow[] = [];
    let acumulado = 0;
    for (let i = 0; i < totalCuotas; i++) {
      const isUltima = i === totalCuotas - 1;
      const monto = isUltima ? round2(montoTotal - acumulado) : cuotaBase;
      acumulado += monto;
      const venc = addMonths(fechaInicio, (i + 1) * mesesEntreCuotas);
      cuotas.push({ numero: i + 1, monto, fechaVencimiento: venc });
    }
    return cuotas;
  }

  private async generateNumeroReciboAtomic(tx: Tx): Promise<string> {
    const year = new Date().getFullYear();
    const pattern = `REC-${year}-`;
    const lockKey = this.advisoryLockKey(`recibo:${year}`);
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${lockKey})`);

    const last = await tx.pago.findFirst({
      where: { numeroRecibo: { startsWith: pattern } },
      orderBy: { numeroRecibo: 'desc' },
      select: { numeroRecibo: true },
    });
    const next = last
      ? Number(last.numeroRecibo.split('-').pop() || '0') + 1
      : 1;
    return `${pattern}${String(next).padStart(5, '0')}`;
  }

  // ---------------------------------------------------------------------------
  // Renovación
  // ---------------------------------------------------------------------------

  /**
   * Crea una renovación a partir de un contrato origen. Hereda bóveda y
   * difunto del origen, valida límite de renovaciones del cementerio,
   * y aplica las mismas reglas de cálculo de montos y plan de cuotas que
   * `createWizard`. La validación de unicidad de bóveda no aplica (sí hay
   * un contrato vigente — es el que estamos renovando).
   *
   *   incrementa origen.vecesRenovado
   *   nuevo.contratoOrigenId = origen.id
   *   nuevo.esRenovacion = true
   */
  async renovar(origenId: number, dto: RenovarContratoDto, userId?: string) {
    const origen = await this.prisma.contrato.findUnique({
      where: { id: origenId },
      include: {
        boveda: { include: { bloque: { include: { cementerio: true } } } },
        difunto: true,
        responsables: { select: { responsable: { select: { personaId: true } } } },
      },
    });
    if (!origen || !origen.estado) {
      throw new NotFoundException(
        'El contrato a renovar no existe o está inactivo',
      );
    }

    const cementerio = origen.boveda.bloque.cementerio;
    const maxRenovaciones = (origen.boveda.tipo || '')
      .toLowerCase()
      .includes('nicho')
      ? cementerio.vecesRenovacionNicho
      : cementerio.vecesRenovacionBovedas;
    if (origen.vecesRenovado + 1 > maxRenovaciones) {
      throw new UnprocessableEntityException(
        `Este contrato ya alcanzó el máximo de ${maxRenovaciones} renovación(es) permitido por el cementerio.`,
      );
    }

    // Cálculo de montos server-side.
    const montoSubtotal = Number(origen.boveda.precioArrendamiento);
    let descuentoPorcentaje = 0;
    if (dto.descuentoId) {
      const descuento = await this.prisma.descuento.findUnique({
        where: { id: dto.descuentoId },
      });
      if (!descuento || !descuento.estado) {
        throw new BadRequestException(
          'El descuento seleccionado no existe o está inactivo',
        );
      }
      descuentoPorcentaje = Number(descuento.porcentaje);
    }
    const montoDescuento = round2(
      montoSubtotal * (descuentoPorcentaje / 100),
    );
    const montoTotal = round2(montoSubtotal - montoDescuento);

    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFin = addYears(fechaInicio, dto.numeroDeMeses);
    const cuotasPlan = this.generarCuotasPlan(
      dto.pago.plan,
      fechaInicio,
      dto.numeroDeMeses,
      montoTotal,
    );
    const numerosValidos = new Set(cuotasPlan.map((c) => c.numero));
    const seleccionadas = (dto.pago.cuotasSeleccionadas ?? []).filter((n) =>
      numerosValidos.has(n),
    );

    // Resolver IDs de Responsable a vincular.
    return this.prisma.$transaction(async (tx) => {
      const numeroSecuencial = await this.generateNumeroContratoAtomic(
        tx,
        origen.boveda.id,
        true,
      );

      const responsableIds: number[] = [];
      const personaIds =
        dto.responsablesPersonaIds && dto.responsablesPersonaIds.length > 0
          ? dto.responsablesPersonaIds
          : origen.responsables.map((r) => r.responsable.personaId);

      if (personaIds.length === 0) {
        throw new BadRequestException(
          'El contrato debe tener al menos un responsable',
        );
      }

      for (const personaId of personaIds) {
        let responsable = await tx.responsable.findFirst({
          where: { personaId },
        });
        if (!responsable) {
          responsable = await tx.responsable.create({
            data: { personaId, estado: true },
          });
        }
        responsableIds.push(responsable.id);
      }

      const nuevo = await tx.contrato.create({
        data: {
          numeroSecuencial,
          fechaInicio,
          fechaFin,
          numeroDeMeses: dto.numeroDeMeses,
          montoSubtotal: new Prisma.Decimal(montoSubtotal),
          montoDescuento: new Prisma.Decimal(montoDescuento),
          montoTotal: new Prisma.Decimal(montoTotal),
          observaciones: dto.observaciones || null,
          estado: true,
          esRenovacion: true,
          vecesRenovado: 0,
          descuentoId: dto.descuentoId ?? null,
          contratoOrigenId: origen.id,
          bovedaId: origen.boveda.id,
          difuntoId: origen.difuntoId,
          usuarioCreadorId: userId ?? null,
          responsables: {
            create: responsableIds.map((id) => ({ responsableId: id })),
          },
        },
      });

      await tx.contrato.update({
        where: { id: origen.id },
        data: { vecesRenovado: { increment: 1 } },
      });

      if (cuotasPlan.length > 0) {
        await tx.cuota.createMany({
          data: cuotasPlan.map((c) => ({
            numero: c.numero,
            monto: new Prisma.Decimal(c.monto),
            fechaVencimiento: c.fechaVencimiento,
            contratoId: nuevo.id,
            estado: true,
          })),
        });
      }

      if (seleccionadas.length > 0) {
        const cuotasCreadas = await tx.cuota.findMany({
          where: { contratoId: nuevo.id, numero: { in: seleccionadas } },
        });
        const montoPago = cuotasCreadas.reduce(
          (sum, c) => sum + Number(c.monto),
          0,
        );

        const pagoSubtotal = descuentoPorcentaje > 0
          ? round2(montoSubtotal * (seleccionadas.length / cuotasPlan.length))
          : round2(montoPago);
        const pagoDescuento = descuentoPorcentaje > 0
          ? round2(pagoSubtotal - montoPago)
          : 0;

        const numeroRecibo = await this.generateNumeroReciboAtomic(tx);
        const fechaPago = dto.pago.fechaPago
          ? new Date(dto.pago.fechaPago)
          : new Date();
        const pagoCreado = await tx.pago.create({
          data: {
            numeroRecibo,
            monto: new Prisma.Decimal(round2(montoPago)),
            montoSubtotal: new Prisma.Decimal(pagoSubtotal),
            montoDescuento: new Prisma.Decimal(pagoDescuento),
            fechaPago,
            metodoPago: dto.pago.tipoPago,
            referencia: dto.pago.numeroComprobante || null,
            observacion: dto.pago.observacion || null,
            bancoId: dto.pago.bancoId ?? null,
            descuentoId: dto.descuentoId ?? null,
            estado: true,
            usuarioCreadorId: userId ?? null,
          },
        });
        await tx.cuotaPago.createMany({
          data: cuotasCreadas.map((c) => ({
            cuotaId: c.id,
            pagoId: pagoCreado.id,
          })),
        });
        await tx.cuota.updateMany({
          where: { id: { in: cuotasCreadas.map((c) => c.id) } },
          data: { pagada: true, fechaPago },
        });
      }

      return tx.contrato.findUnique({
        where: { id: nuevo.id },
        include: {
          boveda: { include: { bloque: true, piso: true } },
          difunto: true,
          responsables: {
            include: { responsable: { include: { persona: true } } },
          },
          cuotas: {
            orderBy: { numero: 'asc' },
            include: { pagos: { include: { pago: true } } },
          },
          contratoOrigen: {
            select: { id: true, numeroSecuencial: true },
          },
        },
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Relación lateral entre contratos (bóveda compartida con difuntos distintos)
  // ---------------------------------------------------------------------------

  /**
   * Vincula dos contratos que comparten la misma bóveda. Caso típico: dos
   * personas inhumadas juntas en la misma bóveda — cada una tiene su propio
   * contrato y se relacionan para reflejar el vínculo histórico.
   *
   * Reglas:
   *   - Ambos contratos deben existir, estar activos y vigentes.
   *   - Deben referir a la misma bóveda.
   *   - Deben tener difuntos distintos (no se relaciona consigo mismo ni
   *     dos contratos del mismo difunto).
   *   - Ninguno puede estar ya relacionado con un tercero.
   *   - Si ya están relacionados entre sí, la operación es idempotente.
   */
  async relacionar(idA: number, dto: RelacionarContratosDto, userId?: string) {
    const idB = dto.contratoIdB;
    if (idA === idB) {
      throw new BadRequestException('Un contrato no puede relacionarse consigo mismo');
    }

    const [a, b] = await Promise.all([
      this.prisma.contrato.findUnique({
        where: { id: idA },
        select: {
          id: true,
          estado: true,
          bovedaId: true,
          difuntoId: true,
          contratoRelacionadoId: true,
        },
      }),
      this.prisma.contrato.findUnique({
        where: { id: idB },
        select: {
          id: true,
          estado: true,
          bovedaId: true,
          difuntoId: true,
          contratoRelacionadoId: true,
        },
      }),
    ]);

    if (!a || !b) {
      throw new NotFoundException('Uno de los contratos no existe');
    }
    if (!a.estado || !b.estado) {
      throw new UnprocessableEntityException(
        'Ambos contratos deben estar activos para relacionarse',
      );
    }
    if (a.bovedaId !== b.bovedaId) {
      throw new UnprocessableEntityException(
        'Los contratos deben referir a la misma bóveda',
      );
    }
    if (a.difuntoId === b.difuntoId) {
      throw new UnprocessableEntityException(
        'No se pueden relacionar dos contratos del mismo difunto',
      );
    }
    // Idempotencia: si ya están relacionados entre sí, devolver tal cual.
    const yaRelacionados =
      a.contratoRelacionadoId === b.id && b.contratoRelacionadoId === a.id;
    if (!yaRelacionados) {
      if (a.contratoRelacionadoId && a.contratoRelacionadoId !== b.id) {
        throw new ConflictException(
          'El contrato A ya está relacionado con otro contrato. Rompe la relación previa primero.',
        );
      }
      if (b.contratoRelacionadoId && b.contratoRelacionadoId !== a.id) {
        throw new ConflictException(
          'El contrato B ya está relacionado con otro contrato. Rompe la relación previa primero.',
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.contrato.update({
        where: { id: a.id },
        data: {
          contratoRelacionadoId: b.id,
          usuarioActualizadorId: userId ?? null,
          fechaActualizacion: new Date(),
        },
      }),
      this.prisma.contrato.update({
        where: { id: b.id },
        data: {
          contratoRelacionadoId: a.id,
          usuarioActualizadorId: userId ?? null,
          fechaActualizacion: new Date(),
        },
      }),
    ]);

    return this.findOne(a.id);
  }

  /**
   * Rompe la relación de un contrato con su par. Idempotente: si no hay
   * relación activa, devuelve el contrato tal cual.
   */
  async romperRelacion(id: number, userId?: string) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id },
      select: { id: true, contratoRelacionadoId: true },
    });
    if (!contrato) {
      throw new NotFoundException('Contrato no encontrado');
    }
    if (!contrato.contratoRelacionadoId) {
      return this.findOne(id);
    }

    await this.prisma.$transaction([
      this.prisma.contrato.update({
        where: { id: contrato.id },
        data: {
          contratoRelacionadoId: null,
          usuarioActualizadorId: userId ?? null,
          fechaActualizacion: new Date(),
        },
      }),
      this.prisma.contrato.update({
        where: { id: contrato.contratoRelacionadoId },
        data: {
          contratoRelacionadoId: null,
          usuarioActualizadorId: userId ?? null,
          fechaActualizacion: new Date(),
        },
      }),
    ]);

    return this.findOne(id);
  }

  /**
   * Devuelve los contratos candidatos a relacionarse con `id`: misma bóveda,
   * difunto distinto, activos y sin relación previa con un tercero.
   */
  async getCandidatosRelacion(id: number, query: PaginationQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const base = await this.prisma.contrato.findUnique({
      where: { id },
      select: { bovedaId: true, difuntoId: true },
    });
    if (!base) {
      throw new NotFoundException('Contrato no encontrado');
    }

    const search = query.search?.trim();
    const where: any = {
      id: { not: id },
      estado: true,
      bovedaId: base.bovedaId,
      difuntoId: { not: base.difuntoId },
      OR: [{ contratoRelacionadoId: null }, { contratoRelacionadoId: id }],
      ...(search
        ? {
            AND: [
              {
                OR: [
                  {
                    numeroSecuencial: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                  {
                    difunto: {
                      is: { nombre: { contains: search, mode: 'insensitive' } },
                    },
                  },
                  {
                    difunto: {
                      is: { apellido: { contains: search, mode: 'insensitive' } },
                    },
                  },
                ],
              },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contrato.findMany({
        where,
        include: {
          difunto: true,
          boveda: { include: { bloque: true } },
        },
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.contrato.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async update(id: number, dto: UpdateContratoDto) {
    await this.findOne(id);
    const { responsablesIds, ...contratoData } = dto;

    if (responsablesIds) {
      await this.prisma.contratoResponsable.deleteMany({ where: { contratoId: id } });
      await this.prisma.contratoResponsable.createMany({
        data: responsablesIds.map((responsableId: number) => ({ contratoId: id, responsableId }))
      });
    }

    return this.prisma.contrato.update({ 
      where: { id }, 
      data: contratoData,
      include: { responsables: { include: { responsable: { include: { persona: true } } } } }
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.contrato.update({ where: { id }, data: { estado: false } });
  }

  async getReportes() {
    const contratos = await this.prisma.contrato.findMany({
      where: { estado: true },
      include: { 
        boveda: { include: { bloque: { include: { cementerio: true } } } },
        difunto: true,
        cuotas: { include: { pagos: true } }
      }
    });

    return {
      totalContratos: contratos.length,
      contratosActivos: contratos.filter(c => c.fechaFin && new Date(c.fechaFin) > new Date()).length,
      contratosVencidos: contratos.filter(c => c.fechaFin && new Date(c.fechaFin) <= new Date()).length,
      ingresosTotales: contratos.reduce((sum, c) => {
        const pagado = c.cuotas.reduce((s, cu) => s + (cu.pagada ? Number(cu.monto) : 0), 0);
        return sum + pagado;
      }, 0),
      contratos
    };
  }
}
