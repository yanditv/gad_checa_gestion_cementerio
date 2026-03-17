import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type CemeteryMutation = {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  isActive?: boolean;
};

@Injectable()
export class CemeteryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.cemetery.findUnique({
      where: { id },
      include: { blocks: { where: { isActive: true }, include: { vaults: true } } },
    });
  }

  create(data: CemeteryMutation) {
    return this.cemetery.create({
      data: this.mapCreate(data),
    });
  }

  update(id: string, data: CemeteryMutation) {
    return this.cemetery.update({
      where: { id },
      data: this.mapUpdate(data),
    });
  }

  findActive() {
    return this.cemetery.findMany({
      where: { isActive: true },
      include: { blocks: { where: { isActive: true } } },
    });
  }

  private get cemetery() {
    return this.prisma.cemetery;
  }

  private mapCreate(data: CemeteryMutation): Prisma.CemeteryCreateInput {
    return {
      name: data.name ?? '',
      address: data.address ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      taxId: data.taxId ?? null,
      isActive: data.isActive ?? true,
    };
  }

  private mapUpdate(data: CemeteryMutation): Prisma.CemeteryUpdateInput {
    const updateData: Prisma.CemeteryUpdateInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.address !== undefined) {
      updateData.address = data.address;
    }

    if (data.phone !== undefined) {
      updateData.phone = data.phone;
    }

    if (data.email !== undefined) {
      updateData.email = data.email;
    }

    if (data.taxId !== undefined) {
      updateData.taxId = data.taxId;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    return updateData;
  }
}