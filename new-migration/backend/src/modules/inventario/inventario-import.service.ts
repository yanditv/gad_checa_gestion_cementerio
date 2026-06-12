import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventarioImporter } from './inventario.importer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildPaginationMeta,
  normalizePagination,
} from '../../common/pagination';
import {
  toInventarioImportListItem,
  toInventarioImportResponse,
  type InventarioImportConRelaciones,
} from './inventario-import.mapper';

@Injectable()
export class InventarioImportService {
  constructor(private prisma: PrismaService) {}

  /** Historial paginado de importaciones (Fase 9.3). */
  async listImports(query: PaginationQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventarioImport.findMany({
        include: {
          adminUser: {
            select: { id: true, nombre: true, apellido: true, email: true },
          },
        },
        orderBy: { fechaInicio: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventarioImport.count(),
    ]);
    return {
      items: items.map((i) =>
        toInventarioImportListItem(i as InventarioImportConRelaciones),
      ),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  /** Estado de la última importación (vista de estado). */
  async getLast() {
    const found = await this.prisma.inventarioImport.findFirst({
      include: {
        adminUser: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
      orderBy: { fechaInicio: 'desc' },
    });
    if (!found) return null;
    return toInventarioImportResponse(found as InventarioImportConRelaciones);
  }

  async getImport(id: number) {
    const found = await this.prisma.inventarioImport.findUnique({
      where: { id },
      include: {
        adminUser: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });
    if (!found) throw new NotFoundException('Importación no encontrada');
    return toInventarioImportResponse(found as InventarioImportConRelaciones);
  }

  /**
   * Ejecuta la importación desde un Buffer (Excel multipart).
   * Crea el registro `InventarioImport` en estado EN_PROGRESO, corre el
   * importer y actualiza el registro al final con los conteos finales o el
   * mensaje de error global. Upsert sin borrado destructivo.
   */
  async runImport(filename: string, buffer: Buffer, adminUserId: string) {
    const registro = await this.prisma.inventarioImport.create({
      data: {
        filename,
        estado: 'EN_PROGRESO',
        adminUserId,
      },
    });

    try {
      const importer = new InventarioImporter(this.prisma);
      const report = await importer.run(buffer, adminUserId);

      const updated = await this.prisma.inventarioImport.update({
        where: { id: registro.id },
        data: {
          estado: 'COMPLETADO',
          registrosProcesados: report.registrosProcesados,
          categoriasCreadas: report.categoriasCreadas,
          custodiosCreados: report.custodiosCreados,
          bienesCreados: report.bienesCreados,
          bienesActualizados: report.bienesActualizados,
          errores: report.errores.length
            ? JSON.stringify(report.errores)
            : null,
          fechaFin: new Date(),
        },
      });

      return {
        importId: updated.id,
        estado: updated.estado,
        registrosProcesados: updated.registrosProcesados,
        categoriasCreadas: updated.categoriasCreadas,
        custodiosCreados: updated.custodiosCreados,
        bienesCreados: updated.bienesCreados,
        bienesActualizados: updated.bienesActualizados,
        errores: report.errores,
      };
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : String(err);
      await this.prisma.inventarioImport.update({
        where: { id: registro.id },
        data: {
          estado: 'ERROR',
          mensajeError: mensaje,
          fechaFin: new Date(),
        },
      });
      throw err;
    }
  }
}
