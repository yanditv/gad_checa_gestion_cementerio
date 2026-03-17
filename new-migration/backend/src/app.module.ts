import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import appConfig from './config/appConfig';
import { AuthModule } from './modules/auth/auth.module';
import { CemeteryModule } from './modules/cemetery/cemetery.module';
import { BlockModule } from './modules/block/block.module';
import { VaultModule } from './modules/vault/vault.module';
import { ContractModule } from './modules/contract/contract.module';
import { PersonModule } from './modules/person/person.module';
import { DeceasedModule } from './modules/deceased/deceased.module';
import { PaymentModule } from './modules/payment/payment.module';
import { InstallmentModule } from './modules/installment/installment.module';
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { SeedService } from './bootstrap/seed.service';
import { CadastralImportService } from './bootstrap/cadastral-import.service';
import { CadastralImportPersistenceService } from './bootstrap/cadastral-import.persistence.service';
import { AuditService } from './common/services/audit.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    PrismaModule,
    AuthModule,
    CemeteryModule,
    BlockModule,
    VaultModule,
    ContractModule,
    PersonModule,
    DeceasedModule,
    PaymentModule,
    InstallmentModule,
    UserModule,
    RoleModule,
  ],
  providers: [
    AuditService,
    SeedService,
    CadastralImportPersistenceService,
    CadastralImportService,
  ],
})
export class AppModule {}
