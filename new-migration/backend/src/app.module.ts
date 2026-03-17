import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import appConfig from './config/appConfig';
import { AuthModule } from './modules/auth/auth.module';
import { CementerioModule } from './modules/cementerio/cementerio.module';
import { BloqueModule } from './modules/bloque/bloque.module';
import { BovedaModule } from './modules/boveda/boveda.module';
import { ContratoModule } from './modules/contrato/contrato.module';
import { PersonaModule } from './modules/persona/persona.module';
import { DifuntoModule } from './modules/difunto/difunto.module';
import { PagoModule } from './modules/pago/pago.module';
import { CuotaModule } from './modules/cuota/cuota.module';
import { UserModule } from './modules/usuario/usuario.module';
import { RolModule } from './modules/rol/rol.module';
import { SeedService } from './bootstrap/seed.service';
import { CatastroImportService } from './bootstrap/catastro-import.service';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { AuditService } from './common/services/audit.service';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    PrismaModule,
    AuthModule,
    CementerioModule,
    BloqueModule,
    BovedaModule,
    ContratoModule,
    PersonaModule,
    DifuntoModule,
    PagoModule,
    CuotaModule,
    UserModule,
    RolModule,
  ],
  providers: [
    AuditService,
    SeedService,
    CatastroImportService,
  ],
})
export class AppModule {}
