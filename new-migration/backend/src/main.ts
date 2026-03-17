import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SeedService } from './bootstrap/seed.service';
import appConfig, { type AppConfig } from './config/appConfig';

async function bootstrap() {
  const aplicacion = await NestFactory.create(AppModule);
  const config = aplicacion.get<AppConfig>(appConfig.KEY);
  
  aplicacion.enableCors({
    origin: config.frontendUrl,
    credentials: config.cors.credentials,
  });

  aplicacion.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  const configuracionSwagger = new DocumentBuilder()
    .setTitle(config.swagger.title)
    .setDescription(config.swagger.description)
    .setVersion(config.swagger.version)
    .addBearerAuth()
    .build();
  
  const documento = SwaggerModule.createDocument(aplicacion, configuracionSwagger);
  SwaggerModule.setup(config.swagger.path, aplicacion, documento);

  await aplicacion.get(SeedService).run();

  await aplicacion.listen(config.port);
  console.log(`Servidor iniciado en http://localhost:${config.port}`);
}
bootstrap();
