import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';

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
    const numeroSecuencial = await this.generateNumeroContrato(bovedaId, isRenovacion);
    const boveda = bovedaId
      ? await this.prisma.boveda.findUnique({ where: { id: Number(bovedaId) } })
      : null;

    return {
      numeroSecuencial,
      montoTotal: boveda ? Number(boveda.precioArrendamiento) : 0,
      boveda,
    };
  }

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const search = query.search?.trim();

    const where: any = {
      estado: true,
      ...(search
        ? {
            OR: [
              { numeroSecuencial: { contains: search, mode: 'insensitive' } },
              { difunto: { is: { nombre: { contains: search, mode: 'insensitive' } } } },
              { difunto: { is: { apellido: { contains: search, mode: 'insensitive' } } } },
              { boveda: { is: { numero: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contrato.findMany({
        where,
        include: {
          boveda: { include: { bloque: { include: { cementerio: true } } } },
          difunto: true,
          responsables: { include: { responsable: { include: { persona: true } } } },
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
        boveda: { include: { bloque: { include: { cementerio: true } }, piso: true } },
        difunto: true,
        responsables: { include: { responsable: { include: { persona: true, propietario: true } } } },
        cuotas: { include: { pagos: { include: { pago: true } } }, orderBy: { numero: 'asc' } },
        contratoOrigen: true,
        contratoRelacionado: true,
      },
    });
    if (!contrato) throw new NotFoundException('Contrato no encontrado');
    return contrato;
  }

  async create(data: any) {
    if (data?.contrato && data?.difunto && data?.responsables && data?.pago) {
      return this.createWizard(data);
    }

    const numeroSecuencial = await this.generateNumeroContrato(data.bovedaId, false);

    const { responsablesIds, ...contratoData } = data;

    const contrato = await this.prisma.contrato.create({
      data: {
        ...contratoData,
        numeroSecuencial,
        responsables: responsablesIds
          ? {
              create: responsablesIds.map((id: number) => ({ responsableId: id })),
            }
          : undefined,
      },
      include: {
        responsables: { include: { responsable: { include: { persona: true } } } },
      },
    });

    return contrato;
  }

  private async generateNumeroContrato(bovedaId?: number, isRenovacion = false): Promise<string> {
    const year = new Date().getFullYear();
    const boveda = bovedaId
      ? await this.prisma.boveda.findUnique({
          where: { id: Number(bovedaId) },
          include: { piso: { include: { bloque: true } } },
        })
      : null;

    const tipo = (boveda?.tipo || boveda?.piso?.bloque?.nombre || 'Boveda').toLowerCase();
    const basePrefix = tipo.includes('nicho') ? 'NCH' : tipo.includes('tumulo') || tipo.includes('tumul') ? 'TML' : 'CTR';
    const prefix = isRenovacion ? `RNV-${basePrefix}` : basePrefix;

    const lastContrato = await this.prisma.contrato.findFirst({
      where: {
        numeroSecuencial: { startsWith: `${prefix}-GADCHECA-${year}-` },
      },
      orderBy: { id: 'desc' },
      select: { numeroSecuencial: true },
    });

    const nextNumber = lastContrato ? Number(lastContrato.numeroSecuencial.split('-').pop() || '0') + 1 : 1;
    return `${prefix}-GADCHECA-${year}-${String(nextNumber).padStart(3, '0')}`;
  }

  private async createWizard(payload: any) {
    const { contrato, difunto, responsables, pago } = payload;
    const numeroSecuencial =
      contrato.numeroSecuencial || (await this.generateNumeroContrato(contrato.bovedaId, !!contrato.esRenovacion));

    return this.prisma.$transaction(async (tx) => {
      const difuntoCreado = await tx.difunto.create({
        data: {
          nombre: difunto.nombres,
          apellido: difunto.apellidos,
          numeroIdentificacion: difunto.numeroIdentificacion || null,
          fechaNacimiento: difunto.fechaNacimiento ? new Date(difunto.fechaNacimiento) : null,
          fechaDefuncion: difunto.fechaFallecimiento ? new Date(difunto.fechaFallecimiento) : null,
          bovedaId: Number(contrato.bovedaId),
          estado: true,
        },
      });

      const responsablesIds: number[] = [];
      for (const item of responsables as any[]) {
        if (item.id && item.esExistente) {
          let responsable = await tx.responsable.findFirst({
            where: { personaId: Number(item.id) },
          });

          if (!responsable) {
            responsable = await tx.responsable.create({
              data: {
                personaId: Number(item.id),
                parentesco: item.parentesco || null,
                estado: true,
              },
            });
          }

          responsablesIds.push(responsable.id);
          continue;
        }

        const persona = await tx.persona.create({
          data: {
            nombre: item.nombres,
            apellido: item.apellidos,
            numeroIdentificacion: item.numeroIdentificacion,
            tipoIdentificacion: item.tipoIdentificacion || 'Cedula',
            telefono: item.telefono || null,
            email: item.email || null,
            direccion: item.direccion || null,
            tipoPersona: 'Responsable',
            estado: true,
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
          fechaInicio: new Date(contrato.fechaInicio),
          fechaFin: contrato.fechaFin ? new Date(contrato.fechaFin) : null,
          numeroDeMeses: Number(contrato.numeroDeMeses),
          montoTotal: Number(contrato.montoTotal),
          observaciones: contrato.observaciones || null,
          estado: true,
          esRenovacion: !!contrato.esRenovacion,
          contratoOrigenId: contrato.contratoOrigenId || null,
          contratoRelacionadoId: contrato.contratoRelacionadoId || null,
          bovedaId: Number(contrato.bovedaId),
          difuntoId: difuntoCreado.id,
          responsables: {
            create: responsablesIds.map((responsableId) => ({ responsableId })),
          },
        },
      });

      const cuotas = (contrato.cuotas || []).map((cuota: any, index: number) => ({
        numero: index + 1,
        monto: Number(cuota.monto),
        fechaVencimiento: new Date(cuota.fechaVencimiento),
        pagada: !!cuota.pagada,
        fechaPago: cuota.pagada ? new Date(pago.fechaPago || new Date()) : null,
        contratoId: contratoCreado.id,
        estado: true,
        observaciones: null,
      }));

      if (cuotas.length > 0) {
        await tx.cuota.createMany({ data: cuotas });
      }

      const cuotasCreadas = await tx.cuota.findMany({
        where: { contratoId: contratoCreado.id },
        orderBy: { numero: 'asc' },
      });

      const cuotasSeleccionadas = cuotasCreadas.filter((cuota) =>
        (pago.cuotasSeleccionadas || []).includes(cuota.numero),
      );

      if (cuotasSeleccionadas.length > 0) {
        const ultimoPago = await tx.pago.findFirst({ orderBy: { id: 'desc' } });
        const nuevoNumero = ultimoPago ? ultimoPago.id + 1 : 1;
        const numeroRecibo = `REC-${new Date().getFullYear()}-${nuevoNumero.toString().padStart(5, '0')}`;

        const pagoCreado = await tx.pago.create({
          data: {
            numeroRecibo,
            monto: Number(pago.monto),
            fechaPago: new Date(pago.fechaPago || new Date()),
            metodoPago: pago.tipoPago,
            referencia: pago.numeroComprobante || null,
            observacion: pago.observacion || null,
            bancoId: pago.bancoId || null,
            estado: true,
          },
        });

        await tx.cuotaPago.createMany({
          data: cuotasSeleccionadas.map((cuota) => ({
            cuotaId: cuota.id,
            pagoId: pagoCreado.id,
          })),
        });

        await tx.cuota.updateMany({
          where: { id: { in: cuotasSeleccionadas.map((cuota) => cuota.id) } },
          data: {
            pagada: true,
            fechaPago: new Date(pago.fechaPago || new Date()),
          },
        });
      }

      return tx.contrato.findUnique({
        where: { id: contratoCreado.id },
        include: {
          boveda: { include: { bloque: true, piso: true } },
          difunto: true,
          responsables: { include: { responsable: { include: { persona: true } } } },
          cuotas: { orderBy: { numero: 'asc' } },
        },
      });
    });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    const { responsablesIds, ...contratoData } = data;

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
