import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ReadStream } from 'node:fs';
import { StorageService } from './storage.service';

/** Tipos de imagen aceptados para fotos/avatares (foto de Bien, Difunto, Usuario). */
export const ACCEPTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/** Límite de tamaño por imagen (5 MB). */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export interface PhotoStream {
  stream: ReadStream;
  contentType: string;
}

/**
 * Servicio de fotos/avatares: valida imágenes y delega la persistencia a
 * `StorageService` (driver local; misma abstracción que los documentos).
 *
 * El `storageKey` que devuelve `store()` se guarda en BD (columna
 * `fotoStorageKey`/`avatarStorageKey`). El Content-Type al servir se deriva de
 * la extensión que asigna `store()` a partir del mime validado.
 *
 * Registrado en `StorageModule` (`@Global`), por lo que se inyecta en cualquier
 * service sin importar el módulo.
 */
@Injectable()
export class PhotoService {
  constructor(private readonly storage: StorageService) {}

  /** Valida tipo y tamaño. Lanza excepciones HTTP en español. */
  validate(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No se recibió ninguna imagen');
    }
    if (!ACCEPTED_IMAGE_MIME_TYPES.includes(file.mimetype as never)) {
      throw new BadRequestException(
        'Formato no permitido. Solo se aceptan imágenes JPG, PNG o WEBP',
      );
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new PayloadTooLargeException(
        `La imagen supera el límite de ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024} MB`,
      );
    }
  }

  /**
   * Persiste la imagen bajo `{prefix}/{id}/{uuid}.{ext}` y devuelve la
   * `storageKey` para guardar en BD. Valida antes de escribir.
   */
  async store(
    prefix: string,
    id: number | string,
    file: Express.Multer.File,
  ): Promise<string> {
    this.validate(file);
    const ext = EXT_BY_MIME[file.mimetype] ?? 'bin';
    const key = `${prefix}/${id}/${randomUUID()}.${ext}`;
    const { storageKey } = await this.storage.put(key, file.buffer);
    return storageKey;
  }

  /** Abre la imagen para servirla, derivando el Content-Type de la extensión. */
  async streamFor(key: string): Promise<PhotoStream> {
    return {
      stream: this.storage.getStream(key),
      contentType: this.contentTypeFor(key),
    };
  }

  /** ¿Existe el archivo físico? */
  exists(key: string): Promise<boolean> {
    return this.storage.exists(key);
  }

  /** Borra el archivo físico (best-effort; no lanza si ya no existe). */
  async remove(key: string): Promise<void> {
    await this.storage.delete(key);
  }

  private contentTypeFor(key: string): string {
    const ext = key.split('.').pop()?.toLowerCase() ?? '';
    return MIME_BY_EXT[ext] ?? 'application/octet-stream';
  }
}
