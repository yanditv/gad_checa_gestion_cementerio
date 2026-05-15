import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './common/email/email.module';
import { StorageModule } from './common/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { CementerioModule } from './modules/cementerio/cementerio.module';
import { BloqueModule } from './modules/bloque/bloque.module';
import { BovedaModule } from './modules/boveda/boveda.module';
import { ContratoModule } from './modules/contrato/contrato.module';
import { PersonaModule } from './modules/persona/persona.module';
import { DifuntoModule } from './modules/difunto/difunto.module';
import { PagoModule } from './modules/pago/pago.module';
import { CuotaModule } from './modules/cuota/cuota.module';
import { DescuentoModule } from './modules/descuento/descuento.module';
import { BancoModule } from './modules/banco/banco.module';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { RolModule } from './modules/rol/rol.module';
import { ReportModule } from './modules/report/report.module';
import { CatastroModule } from './modules/catastro/catastro.module';
import { NotificacionModule } from './modules/notificacion/notificacion.module';
import { SeedService } from './bootstrap/seed.service';
import { CatastroImportService } from './bootstrap/catastro-import.service';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    EmailModule,
    StorageModule,
    AuthModule,
    CementerioModule,
    BloqueModule,
    BovedaModule,
    ContratoModule,
    PersonaModule,
    DifuntoModule,
    PagoModule,
    CuotaModule,
    DescuentoModule,
    BancoModule,
    UsuarioModule,
    RolModule,
    ReportModule,
    CatastroModule,
    NotificacionModule,
  ],
  providers: [
    SeedService,
    CatastroImportService,
    // Auth global: cualquier ruta requiere JWT salvo que tenga @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Roles encadenado al JwtAuthGuard: respeta @Roles(...).
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
