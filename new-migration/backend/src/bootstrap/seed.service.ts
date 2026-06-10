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
        logoUrl: '',
        website: '',
        mision: '',
        vision: '',
        usuarioCreadorId: adminUserId,
      },
    });

    // Valores semilla idénticos al legado (Program.cs:461-481).
    await this.prisma.cementerio.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nombre: 'Cementerio de checa',
        direccion: 'Eloy Riera, Parroquia Checa',
        telefono: '0987654321',
        email: 'jpcheca0@gmail.com',
        abreviaturaTituloPresidente: 'Sr.',
        presidente: 'Bolívar Robles Iñamagua',
        vecesRenovacionBovedas: 1,
        vecesRenovacionNicho: 1,
        aniosArriendoBovedas: 5,
        aniosArriendoNicho: 5,
        tarifaArriendo: 240.0,
        tarifaArriendoNicho: 240.0,
        tasaMoraDiaria: 0,
        estado: true,
        usuarioCreadorId: adminUserId,
      },
    });

    // Catálogo de tipos de espacio (reemplaza la dualidad cableada Bóveda/Nicho).
    // Valores alineados con los parámetros semilla del Cementerio id=1.
    const tiposEspacio = [
      {
        nombre: 'Bóveda',
        prefijoNumeracion: 'CTR',
        tarifaArriendo: 240.0,
        aniosArriendo: 5,
        vecesRenovacion: 1,
      },
      {
        nombre: 'Nicho',
        prefijoNumeracion: 'NCH',
        tarifaArriendo: 240.0,
        aniosArriendo: 5,
        vecesRenovacion: 1,
      },
    ];

    for (const tipo of tiposEspacio) {
      await this.prisma.tipoEspacio.upsert({
        where: { nombre: tipo.nombre },
        update: {},
        create: {
          nombre: tipo.nombre,
          prefijoNumeracion: tipo.prefijoNumeracion,
          tarifaArriendo: tipo.tarifaArriendo,
          aniosArriendo: tipo.aniosArriendo,
          vecesRenovacion: tipo.vecesRenovacion,
          estado: true,
          usuarioCreadorId: adminUserId,
        },
      });
    }

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

    await this.seedCategoriasBien(adminUserId);

    this.logger.log('Datos iniciales verificados');
  }

  // Catálogo de categorías de bienes para el Módulo de Inventario (TDR Módulo 1).
  // Vidas útiles y valor residual según Norma de Control Interno CGE 406-03.
  // PROVISIONAL: confirmar la tabla oficial con el GAD El Valle / Contraloría
  // antes de la entrega; estos valores son los estándar del sector público.
  private async seedCategoriasBien(adminUserId: string) {
    const categorias = [
      { nombre: 'Mueble y enser', vidaUtilAnios: 10 },
      { nombre: 'Maquinaria y equipo', vidaUtilAnios: 10 },
      { nombre: 'Equipo de cómputo', vidaUtilAnios: 3 },
      { nombre: 'Equipo de comunicación', vidaUtilAnios: 10 },
      { nombre: 'Vehículo', vidaUtilAnios: 5 },
      { nombre: 'Herramienta', vidaUtilAnios: 10 },
      { nombre: 'Equipo médico', vidaUtilAnios: 10 },
    ];

    for (const categoria of categorias) {
      const exists = await this.prisma.categoriaBien.findFirst({
        where: { nombre: categoria.nombre },
        select: { id: true },
      });

      if (!exists) {
        await this.prisma.categoriaBien.create({
          data: {
            nombre: categoria.nombre,
            vidaUtilAnios: categoria.vidaUtilAnios,
            valorResidualPct: 10,
            estado: true,
            usuarioCreadorId: adminUserId,
          },
        });
      }
    }
  }
}
