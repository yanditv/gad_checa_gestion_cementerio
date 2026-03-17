import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../common/services/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CatastroImportService } from './catastro-import.service';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
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
      await this.prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: {
          name: roleName,
          normalizedName: roleName.toUpperCase(),
          permissions: null,
        },
      });
    }

    const passwordHash = await bcrypt.hash('Admin123!', 10);
    const adminEmail = 'admin@teobu.com';

    const adminUser = await this.prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        isActive: true,
      },
      create: {
        identificationNumber: '9999999999',
        firstName: 'Administrador',
        lastName: 'Sistema',
        email: adminEmail,
        passwordHash,
        phone: '',
        address: '',
        identificationType: 'CED',
        isActive: true,
      },
    });

    const roleAdministrador = await this.prisma.role.findUnique({
      where: { name: 'Administrador' },
      select: { id: true },
    });

    if (roleAdministrador) {
      await this.prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: adminUser.id,
            roleId: roleAdministrador.id,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          roleId: roleAdministrador.id,
        },
      });
    }

    this.logger.log('Roles y usuario administrador verificados');
    return adminUser;
  }

  private async seedInitialData(adminUserId: string) {
    const existingGovernmentInfo = await this.prisma.governmentInfo.findFirst({
      where: { name: 'GAD CHECA' },
      select: { id: true },
    });

    if (!existingGovernmentInfo) {
      await this.prisma.governmentInfo.create({
        data: {
          name: 'GAD CHECA',
          address: 'Eloy Riera, Parroquia Checa',
          phone: '0987654321',
          email: '',
          taxId: '',
          slogan: '',
        },
      });
    }

    const existingCemetery = await this.prisma.cemetery.findFirst({
      where: { name: 'Cementerio de checa' },
      select: { id: true },
    });

    if (!existingCemetery) {
      const cemetery = await this.prisma.cemetery.create({
        data: {
          name: 'Cementerio de checa',
          address: 'Eloy Riera, Parroquia Checa',
          phone: '0987654321',
          email: 'jpcheca0@gmail.com',
          isActive: true,
        },
      });

      await this.auditService.log({
        action: 'CREATE',
        entityName: 'Cemetery',
        entityId: cemetery.id,
        actorId: adminUserId,
        details: {
          source: 'seed',
        },
      });
    }

    const discounts = [
      { name: 'Ninguno', percentage: 0 },
      { name: '50%', percentage: 50 },
      { name: '100%', percentage: 100 },
    ];

    for (const discount of discounts) {
      const exists = await this.prisma.discount.findFirst({
        where: { name: discount.name },
        select: { id: true },
      });

      if (!exists) {
        const createdDiscount = await this.prisma.discount.create({
          data: {
            name: discount.name,
            description: discount.name,
            percentage: discount.percentage,
            isActive: true,
            startDate: new Date(),
          },
        });

        await this.auditService.log({
          action: 'CREATE',
          entityName: 'Discount',
          entityId: createdDiscount.id,
          actorId: adminUserId,
          details: {
            source: 'seed',
          },
        });
      }
    }

    this.logger.log('Datos iniciales verificados');
  }
}
