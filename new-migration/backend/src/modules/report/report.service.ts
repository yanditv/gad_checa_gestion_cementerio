import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  clasificarEstadoBoveda,
  diasMora,
  resolveRange,
} from './report.helpers';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // 1. Resumen general (KPIs)
  // ---------------------------------------------------------------------------
  async getResumen(desde?: string, hasta?: string) {
    const { desde: from, hasta: to } = resolveRange(desde, hasta);

    const [contratos, pagos, bovedas] = await Promise.all([
      this.prisma.contrato.findMany({
        where: { estado: true },
        select: { id: true, fechaFin: true, montoTotal: true },
      }),
      this.prisma.pago.findMany({
        where: {
          estado: true,
          fechaPago: { gte: from, lte: to },
        },
        select: { monto: true, metodoPago: true },
      }),
      this.prisma.boveda.findMany({
        where: { estado: true },
        select: {
          id: true,
          tipo: true,
          contratos: {
            where: { estado: true },
            select: { fechaFin: true },
            orderBy: { fechaCreacion: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    const ahora = new Date();
    const contratosActivos = contratos.filter(
      (c) => !c.fechaFin || new Date(c.fechaFin) > ahora,
    ).length;
    const contratosVencidos = contratos.length - contratosActivos;
    const ingresosRango = pagos.reduce((s, p) => s + Number(p.monto), 0);

    let totalBovedas = 0;
    let totalNichos = 0;
    let bovedasOcupadas = 0;
    let nichosOcupados = 0;
    let porCaducar = 0;
    let vencidas = 0;

    for (const b of bovedas) {
      const tipo = (b.tipo ?? 'Boveda').toLowerCase();
      const esNicho = tipo.includes('nicho');
      const estado = clasificarEstadoBoveda(b.contratos[0] ?? null, ahora);
      if (esNicho) {
        totalNichos += 1;
        if (estado !== 'disponible') nichosOcupados += 1;
      } else {
        totalBovedas += 1;
        if (estado !== 'disponible') bovedasOcupadas += 1;
      }
      if (estado === 'por_caducar') porCaducar += 1;
      if (estado === 'vencida') vencidas += 1;
    }

    return {
      rango: { desde: from.toISOString(), hasta: to.toISOString() },
      contratos: {
        total: contratos.length,
        activos: contratosActivos,
        vencidos: contratosVencidos,
      },
      ingresos: {
        rango: ingresosRango,
        porMetodo: this.agruparPorMetodo(pagos),
      },
      bovedas: {
        total: totalBovedas + totalNichos,
        bovedasTotal: totalBovedas,
        nichosTotal: totalNichos,
        bovedasOcupadas,
        nichosOcupados,
        bovedasDisponibles: totalBovedas - bovedasOcupadas,
        nichosDisponibles: totalNichos - nichosOcupados,
        porCaducar,
        vencidas,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 2. Ingresos por fecha
  // ---------------------------------------------------------------------------
  async getIngresos(desde?: string, hasta?: string) {
    const { desde: from, hasta: to } = resolveRange(desde, hasta);

    const pagos = await this.prisma.pago.findMany({
      where: {
        estado: true,
        fechaPago: { gte: from, lte: to },
      },
      include: {
        banco: { select: { nombre: true } },
        cuotas: {
          include: {
            cuota: {
              include: {
                contrato: {
                  include: {
                    boveda: { include: { bloque: true } },
                    difunto: true,
                    responsables: {
                      include: {
                        responsable: { include: { persona: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { fechaPago: 'asc' },
    });

    const items = pagos.map((p) => {
      const cuota = p.cuotas[0]?.cuota;
      const contrato = cuota?.contrato;
      const responsable =
        contrato?.responsables[0]?.responsable?.persona ?? null;
      const difunto = contrato?.difunto ?? null;
      const boveda = contrato?.boveda ?? null;
      const bloque = boveda?.bloque ?? null;

      return {
        id: p.id,
        fechaPago: p.fechaPago,
        numeroRecibo: p.numeroRecibo,
        metodoPago: p.metodoPago,
        banco: p.banco?.nombre ?? null,
        referencia: p.referencia ?? null,
        monto: Number(p.monto),
        contrato: contrato
          ? {
              id: contrato.id,
              numeroSecuencial: contrato.numeroSecuencial,
              esRenovacion: contrato.esRenovacion,
              tipoIngreso: contrato.esRenovacion ? 'Renovación' : 'Inicial',
            }
          : null,
        difunto: difunto
          ? `${difunto.nombre} ${difunto.apellido}`.trim()
          : null,
        responsable: responsable
          ? `${responsable.nombre} ${responsable.apellido}`.trim()
          : null,
        identificacionResponsable: responsable?.numeroIdentificacion ?? null,
        boveda: boveda?.numero ?? null,
        bloque: bloque?.nombre ?? null,
      };
    });

    const totalGeneral = items.reduce((s, i) => s + i.monto, 0);
    const porMetodo = this.agruparPorMetodo(
      pagos.map((p) => ({ monto: p.monto, metodoPago: p.metodoPago })),
    );

    return {
      rango: { desde: from.toISOString(), hasta: to.toISOString() },
      items,
      totales: {
        general: totalGeneral,
        cantidad: items.length,
        porMetodo,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 3. Cuentas por cobrar (cuotas vencidas / pendientes)
  // ---------------------------------------------------------------------------
  async getCuentasPorCobrar() {
    const cuotas = await this.prisma.cuota.findMany({
      where: { pagada: false, estado: true },
      include: {
        contrato: {
          include: {
            boveda: { include: { bloque: true } },
            difunto: true,
            responsables: {
              include: {
                responsable: { include: { persona: true } },
              },
            },
          },
        },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });

    const hoy = new Date();
    const items = cuotas.map((c) => {
      const contrato = c.contrato;
      const responsable =
        contrato?.responsables[0]?.responsable?.persona ?? null;
      const difunto = contrato?.difunto ?? null;
      const boveda = contrato?.boveda ?? null;
      const bloque = boveda?.bloque ?? null;
      const mora = diasMora(c.fechaVencimiento, hoy);

      return {
        cuotaId: c.id,
        numero: c.numero,
        fechaVencimiento: c.fechaVencimiento,
        diasMora: mora,
        monto: Number(c.monto),
        intereses: Number(c.intereses),
        total: Number(c.monto) + Number(c.intereses),
        contrato: contrato
          ? {
              id: contrato.id,
              numeroSecuencial: contrato.numeroSecuencial,
              fechaInicio: contrato.fechaInicio,
              fechaFin: contrato.fechaFin,
            }
          : null,
        difunto: difunto
          ? `${difunto.nombre} ${difunto.apellido}`.trim()
          : null,
        responsable: responsable
          ? `${responsable.nombre} ${responsable.apellido}`.trim()
          : null,
        telefono: responsable?.telefono ?? null,
        identificacionResponsable: responsable?.numeroIdentificacion ?? null,
        boveda: boveda?.numero ?? null,
        bloque: bloque?.nombre ?? null,
      };
    });

    const totalDeuda = items.reduce((s, i) => s + i.total, 0);
    const vencidas = items.filter((i) => i.diasMora > 0).length;

    return {
      items,
      totales: {
        cantidad: items.length,
        vencidas,
        monto: totalDeuda,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Reporte de bóvedas (inventario)
  // ---------------------------------------------------------------------------
  async getBovedas(tipo?: string, bloque?: string, estado?: string) {
    const bovedas = await this.prisma.boveda.findMany({
      where: {
        estado: true,
        ...(tipo ? { tipo } : {}),
        ...(bloque ? { bloque: { is: { nombre: bloque } } } : {}),
      },
      include: {
        bloque: { include: { cementerio: true } },
        piso: true,
        propietario: { include: { persona: true } },
        contratos: {
          where: { estado: true },
          orderBy: { fechaCreacion: 'desc' },
          take: 1,
          include: {
            difunto: true,
            responsables: {
              include: { responsable: { include: { persona: true } } },
            },
          },
        },
      },
      orderBy: [{ bloqueId: 'asc' }, { numero: 'asc' }],
    });

    const hoy = new Date();
    let items = bovedas.map((b) => {
      const contrato = b.contratos[0] ?? null;
      const estadoCalc = clasificarEstadoBoveda(contrato, hoy);
      const propietarioPersona = b.propietario?.persona ?? null;
      const difunto = contrato?.difunto ?? null;
      const responsable =
        contrato?.responsables[0]?.responsable?.persona ?? null;

      return {
        bovedaId: b.id,
        numero: b.numero,
        tipo: b.tipo ?? 'Boveda',
        precio: Number(b.precio),
        precioArrendamiento: Number(b.precioArrendamiento),
        bloque: b.bloque?.nombre ?? null,
        piso: b.piso?.numero ?? null,
        cementerio: b.bloque?.cementerio?.nombre ?? null,
        estado: estadoCalc,
        propietario: propietarioPersona
          ? `${propietarioPersona.nombre} ${propietarioPersona.apellido}`.trim()
          : null,
        identificacionPropietario:
          propietarioPersona?.numeroIdentificacion ?? null,
        difunto: difunto
          ? `${difunto.nombre} ${difunto.apellido}`.trim()
          : null,
        identificacionDifunto: difunto?.numeroIdentificacion ?? null,
        fechaFallecimiento: difunto?.fechaDefuncion ?? null,
        responsable: responsable
          ? `${responsable.nombre} ${responsable.apellido}`.trim()
          : null,
        telefonoResponsable: responsable?.telefono ?? null,
        contrato: contrato
          ? {
              id: contrato.id,
              numeroSecuencial: contrato.numeroSecuencial,
              fechaInicio: contrato.fechaInicio,
              fechaFin: contrato.fechaFin,
              numeroDeMeses: contrato.numeroDeMeses,
              montoTotal: Number(contrato.montoTotal),
              esRenovacion: contrato.esRenovacion,
            }
          : null,
      };
    });

    if (estado) {
      items = items.filter((i) => i.estado === estado);
    }

    const tipos = Array.from(new Set(bovedas.map((b) => b.tipo ?? 'Boveda')))
      .filter(Boolean)
      .sort();
    const bloques = Array.from(
      new Set(bovedas.map((b) => b.bloque?.nombre).filter(Boolean) as string[]),
    ).sort();

    const totales = items.reduce(
      (acc, i) => {
        acc.total += 1;
        acc[i.estado] = (acc[i.estado] ?? 0) + 1;
        return acc;
      },
      {
        total: 0,
        disponible: 0,
        ocupada: 0,
        por_caducar: 0,
        vencida: 0,
      } as Record<string, number>,
    );

    return {
      items,
      filtros: { tipos, bloques },
      totales,
    };
  }

  // ---------------------------------------------------------------------------
  // 5. Reporte por bloque (ocupación)
  // ---------------------------------------------------------------------------
  async getBloques() {
    const bloques = await this.prisma.bloque.findMany({
      where: { estado: true },
      include: {
        cementerio: true,
        bovedas: {
          where: { estado: true },
          include: {
            contratos: {
              where: { estado: true },
              orderBy: { fechaCreacion: 'desc' },
              take: 1,
              select: { fechaFin: true, numeroSecuencial: true },
            },
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    const hoy = new Date();
    const limite30 = new Date(hoy);
    limite30.setDate(limite30.getDate() + 30);

    const items = bloques.map((bl) => {
      let ocupadas = 0;
      let porCaducar = 0;
      let vencidas = 0;
      const proximas: {
        boveda: string;
        contrato: string | null;
        fechaFin: Date | null;
      }[] = [];

      for (const b of bl.bovedas) {
        const c = b.contratos[0];
        const estado = clasificarEstadoBoveda(c ?? null, hoy);
        if (estado !== 'disponible') ocupadas += 1;
        if (estado === 'por_caducar') {
          porCaducar += 1;
          proximas.push({
            boveda: b.numero,
            contrato: c?.numeroSecuencial ?? null,
            fechaFin: c?.fechaFin ?? null,
          });
        }
        if (estado === 'vencida') vencidas += 1;
      }

      const total = bl.bovedas.length;
      const porcentaje = total > 0 ? (ocupadas / total) * 100 : 0;

      return {
        bloqueId: bl.id,
        nombre: bl.nombre,
        descripcion: bl.descripcion,
        cementerio: bl.cementerio?.nombre ?? null,
        total,
        ocupadas,
        disponibles: total - ocupadas,
        porCaducar,
        vencidas,
        porcentajeOcupacion: Math.round(porcentaje * 10) / 10,
        proximasLiberaciones: proximas
          .sort(
            (a, b) =>
              (a.fechaFin?.getTime() ?? 0) - (b.fechaFin?.getTime() ?? 0),
          )
          .slice(0, 5),
      };
    });

    const totalGeneral = items.reduce(
      (acc, i) => {
        acc.total += i.total;
        acc.ocupadas += i.ocupadas;
        acc.disponibles += i.disponibles;
        acc.porCaducar += i.porCaducar;
        acc.vencidas += i.vencidas;
        return acc;
      },
      { total: 0, ocupadas: 0, disponibles: 0, porCaducar: 0, vencidas: 0 },
    );

    return { items, totales: totalGeneral };
  }

  // ---------------------------------------------------------------------------
  // 6. Comparativa mensual: ingresos mes-a-mes último año vs anterior
  // ---------------------------------------------------------------------------
  async getComparativaMensual() {
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const anioAnterior = anioActual - 1;

    const inicio = new Date(anioAnterior, 0, 1);
    const fin = new Date(anioActual, 11, 31, 23, 59, 59, 999);

    const pagos = await this.prisma.pago.findMany({
      where: {
        estado: true,
        fechaPago: { gte: inicio, lte: fin },
      },
      select: { fechaPago: true, monto: true },
    });

    const buckets: Record<string, number> = {};
    for (const p of pagos) {
      const d = new Date(p.fechaPago);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets[key] = (buckets[key] ?? 0) + Number(p.monto);
    }

    const meses = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];

    const items = meses.map((nombre, idx) => ({
      mes: nombre,
      anioAnterior: buckets[`${anioAnterior}-${idx}`] ?? 0,
      anioActual: buckets[`${anioActual}-${idx}`] ?? 0,
    }));

    const totales = items.reduce(
      (acc, i) => {
        acc.anioAnterior += i.anioAnterior;
        acc.anioActual += i.anioActual;
        return acc;
      },
      { anioAnterior: 0, anioActual: 0 },
    );

    const variacion =
      totales.anioAnterior > 0
        ? ((totales.anioActual - totales.anioAnterior) / totales.anioAnterior) *
          100
        : null;

    return {
      anios: { actual: anioActual, anterior: anioAnterior },
      items,
      totales: {
        ...totales,
        variacionPct: variacion === null ? null : Math.round(variacion * 10) / 10,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers privados
  // ---------------------------------------------------------------------------
  private agruparPorMetodo(
    pagos: { monto: { toString(): string } | number; metodoPago: string }[],
  ) {
    const map = new Map<string, { metodo: string; total: number; cantidad: number }>();
    for (const p of pagos) {
      const k = p.metodoPago || 'Sin método';
      const entry = map.get(k) ?? { metodo: k, total: 0, cantidad: 0 };
      entry.total += Number(p.monto);
      entry.cantidad += 1;
      map.set(k, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }
}
