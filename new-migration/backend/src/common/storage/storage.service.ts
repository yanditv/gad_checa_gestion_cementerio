import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, type ReadStream } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface PutResult {
  storageKey: string;
  size: number;
}

/**
 * Abstracción para guardar adjuntos del sistema (PDFs firmados, etc.).
 *
 * Implementación actual: driver `local` que persiste bajo `STORAGE_PATH`.
 * El layout del path final es:
 *
 *   {STORAGE_PATH}/{relativeKey}
 *
 * El `storageKey` que se guarda en BD es la `relativeKey` (sin prefijo),
 * de modo que el path absoluto sigue siendo controlado por config.
 *
 * Futuro driver `s3`: implementar la misma interfaz contra @aws-sdk/client-s3.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private basePath!: string;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const driver = this.config.get<string>('STORAGE_DRIVER') ?? 'local';
    if (driver !== 'local') {
      throw new Error(
        `Driver de almacenamiento '${driver}' aún no implementado. Usa STORAGE_DRIVER=local`,
      );
    }
    const configured =
      this.config.get<string>('STORAGE_PATH') ??
      path.join(process.cwd(), 'storage');
    this.basePath = path.resolve(configured);
    await fs.mkdir(this.basePath, { recursive: true });
    this.logger.log(`StorageService listo. base=${this.basePath}`);
  }

  /**
   * Persiste un buffer en disco bajo la `key` relativa. Crea las carpetas
   * intermedias. Devuelve la `storageKey` canónica (igual a la `key`
   * sanitizada) y el tamaño en bytes.
   */
  async put(key: string, content: Buffer): Promise<PutResult> {
    const safeKey = this.sanitizeKey(key);
    const fullPath = path.join(this.basePath, safeKey);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content);
    return { storageKey: safeKey, size: content.byteLength };
  }

  getStream(key: string): ReadStream {
    const fullPath = this.resolveSafe(key);
    return createReadStream(fullPath);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolveSafe(key));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.resolveSafe(key);
    try {
      await fs.unlink(fullPath);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') return; // ya no estaba
      throw new InternalServerErrorException(
        `No se pudo eliminar el archivo: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Bloquea path traversal: `../../etc/passwd` debe colapsar a algo dentro
   * del `basePath`. Lanza NotFoundException si la key apunta fuera.
   */
  private resolveSafe(key: string): string {
    const safeKey = this.sanitizeKey(key);
    const fullPath = path.resolve(this.basePath, safeKey);
    if (!fullPath.startsWith(this.basePath + path.sep) && fullPath !== this.basePath) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return fullPath;
  }

  /** Normaliza separadores y descarta segmentos peligrosos. */
  private sanitizeKey(key: string): string {
    const normalized = key
      .replace(/\\+/g, '/')
      .replace(/\/+/g, '/')
      .replace(/^\/+/, '')
      .trim();
    if (!normalized) {
      throw new InternalServerErrorException('storageKey vacía');
    }
    if (normalized.includes('..')) {
      throw new InternalServerErrorException(
        'storageKey contiene segmentos no permitidos',
      );
    }
    return normalized;
  }
}
