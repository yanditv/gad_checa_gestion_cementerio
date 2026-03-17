import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../common/services/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CadastralImportService } from './cadastral-import.service';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cadastralImportService: CadastralImportService,
  ) {}

  async run() {
    const adminUser = await this.seedRolesAndAdmin();
    await this.seedInitialData(adminUser.id);
    await this.cadastralImportService.run(adminUser.id);
  }

  private async seedRolesAndAdmin() {
    const roles = ['Admin', 'User', 'Administrator'];

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
        firstName: 'System',
        lastName: 'Administrator',
        email: adminEmail,
        passwordHash,
        phone: '',
        address: '',
        identificationType: 'CED',
        isActive: true,
      },
    });

    const administratorRole = await this.prisma.role.findUnique({
      where: { name: 'Administrator' },
      select: { id: true },
    });

    if (administratorRole) {
      await this.prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: adminUser.id,
            roleId: administratorRole.id,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          roleId: administratorRole.id,
        },
      });
    }

    this.logger.log('Roles and administrator user verified');
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
      where: { name: 'Checa Cemetery' },
      select: { id: true },
    });

    if (!existingCemetery) {
      const cemetery = await this.prisma.cemetery.create({
        data: {
          name: 'Checa Cemetery',
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

    this.logger.log('Initial data verified');
  }
}
