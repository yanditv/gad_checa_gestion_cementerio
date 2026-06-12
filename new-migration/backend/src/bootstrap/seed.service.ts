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
    const contratoPreambulo =
      'En la Parroquia de {parroquia}, a los **{fechaInicioDia}** días del mes de **{fechaInicioMes}** del **{fechaInicioAnio}**, comparecen a celebrar el presente contrato de arrendamiento, por una parte y en calidad de arrendador, el {gadNombre}, debidamente representado por el **{presidente}**; por otro lado, el/la Sr/Sra. **{responsableNombre}** con número de identidad **{responsableCI}**, número de teléfono **{responsableTelefono}**, correo electrónico **{responsableEmail}**, los comparecientes son mayores de edad, capaces ante la ley para celebrar todo acto y contrato quienes celebran el presente contrato de arrendamiento de acuerdo con las siguientes cláusulas:';
    const contratoClausula1 =
      '**PRIMERA COMPARECIENTES. -** Comparecen por una parte el {gadNombre} representada por su presidente el **{presidente}**; a quien en lo posterior se lo llamará arrendador, y por otra parte comparece el/la Sr/Sra. **{responsableNombre}** a quien en lo posterior se le llamará Arrendatario.';
    const contratoClausula2 =
      '**SEGUNDA ANTECEDENTE. -** El {gadNombre} es la Institución Pública que administra el {cementerioNombre}, es por ello que se encuentra facultado para suscribir todo contrato de arrendamiento o venta de bóveda del cementerio.';
    const contratoClausula3 =
      '**TERCER OBJETO. -** El {gadNombre}, en su calidad de Administrador del {cementerioNombre}, por el presente contrato da en arriendo una bóveda a favor de quien en vida fue: **{difuntoNombre}** con número de cédula **{difuntoCI}**, restos que serán depositados en la bóveda número **{bovedaNumero}** en el bloque **{bloqueDescripcion}**{pisoTexto}.';
    const contratoClausula4 =
      '**CUARTA: PRECIO. -** El valor por arriendo de la Bóveda es de **{montoTotal}** valor que fue cancelado con depósito en {bancoTexto} cta. # **{numeroCuenta}**';
    const contratoClausula5 =
      '**QUINTA: OTRA. -** La parte arrendadora aclara que una vez que el {gadNombre} entrega el derecho de uso por **{aniosArriendo} años** a partir de la fecha del **{fechaInicioDia} de {fechaInicioMes} del {fechaInicioAnio}**, la parte arrendataria. Vence el contrato el **{fechaFinDia} de {fechaFinMes} del {fechaFinAnio}**.';
    const contratoClausula6 =
      '**SEXTA: -** Las partes por estar conforme con las estipulaciones del presente contrato, firman al pie del mismo y por duplicado para constancia de lo actuado suscriben.';

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
        contratoPreambulo,
        contratoClausula1,
        contratoClausula2,
        contratoClausula3,
        contratoClausula4,
        contratoClausula5,
        contratoClausula6,
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
      const existing = await this.prisma.tipoEspacio.findUnique({
        where: { nombre: tipo.nombre },
      });

      if (existing) {
        if (Number(existing.tarifaArriendo) === 0) {
          await this.prisma.tipoEspacio.update({
            where: { id: existing.id },
            data: {
              tarifaArriendo: tipo.tarifaArriendo,
              usuarioActualizadorId: adminUserId,
            },
          });
        }
      } else {
        await this.prisma.tipoEspacio.create({
          data: {
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
