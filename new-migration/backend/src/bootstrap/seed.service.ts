import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CatastroImportService } from './catastro-import.service';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catastroImportService: CatastroImportService,
  ) {}

  async run() {
    const adminUser = await this.seedRolesAndAdmin();
    await this.seedInitialData(adminUser.id);
    await this.catastroImportService.run(adminUser.id);
  }

  private async seedRolesAndAdmin() {
    const roles = ['Admin', 'Usuario', 'Administrador'];

    for (const roleName of roles) {
      await this.prisma.rol.upsert({
        where: { nombre: roleName },
        update: {},
        create: {
          nombre: roleName,
          nombreNormalizado: roleName.toUpperCase(),
          concurrencyStamp: randomUUID(),
        },
      });
    }

    const passwordHash = await bcrypt.hash('Admin123!', 10);
    const adminEmail = 'admin@teobu.com';

    const adminUser = await this.prisma.usuario.upsert({
      where: { email: adminEmail },
      update: {
        estado: true,
      },
      create: {
        numeroIdentificacion: '9999999999',
        nombre: 'Administrador',
        apellido: 'Sistema',
        email: adminEmail,
        passwordHash,
        telefono: '',
        direccion: '',
        tipoIdentificacion: 'CED',
        estado: true,
      },
    });

    const roleAdministrador = await this.prisma.rol.findUnique({
      where: { nombre: 'Administrador' },
      select: { id: true },
    });

    if (roleAdministrador) {
      await this.prisma.usuarioRol.upsert({
        where: {
          usuarioId_rolId: {
            usuarioId: adminUser.id,
            rolId: roleAdministrador.id,
          },
        },
        update: {},
        create: {
          usuarioId: adminUser.id,
          rolId: roleAdministrador.id,
        },
      });
    }

    this.logger.log('Roles y usuario administrador verificados');
    return adminUser;
  }

  private async seedInitialData(adminUserId: string) {
    await this.prisma.gADInformacion.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nombre: 'GAD CHECA',
        direccion: 'Eloy Riera, Parroquia Checa',
        telefono: '0987654321',
        email: '',
        ruc: '',
        slogan: '',
      },
    });

    await this.prisma.cementerio.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nombre: 'Cementerio de checa',
        direccion: 'Eloy Riera, Parroquia Checa',
        telefono: '0987654321',
        email: 'jpcheca0@gmail.com',
        estado: true,
        usuarioCreadorId: adminUserId,
      },
    });

    const descuentos = [
      { nombre: 'Ninguno', porcentaje: 0 },
      { nombre: '50%', porcentaje: 50 },
      { nombre: '100%', porcentaje: 100 },
    ];

    for (const descuento of descuentos) {
      const exists = await this.prisma.descuento.findFirst({
        where: { nombre: descuento.nombre },
        select: { id: true },
      });

      if (!exists) {
        await this.prisma.descuento.create({
          data: {
            nombre: descuento.nombre,
            descripcion: descuento.nombre,
            porcentaje: descuento.porcentaje,
            estado: true,
            fechaInicio: new Date(),
            usuarioCreadorId: adminUserId,
          },
        });
      }
    }

    this.logger.log('Datos iniciales verificados');
  }
}
