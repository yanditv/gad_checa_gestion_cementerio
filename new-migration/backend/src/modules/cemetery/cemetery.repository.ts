import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cemetery } from './cemetery.entity';

@Injectable()
export class CemeteryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.cemetery.findUnique({
      where: { id },
      include: { blocks: { where: { isActive: true }, include: { vaults: true } } },
    });
  }

  create(data: Cemetery) {
    return this.cemetery.create({
      data: {
        name: data.name ?? '',
        address: data.address ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        taxId: data.taxId ?? null,
        isActive: data.isActive ?? true,
      },
    });
  }

  update(id: string, data: Partial<Cemetery>) {
    const updateData: Partial<Cemetery> = {};

    updateData.name = data.name ?? updateData.name;
    updateData.address = data.address ?? updateData.address;
    updateData.phone = data.phone ?? updateData.phone;
    updateData.email = data.email ?? updateData.email;
    updateData.taxId = data.taxId ?? updateData.taxId;
    updateData.isActive = data.isActive ?? updateData.isActive;

    return this.cemetery.update({
      where: { id },
      data: updateData,
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
}