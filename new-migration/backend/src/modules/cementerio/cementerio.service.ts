import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PhotoService } from '../../common/storage/photo.service';
import { UpdateCementerioDto } from './dto/request/update-cementerio.dto';
import { UpdateGADInformacionDto } from './dto/request/gad-informacion.dto';
import { toCementerioResponse, toGADInformacionResponse } from './cementerio.mapper';

@Injectable()
export class CementerioService {
  constructor(
    private prisma: PrismaService,
    private photos: PhotoService,
  ) {}

  async findAll() {
    const items = await this.prisma.cementerio.findMany({
      where: { estado: true },
      include: { bloques: { where: { estado: true } } },
    });
    return items.map(toCementerioResponse);
  }

  async findOne(id: number) {
    const cementerio = await this.prisma.cementerio.findUnique({
      where: { id },
      include: { bloques: { where: { estado: true }, include: { bovedas: true } } },
    });
    if (!cementerio) throw new NotFoundException('Cementerio no encontrado');
    return toCementerioResponse(cementerio);
  }

  async create(dto: UpdateCementerioDto, userId: string) {
    const entity = await this.prisma.cementerio.create({
      data: { ...dto, usuarioCreadorId: userId } as Prisma.CementerioCreateInput,
    });
    return toCementerioResponse(entity);
  }

  async update(id: number, dto: UpdateCementerioDto, userId: string) {
    await this.findOne(id);
    const entity = await this.prisma.cementerio.update({
      where: { id },
      data: { ...dto, usuarioActualizadorId: userId, fechaActualizacion: new Date() } as Prisma.CementerioUpdateInput,
    });
    return toCementerioResponse(entity);
  }

  async remove(id: number, userId: string) {
    await this.findOne(id);
    const entity = await this.prisma.cementerio.update({
      where: { id },
      data: { estado: false, usuarioEliminadorId: userId, fechaEliminacion: new Date() },
    });
    return toCementerioResponse(entity);
  }

  async getGADInformacion() {
    const info = await this.prisma.gADInformacion.findFirst({
      orderBy: { id: 'asc' },
    });
    if (!info) {
      throw new NotFoundException('Información del GAD no configurada');
    }
    return toGADInformacionResponse(info);
  }

  async updateGADInformacion(dto: UpdateGADInformacionDto, userId: string) {
    const info = await this.prisma.gADInformacion.findFirst({
      orderBy: { id: 'asc' },
    });
    if (!info) {
      const entity = await this.prisma.gADInformacion.create({
        data: { ...dto, usuarioCreadorId: userId, fechaActualizacion: new Date() } as Prisma.GADInformacionCreateInput,
      });
      return toGADInformacionResponse(entity);
    }
    const entity = await this.prisma.gADInformacion.update({
      where: { id: info.id },
      data: { ...dto, usuarioActualizadorId: userId, fechaActualizacion: new Date() } as Prisma.GADInformacionUpdateInput,
    });
    return toGADInformacionResponse(entity);
  }

  async uploadGADImage(type: string, file: Express.Multer.File, userId: string) {
    if (!['logo', 'header', 'footer'].includes(type)) {
      throw new BadRequestException('Tipo de imagen no válido. Debe ser "logo", "header" o "footer".');
    }
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo (campo "file")');
    }

    // Guardar la imagen usando PhotoService
    const key = await this.photos.store('gad', type, file);
    const relativeUrl = `/api/cementerios/gad-informacion/image?key=${encodeURIComponent(key)}`;

    const info = await this.prisma.gADInformacion.findFirst({
      orderBy: { id: 'asc' },
    });

    const data: any = {
      fechaActualizacion: new Date(),
      usuarioActualizadorId: userId,
    };

    let prevKey: string | null = null;

    if (type === 'logo') {
      data.logoUrl = relativeUrl;
      if (info) prevKey = info.logo;
      data.logo = key;
    } else if (type === 'header') {
      data.headerImagenUrl = relativeUrl;
      if (info) prevKey = info.headerImagenUrl ? this.extractKeyFromUrl(info.headerImagenUrl) : null;
    } else if (type === 'footer') {
      data.footerImagenUrl = relativeUrl;
      if (info) prevKey = info.footerImagenUrl ? this.extractKeyFromUrl(info.footerImagenUrl) : null;
    }

    if (!info) {
      const entity = await this.prisma.gADInformacion.create({
        data: {
          nombre: 'GAD CHECA',
          direccion: 'Eloy Riera, Parroquia Checa',
          telefono: '0987654321',
          email: '',
          ruc: '',
          slogan: '',
          website: '',
          mision: '',
          vision: '',
          usuarioCreadorId: userId,
          ...data,
        } as Prisma.GADInformacionCreateInput,
      });
      return { url: relativeUrl, logoUrl: relativeUrl };
    }

    const entity = await this.prisma.gADInformacion.update({
      where: { id: info.id },
      data,
    });

    if (prevKey) {
      try {
        await this.photos.remove(prevKey);
      } catch {
        // best-effort
      }
    }

    return { url: relativeUrl, logoUrl: relativeUrl };
  }

  async getGADImage(key: string) {
    if (!key || !key.startsWith('gad/')) {
      throw new BadRequestException('Clave de archivo no válida');
    }
    if (!(await this.photos.exists(key))) {
      throw new NotFoundException('Imagen no encontrada');
    }
    return this.photos.streamFor(key);
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      const match = url.match(/[?&]key=([^&]+)/);
      return match ? decodeURIComponent(match[1]) : null;
    } catch {
      return null;
    }
  }
}
