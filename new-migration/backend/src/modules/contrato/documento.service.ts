import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';

export const ACCEPTED_DOCUMENT_MIME_TYPES = ['application/pdf'];
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export type DocumentoTipo =
  | 'ContratoFirmado'
  | 'CedulaResponsable'
  | 'CertificadoDefuncion'
  | 'Otro';

interface UploadInput {
  contratoId: number;
  file: Express.Multer.File;
  tipo?: DocumentoTipo;
  userId?: string;
}

@Injectable()
export class DocumentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async listByContrato(contratoId: number) {
    await this.assertContratoExists(contratoId);
    return this.prisma.documento.findMany({
      where: { contratoId, estado: true },
      orderBy: { fechaCreacion: 'desc' },
      include: {
        subidoPor: { select: { id: true, nombre: true, apellido: true } },
      },
    });
  }

  async upload(input: UploadInput) {
    const { contratoId, file, tipo = 'ContratoFirmado', userId } = input;

    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    if (!ACCEPTED_DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Solo se permiten archivos PDF para documentos firmados',
      );
    }
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new PayloadTooLargeException(
        `El archivo supera el límite de ${MAX_DOCUMENT_SIZE_BYTES / 1024 / 1024} MB`,
      );
    }

    await this.assertContratoExists(contratoId);

    const cleanName = sanitizeFileName(file.originalname);
    const storageKey = `contratos/${contratoId}/${randomUUID()}-${cleanName}`;
    const { size } = await this.storage.put(storageKey, file.buffer);

    return this.prisma.$transaction(async (tx) => {
      const doc = await tx.documento.create({
        data: {
          contratoId,
          storageKey,
          nombreOriginal: cleanName,
          mimeType: file.mimetype,
          tamanioBytes: size,
          tipo,
          subidoPorId: userId ?? null,
        },
      });

      // Compatibilidad con el campo legado del contrato: si es el último
      // documento de tipo ContratoFirmado, lo apuntamos también allí.
      if (tipo === 'ContratoFirmado') {
        await tx.contrato.update({
          where: { id: contratoId },
          data: { pathDocumentoFirmado: storageKey },
        });
      }

      return doc;
    });
  }

  async getForDownload(contratoId: number, docId: number) {
    const doc = await this.prisma.documento.findFirst({
      where: { id: docId, contratoId, estado: true },
    });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    if (!(await this.storage.exists(doc.storageKey))) {
      throw new NotFoundException('El archivo del documento no existe');
    }
    return {
      doc,
      stream: this.storage.getStream(doc.storageKey),
    };
  }

  async remove(contratoId: number, docId: number, userId?: string) {
    const doc = await this.prisma.documento.findFirst({
      where: { id: docId, contratoId, estado: true },
    });
    if (!doc) throw new NotFoundException('Documento no encontrado');

    return this.prisma.$transaction(async (tx) => {
      // Eliminación lógica (preserva trazabilidad).
      await tx.documento.update({
        where: { id: doc.id },
        data: { estado: false },
      });

      // Si el contrato tenía esta key como documento firmado canónico,
      // intentamos apuntar al siguiente más reciente del mismo tipo.
      const contrato = await tx.contrato.findUnique({
        where: { id: contratoId },
        select: { pathDocumentoFirmado: true },
      });
      if (contrato?.pathDocumentoFirmado === doc.storageKey) {
        const next = await tx.documento.findFirst({
          where: {
            contratoId,
            estado: true,
            tipo: 'ContratoFirmado',
          },
          orderBy: { fechaCreacion: 'desc' },
        });
        await tx.contrato.update({
          where: { id: contratoId },
          data: { pathDocumentoFirmado: next?.storageKey ?? null },
        });
      }

      // Borramos el archivo físico (best-effort).
      try {
        await this.storage.delete(doc.storageKey);
      } catch {
        // El registro queda inactivo aunque el archivo no se haya borrado.
      }

      // Cobertura "best-effort" del userId para auditoría futura.
      // No hay columna usuarioEliminadorId en Documento por ahora.
      void userId;

      return { success: true };
    });
  }

  private async assertContratoExists(contratoId: number) {
    const exists = await this.prisma.contrato.findUnique({
      where: { id: contratoId },
      select: { id: true, estado: true },
    });
    if (!exists) throw new NotFoundException('Contrato no encontrado');
    if (!exists.estado) {
      throw new ForbiddenException(
        'El contrato está inactivo; no se pueden gestionar documentos',
      );
    }
  }
}

function sanitizeFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);
  return base || 'documento.pdf';
}
