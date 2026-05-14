import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CatastroImporter } from './catastro.importer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildPaginationMeta,
  normalizePagination,
} from '../../common/pagination';

@Injectable()
export class CatastroService {
  constructor(private prisma: PrismaService) {}

  async listImports(query: PaginationQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.catastroImport.findMany({
        include: {
          adminUser: {
            select: { id: true, nombre: true, apellido: true, email: true },
          },
        },
        orderBy: { fechaInicio: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.catastroImport.count(),
    ]);
    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getImport(id: number) {
    const found = await this.prisma.catastroImport.findUnique({
      where: { id },
      include: {
        adminUser: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });
    if (!found) throw new NotFoundException('Importación no encontrada');
    return found;
  }

  /**
   * Ejecuta la importación desde un Buffer (Excel multipart).
   * Crea el registro `CatastroImport` en estado EN_PROGRESO, corre el
   * importer y actualiza el registro al final con los conteos finales o
   * el mensaje de error global.
   */
  async runImport(filename: string, buffer: Buffer, adminUserId: string) {
    const registro = await this.prisma.catastroImport.create({
      data: {
        filename,
        estado: 'EN_PROGRESO',
        adminUserId,
      },
    });

    try {
      const importer = new CatastroImporter(this.prisma);
      const report = await importer.run(buffer, adminUserId);

      const updated = await this.prisma.catastroImport.update({
        where: { id: registro.id },
        data: {
          estado: 'COMPLETADO',
          registrosProcesados: report.registrosProcesados,
          bloquesCreados: report.bloquesCreados,
          bovedasCreadas: report.bovedasCreadas,
          contratosCreados: report.contratosCreados,
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
        bloquesCreados: updated.bloquesCreados,
        bovedasCreadas: updated.bovedasCreadas,
        contratosCreados: updated.contratosCreados,
        errores: report.errores,
      };
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : String(err);
      await this.prisma.catastroImport.update({
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
