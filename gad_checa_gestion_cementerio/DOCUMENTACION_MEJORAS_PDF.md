# Mejoras en el Manejo de Errores de PDFs

## Resumen

Se ha implementado un sistema robusto y uniforme para el manejo de errores en la generación de documentos PDF en toda la aplicación del sistema de gestión de cementerio.

## Archivos Creados/Modificados

### Nuevos Archivos

1. **`Utils/PdfExceptions.cs`**

   - Definición de excepciones específicas para PDFs
   - `PdfException`: Excepción base
   - `PdfServiceUnavailableException`: Servicio no disponible
   - `PdfDataException`: Datos faltantes o inválidos
   - `PdfGenerationException`: Error durante la generación

2. **`Utils/PdfErrorHandler.cs`**
   - Clase helper con métodos estáticos para manejo consistente de errores
   - Métodos sincrónicos y asincrónicos
   - Validación automática de QuestPDF
   - Manejo centralizado de logging y mensajes de error

### Archivos Modificados

1. **`Services/PdfService.cs`**

   - Actualizado para usar las nuevas excepciones
   - Validación mejorada de datos requeridos
   - Manejo más específico de errores

2. **`Controllers/CobrosController.cs`**

   - Método `FacturaPdf()` actualizado con manejo robusto de errores

3. **`Controllers/ReportesController.cs`**

   - `CuentasPorCobrarPdf()` - Actualizado
   - `BovedasPdf()` - Actualizado
   - `IngresosPorFechaPdf()` - Actualizado

4. **`Controllers/ContratosController.cs`**
   - `GenerarContratoPDF()` - Actualizado
   - `Print()` - Actualizado
   - `TestPDF()` - Actualizado
   - `VerContratoPDF()` - Actualizado

## Características Implementadas

### 1. **Manejo Centralizado de Errores**

```csharp
return PdfErrorHandler.ExecutePdfOperation(() => {
    // Lógica de generación de PDF
}, _logger, this, "Index", "Operación específica");
```

### 2. **Validación Automática**

- Verificación automática de disponibilidad de QuestPDF
- Validación de datos requeridos antes de la generación
- Configuración automática de licencia

### 3. **Excepciones Específicas**

- `PdfServiceUnavailableException`: Cuando QuestPDF no está disponible
- `PdfDataException`: Cuando faltan datos requeridos
- `PdfGenerationException`: Errores durante la creación del documento

### 4. **Logging Detallado**

- Logging específico por tipo de error
- Información contextual para debugging
- Mensajes diferenciados para usuarios y administradores

### 5. **Mensajes de Error Amigables**

- Mensajes específicos según el tipo de error
- Redirección automática a páginas apropiadas
- Información clara para el usuario final

## Beneficios

### Para Desarrolladores

- **Código más limpio**: Eliminación de bloques try-catch repetitivos
- **Mantenimiento simplificado**: Lógica centralizada de manejo de errores
- **Debugging mejorado**: Logs detallados y específicos
- **Reutilización**: Un solo helper para todos los controladores

### Para Usuarios

- **Experiencia mejorada**: Mensajes de error claros y útiles
- **Estabilidad**: La aplicación no se rompe por errores de PDF
- **Información útil**: Indicaciones específicas sobre qué hacer en caso de error

### Para Administradores

- **Monitoreo mejorado**: Logs detallados para identificar problemas
- **Diagnóstico rápido**: Información específica sobre la causa de errores
- **Mantenimiento preventivo**: Identificación temprana de problemas

## Uso

### Método Síncrono

```csharp
public IActionResult GenerarPdf()
{
    return PdfErrorHandler.ExecutePdfOperation(() =>
    {
        // Validar datos
        PdfErrorHandler.ValidateRequiredData(datos, "Descripción de datos");

        // Generar PDF
        var pdf = PdfErrorHandler.GeneratePdfSafely(() => documento.GeneratePdf(), "Nombre documento");

        return File(pdf, "application/pdf", "archivo.pdf");
    }, _logger, this, "Index", "Descripción de operación");
}
```

### Método Asíncrono

```csharp
public async Task<IActionResult> GenerarPdfAsync()
{
    return await PdfErrorHandler.ExecutePdfOperationAsync(async () =>
    {
        // Lógica async aquí
        var pdf = await _pdfService.GenerateAsync(datos);
        return File(pdf, "application/pdf", "archivo.pdf");
    }, _logger, this, "Index", "Descripción de operación");
}
```

## Configuración de QuestPDF

El sistema ahora maneja automáticamente:

- Configuración de licencia Community
- Verificación de disponibilidad del servicio
- Manejo de errores de inicialización

## Próximos Pasos Recomendados

1. **Implementar en documentos PDF adicionales** que puedan existir en otros controladores
2. **Configurar métricas** para monitorear errores de PDF en producción
3. **Implementar cache** para validaciones repetitivas de QuestPDF
4. **Crear tests unitarios** para los nuevos helpers de manejo de errores

## Consideraciones de Producción

- Los logs se escriben con diferentes niveles según la gravedad
- Los mensajes de error no exponen información sensible
- El sistema degrada graciosamente cuando PDF no está disponible
- Se mantiene la funcionalidad principal de la aplicación incluso con errores de PDF
