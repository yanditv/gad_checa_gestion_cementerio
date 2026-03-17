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
        usuarioRols: {
          include: { rol: true },
        },
      },
      orderBy: { fechaCreacion: "desc" },
    });
  }

  async findById(id: string) {
    return this.user.findUnique({
      where: { id },
      include: {
        usuarioRols: {
          include: { rol: true },
        },
      },
    });
  }

  async update(id: string, data: User) {
    return this.user.update({
      where: { id },
      data,
      include: {
        usuarioRoles: {
          include: { rol: true },
        },
      },
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    return this.user.update({
      where: { id },
      data: {
        estado: isActive,
      },
    });
  }

  findExistingUser(email: string, numeroIdentificacion: string) {
    return this.user.findFirst({
      where: {
        OR: [{ email }, { numeroIdentificacion }],
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
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        direccion: true,
        tipoIdentificacion: true,
        numeroIdentificacion: true,
      },
    });
  }

  private get user() {
    return this.prisma.usuario;
  }
}
