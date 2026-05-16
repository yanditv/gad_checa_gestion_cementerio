import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateCementerioDto } from './dto/request/update-cementerio.dto';
import { UpdateGADInformacionDto } from './dto/request/gad-informacion.dto';
import { toCementerioResponse, toGADInformacionResponse } from './cementerio.mapper';

@Injectable()
export class CementerioService {
  constructor(private prisma: PrismaService) {}

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
}
