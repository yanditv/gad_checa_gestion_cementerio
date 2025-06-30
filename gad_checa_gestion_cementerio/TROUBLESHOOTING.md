# Guía de Resolución de Problemas - Sistema de Gestión de Cementerio

## Problemas Comunes en Producción

### 1. Errores de Permisos en Docker/Linux

#### Síntomas:

- Error "Access denied" al subir documentos
- Errores de escritura en `/app/wwwroot/documentos`
- Fallos al generar archivos PDF

#### Solución:

```bash
# Verificar permisos dentro del contenedor
docker exec -it <container-name> /app/verify-permissions.sh

# Si hay problemas, ejecutar como root:
docker exec -u root -it <container-name> bash

# Dentro del contenedor:
chmod -R 777 /app/wwwroot/documentos
chown -R appuser:appuser /app/wwwroot/documentos
```

#### Prevención:

- El Dockerfile ya incluye configuración automática de permisos
- Los directorios se crean con permisos 777 para documentos
- El usuario `appuser` tiene ownership de los directorios críticos

### 2. Errores de Layout en PDF (QuestPDF)

#### Síntomas:

- "DocumentLayoutException: conflicting size constraints"
- PDFs que no se generan correctamente

#### Solución Automática:

- El sistema tiene un mecanismo de fallback automático
- Si falla la generación del PDF principal, se genera un PDF simplificado
- Los errores se registran en los logs para debugging

#### Verificación:

```bash
# Ver logs de errores de PDF
docker logs <container-name> | grep -i "pdf\|layout\|questpdf"
```

#### Configuración:

- QuestPDF debugging está habilitado en producción
- Textos se truncan automáticamente para evitar desbordamientos
- Fuentes reducidas para minimizar problemas de espacio

### 3. Variables de Entorno Requeridas

#### Críticas:

```bash
DB_CONNECTION_STRING=<conexión-base-datos>
APP_ENV=Production
```

#### Opcionales:

```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
```

### 4. Verificación de Componentes

#### Base de Datos:

```bash
# Verificar conexión
docker exec -it <container-name> dotnet gad_checa_gestion_cementerio.dll --verify-db
```

#### wkhtmltopdf:

```bash
# Verificar que esté disponible
docker exec -it <container-name> /app/wwwroot/Rotativa/wkhtmltopdf --version
```

#### Data Protection Keys:

```bash
# Verificar directorio de claves
docker exec -it <container-name> ls -la /app/keys/
```

### 5. Comandos de Diagnóstico

#### Estado del contenedor:

```bash
docker ps
docker logs <container-name>
docker exec -it <container-name> /app/verify-permissions.sh
```

#### Verificación de archivos:

```bash
# Listar documentos subidos
docker exec -it <container-name> ls -la /app/wwwroot/documentos/

# Verificar espacio en disco
docker exec -it <container-name> df -h
```

#### Logs de aplicación:

```bash
# Ver logs en tiempo real
docker logs -f <container-name>

# Filtrar por errores
docker logs <container-name> 2>&1 | grep -i error
```

### 6. Reconstrucción de Imagen

Si hay problemas persistentes:

```bash
# Limpiar y reconstruir
docker stop <container-name>
docker rm <container-name>
docker rmi <image-name>

# Reconstruir imagen
docker build -t <image-name> .

# Ejecutar con verificación
docker run -d --name <container-name> \
  -e DB_CONNECTION_STRING="<connection-string>" \
  -e APP_ENV="Production" \
  -p 8080:8080 \
  <image-name>

# Verificar inmediatamente
docker exec -it <container-name> /app/verify-permissions.sh
```

### 7. Monitoreo Continuo

#### Logs críticos a monitorear:

- Errores de permisos de archivos
- Fallos en generación de PDF
- Errores de conexión a base de datos
- Problemas de Data Protection

#### Métricas importantes:

- Espacio en disco (especialmente `/app/wwwroot/documentos`)
- Tiempo de respuesta de generación de PDF
- Éxito/fallo en subida de documentos

## Contacto de Soporte

Para problemas no cubiertos en esta guía, revisar:

1. Logs completos del contenedor
2. Variables de entorno configuradas
3. Estado de la base de datos
4. Espacio disponible en disco

Incluir esta información al reportar problemas.
