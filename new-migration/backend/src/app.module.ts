import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CementerioModule } from './modules/cementerio/cementerio.module';
import { BloqueModule } from './modules/bloque/bloque.module';
import { BovedaModule } from './modules/boveda/boveda.module';
import { ContratoModule } from './modules/contrato/contrato.module';
import { PersonaModule } from './modules/persona/persona.module';
import { DifuntoModule } from './modules/difunto/difunto.module';
import { PagoModule } from './modules/pago/pago.module';
import { CuotaModule } from './modules/cuota/cuota.module';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { RolModule } from './modules/rol/rol.module';
import { SeedService } from './bootstrap/seed.service';
import { CatastroImportService } from './bootstrap/catastro-import.service';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    UsuarioModule,
    RolModule,
  ],
  providers: [
    SeedService,
    CatastroImportService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
