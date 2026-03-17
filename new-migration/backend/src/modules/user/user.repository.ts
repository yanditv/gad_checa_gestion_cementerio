import { Injectable } from "@nestjs/common";
import { Prisma } from '@prisma/client';
import { PrismaService } from "../../prisma/prisma.service";

type UserMutation = {
  identificationNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  identificationType?: string;
  isActive?: boolean;
};

type UserRegistration = UserMutation & {
  passwordHash: string;
};

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(search?: string) {
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { identificationNumber: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    return this.user.findMany({
      where,
      select: {
        id: true,
        identificationNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        identificationType: true,
        isActive: true,
        createdAt: true,
        userRoles: {
          select: {
            roleId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string) {
    return this.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async update(id: string, data: UserMutation) {
    return this.user.update({
      where: { id },
      data: this.mapUpdate(data),
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    return this.user.update({ where: { id }, data: { isActive } });
  }

  findExistingUser(email: string, identificationNumber: string) {
    return this.user.findFirst({
      where: {
        OR: [{ email }, { identificationNumber }],
      },
    });
  }

  createUser(data: UserRegistration) {
    return this.user.create({
      data: {
        identificationNumber: data.identificationNumber ?? '',
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        email: data.email ?? '',
        passwordHash: data.passwordHash,
        phone: data.phone ?? null,
        address: data.address ?? null,
        identificationType: data.identificationType ?? 'Cedula',
        isActive: data.isActive ?? true,
      },
    });
  }

  findUserByEmail(email: string) {
    return this.user.findUnique({
      where: { email },
    });
  }

  findProfileById(userId: string) {
    return this.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        identificationType: true,
        identificationNumber: true,
      },
    });
  }

  findRolesByIds(roleIds: string[]) {
    return this.prisma.role.findMany({
      where: {
        id: { in: roleIds },
      },
    });
  }

  async replaceRoles(userId: string, roleIds: string[]) {
    await this.prisma.userRole.deleteMany({
      where: { userId },
    });

    if (roleIds.length === 0) {
      return;
    }

    await this.prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({ userId, roleId })),
      skipDuplicates: true,
    });
  }

  private get user() {
    return this.prisma.user;
  }

  private mapUpdate(data: UserMutation): Prisma.UserUpdateInput {
    const updateData: Prisma.UserUpdateInput = {};

    if (data.identificationNumber !== undefined) {
      updateData.identificationNumber = data.identificationNumber;
    }

    if (data.firstName !== undefined) {
      updateData.firstName = data.firstName;
    }

    if (data.lastName !== undefined) {
      updateData.lastName = data.lastName;
    }

    if (data.email !== undefined) {
      updateData.email = data.email;
    }

    if (data.phone !== undefined) {
      updateData.phone = data.phone;
    }

    if (data.address !== undefined) {
      updateData.address = data.address;
    }

    if (data.identificationType !== undefined) {
      updateData.identificationType = data.identificationType;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    return updateData;
  }
}
