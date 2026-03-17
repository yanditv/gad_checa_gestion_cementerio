import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { User } from "./user.entity";

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: any) {
    return this.user.findMany({
      where: query,
      include: {
        userRoles: {
          include: { role: true },
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

  async update(id: string, data: User) {
    const updateData: Partial<User> = {};

    updateData.identificationNumber = data.identificationNumber ?? updateData.identificationNumber;
    updateData.firstName = data.firstName ?? updateData.firstName;
    updateData.lastName = data.lastName ?? updateData.lastName;
    updateData.email = data.email ?? updateData.email;
    updateData.phone = data.phone ?? updateData.phone;
    updateData.address = data.address ?? updateData.address;
    updateData.identificationType = data.identificationType ?? updateData.identificationType;
    updateData.password = data.password ?? updateData.password;
    updateData.active = data.active ?? updateData.active;

    return this.user.update({
      where: { id },
      data: updateData,
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    return this.user.update({
      where: { id },
      data: {
        isActive,
      },
    });
  }

  findExistingUser(email: string, identificationNumber: string) {
    return this.user.findFirst({
      where: {
        OR: [{ email }, { identificationNumber }],
      },
    });
  }

  createUser(data: User) {
    return this.user.create({ data });
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

  private get user() {
    return this.prisma.user;
  }
}
