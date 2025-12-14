# Migración Automática del Catastro

Este documento describe el sistema de migración automática del archivo `CATASTRO_FINAL.xlsx` implementado en la aplicación.

## Funcionamiento

### Ejecución Automática
La migración se ejecuta automáticamente cuando la aplicación inicia, **SOLO** si:
1. El archivo `CATASTRO_FINAL.xlsx` existe en el directorio raíz del proyecto
2. No existen contratos en la base de datos (es decir, es la primera ejecución)

### Estructura del Excel Analizada

El sistema reconoce las siguientes secciones del archivo Excel:

| Columna | Descripción | Campo Mapeado |
|---------|-------------|---------------|
| A | Número | Número de bóveda |
| B | Nombre | Nombre del difunto |
| C | Fecha Contrato | Fecha de inicio del contrato |
| D | Fecha vencimiento | Fecha de fin del contrato |
| E | Propio | Indica si es propio (x) |
| F | Arrendado | Indica si es arrendado (x) |
| G | Reutilización arriendo | Información adicional |
| H | Representante | Nombre del responsable/representante |
| I | Contacto | Teléfono de contacto |
| J | Correo Electrónico | Email de contacto |
| K | Observaciones | Observaciones del contrato |

### Secciones Reconocidas

El sistema identifica automáticamente estas secciones:
- **"BLOQUES DE Nicho PARTE INFERIOR"** → Bloque: "Nicho Parte Inferior" (Tipo: Nicho)
- **"SOBRE BLOQUE 'B' PARTE FRONTAL"** → Bloque: "Bloque B Frontal" (Tipo: Bóvedas)  
- **"SOBRE BLOQUE 'B' PARTE POSTERIOR"** → Bloque: "Bloque B Posterior" (Tipo: Bóvedas)

## Proceso de Migración

### 1. Creación de Estructura Base
- **Cementerio**: "Cementerio Municipal de Checa"
- **Bloques**: Basados en las secciones encontradas
- **Pisos**: Un piso por cada bloque (Piso 1)
- **Usuario de Migración**: `migracion@sistema.com` (creado automáticamente)

### 2. Migración de Datos
Para cada fila del Excel:
1. **Bóveda**: Se crea basada en el número y la sección
2. **Difunto**: Se extrae del nombre completo (división en nombres/apellidos)
3. **Persona Responsable**: Se crea basada en el campo "Representante"
4. **Contrato**: Se vincula bóveda + difunto + responsable

### 3. Datos Generados Automáticamente

| Campo | Valor por Defecto |
|-------|-------------------|
| Número de Identificación | "9999999999" (temporal) |
| Fecha de Nacimiento (Difunto) | 70 años antes de hoy |
| Fecha de Fallecimiento | 30 días antes de hoy |
| Número de Meses (Contrato) | Calculado entre fechas o 60 meses |
| Monto Total | $250.00 (arrendado) / $0.00 (propio) |
| Teléfono | Campo "Contacto" o "N/A" |
| Email | Campo "Correo" o "no-email@ejemplo.com" |
| Dirección | "No especificada" |

## Archivos Involucrados

### Servicios
- `Services/CatastroMigrationService.cs` - Lógica principal de migración
- `Program.cs` - Configuración y ejecución automática

### Scripts
- `Scripts/run_migration.sql` - Verificación post-migración

### Dependencias
- `EPPlus 7.5.4` - Lectura de archivos Excel
- `EntityFramework Core` - Persistencia de datos

## Logs y Monitoreo

### Logs de Éxito
```
✅ Migración del catastro completada exitosamente:
   - Bloques creados: 3
   - Pisos creados: 3  
   - Bóvedas creadas: 115
   - Personas creadas: 87
   - Difuntos creados: 115
   - Contratos creados: 115
   - Registros procesados: 115
```

### Logs de Información
- `"Ya existen contratos en la base de datos. Saltando migración del catastro."`
- `"Archivo CATASTRO_FINAL.xlsx no encontrado. Saltando migración del catastro."`

### Archivo Post-Migración
Después de una migración exitosa, el archivo se renombra automáticamente:
- `CATASTRO_FINAL.xlsx` → `CATASTRO_FINAL_MIGRADO_YYYYMMDD_HHMMSS.xlsx`

## Verificación Post-Migración

Ejecutar el script `Scripts/run_migration.sql` para verificar:
- Cantidad de registros creados por tabla
- Distribución de contratos por bloque
- Integridad referencial (sin datos huérfanos)
- Validación de relaciones (contrato ↔ difunto ↔ bóveda)

## Consideraciones Importantes

### Limitaciones
- **Una sola ejecución**: La migración solo se ejecuta si no hay contratos existentes
- **Datos temporales**: Cédulas, fechas de nacimiento y direcciones usan valores por defecto
- **División de nombres**: La separación nombres/apellidos es automática y puede requerir ajustes manuales

### Seguridad
- El archivo se renombra automáticamente para evitar re-ejecuciones accidentales
- Los errores no interrumpen el inicio de la aplicación
- Usuario de migración con credenciales conocidas: `migracion@sistema.com` / `Migracion123!`

### Mantenimiento
- Revisar logs de aplicación para detectar errores de migración
- Validar datos migrados con el script SQL proporcionado
- Realizar ajustes manuales de datos temporales según sea necesario

## Solución de Problemas

### Error: "No se pudo acceder a la hoja de Excel"
- Verificar que el archivo no esté abierto en Excel
- Confirmar que el archivo tiene la extensión `.xlsx`
- Verificar permisos de lectura del archivo

### Error: "Contrato no encontrado"  
- Revisar que las columnas del Excel mantengan el formato esperado
- Verificar que las secciones estén correctamente identificadas

### Datos Faltantes
- Ejecutar el script de verificación SQL
- Revisar logs para identificar filas problemáticas
- Completar manualmente datos temporales según sea necesario