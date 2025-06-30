using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using gad_checa_gestion_cementerio.Utils;
using QuestPDF.Infrastructure;
using QuestPDF.Fluent;
using QuestPDF.Helpers;

namespace gad_checa_gestion_cementerio.Utils
{
    /// <summary>
    /// Helper class para manejar errores de PDFs de manera consistente en todos los controladores
    /// </summary>
    public static class PdfErrorHandler
    {
        /// <summary>
        /// Ejecuta una operación de PDF con manejo robusto de errores
        /// </summary>
        /// <typeparam name="T">Tipo de retorno de la operación</typeparam>
        /// <param name="operation">Operación a ejecutar</param>
        /// <param name="logger">Logger para registrar errores</param>
        /// <param name="controller">Instancia del controlador que llama la operación</param>
        /// <param name="fallbackAction">Acción de respaldo en caso de error</param>
        /// <param name="operationName">Nombre descriptivo de la operación para logging</param>
        /// <param name="routeValues">Valores de ruta para el redirect en caso de error</param>
        /// <returns>Resultado de la operación o acción de respaldo en caso de error</returns>
        public static IActionResult ExecutePdfOperation<T>(
            Func<T> operation,
            ILogger logger,
            Controller controller,
            string fallbackAction = "Index",
            string operationName = "PDF generation",
            object? routeValues = null) where T : IActionResult
        {
            try
            {
                // Verificar si QuestPDF está disponible
                ValidateQuestPdfAvailability();

                logger.LogInformation("Starting {OperationName}", operationName);

                var result = operation();

                logger.LogInformation("{OperationName} completed successfully", operationName);
                return result;
            }
            catch (PdfServiceUnavailableException ex)
            {
                logger.LogError(ex, "PDF service unavailable during {OperationName}", operationName);
                SetErrorMessage(controller, "El servicio de generación de PDF no está disponible temporalmente. Por favor, inténtelo más tarde.");
                return controller.RedirectToAction(fallbackAction, routeValues);
            }
            catch (PdfDataException ex)
            {
                logger.LogError(ex, "Invalid data for {OperationName}: {Message}", operationName, ex.Message);
                SetErrorMessage(controller, $"Error en los datos requeridos: {ex.Message}");
                return controller.RedirectToAction(fallbackAction, routeValues);
            }
            catch (PdfGenerationException ex)
            {
                logger.LogError(ex, "PDF generation failed during {OperationName}: {Message}", operationName, ex.Message);
                SetErrorMessage(controller, "Error al generar el documento PDF. Por favor, contacte al administrador si el problema persiste.");
                return controller.RedirectToAction(fallbackAction, routeValues);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unexpected error during {OperationName}: {Message}", operationName, ex.Message);
                SetErrorMessage(controller, "Ha ocurrido un error inesperado. Por favor, contacte al administrador.");
                return controller.RedirectToAction(fallbackAction, routeValues);
            }
        }

        /// <summary>
        /// Versión async del manejo de errores para operaciones de PDF
        /// </summary>
        public static async Task<IActionResult> ExecutePdfOperationAsync<T>(
            Func<Task<T>> operation,
            ILogger logger,
            Controller controller,
            string fallbackAction = "Index",
            string operationName = "PDF generation",
            object? routeValues = null) where T : IActionResult
        {
            try
            {
                // Verificar si QuestPDF está disponible
                ValidateQuestPdfAvailability();

                logger.LogInformation("Starting async {OperationName}", operationName);

                var result = await operation();

                logger.LogInformation("Async {OperationName} completed successfully", operationName);
                return result;
            }
            catch (PdfServiceUnavailableException ex)
            {
                logger.LogError(ex, "PDF service unavailable during async {OperationName}", operationName);
                SetErrorMessage(controller, "El servicio de generación de PDF no está disponible temporalmente. Por favor, inténtelo más tarde.");
                return controller.RedirectToAction(fallbackAction, routeValues);
            }
            catch (PdfDataException ex)
            {
                logger.LogError(ex, "Invalid data for async {OperationName}: {Message}", operationName, ex.Message);
                SetErrorMessage(controller, $"Error en los datos requeridos: {ex.Message}");
                return controller.RedirectToAction(fallbackAction, routeValues);
            }
            catch (PdfGenerationException ex)
            {
                logger.LogError(ex, "PDF generation failed during async {OperationName}: {Message}", operationName, ex.Message);
                SetErrorMessage(controller, "Error al generar el documento PDF. Por favor, contacte al administrador si el problema persiste.");
                return controller.RedirectToAction(fallbackAction, routeValues);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unexpected error during async {OperationName}: {Message}", operationName, ex.Message);
                SetErrorMessage(controller, "Ha ocurrido un error inesperado. Por favor, contacte al administrador.");
                return controller.RedirectToAction(fallbackAction, routeValues);
            }
        }

        /// <summary>
        /// Valida que QuestPDF esté disponible y configurado correctamente
        /// </summary>
        private static void ValidateQuestPdfAvailability()
        {
            try
            {
                // Verificar la licencia de QuestPDF
                QuestPDF.Settings.License = LicenseType.Community;

                // Verificación simplificada - solo configurar la licencia
                // La validación real se hace cuando se intenta generar el PDF
            }
            catch (Exception ex)
            {
                throw new PdfServiceUnavailableException("QuestPDF no está disponible o no está configurado correctamente.", ex);
            }
        }

        /// <summary>
        /// Establece un mensaje de error en TempData del controlador
        /// </summary>
        private static void SetErrorMessage(Controller controller, string message)
        {
            controller.TempData["Error"] = message;
        }

        /// <summary>
        /// Valida que los datos requeridos para generar un PDF estén presentes
        /// </summary>
        /// <param name="data">Datos a validar</param>
        /// <param name="dataName">Nombre descriptivo de los datos</param>
        /// <exception cref="PdfDataException">Se lanza cuando los datos son nulos o inválidos</exception>
        public static void ValidateRequiredData(object? data, string dataName)
        {
            if (data == null)
            {
                throw new PdfDataException($"Los datos requeridos '{dataName}' no están disponibles para generar el PDF.");
            }
        }

        /// <summary>
        /// Ejecuta la generación de un PDF con manejo de errores específico
        /// </summary>
        /// <param name="pdfGenerator">Función que genera el PDF</param>
        /// <param name="documentName">Nombre del documento para logging</param>
        /// <returns>Bytes del PDF generado</returns>
        /// <exception cref="PdfGenerationException">Se lanza cuando falla la generación</exception>
        public static byte[] GeneratePdfSafely(Func<byte[]> pdfGenerator, string documentName = "PDF")
        {
            try
            {
                return pdfGenerator();
            }
            catch (Exception ex)
            {
                throw new PdfGenerationException($"Error al generar {documentName}: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Versión async de la generación segura de PDFs
        /// </summary>
        public static async Task<byte[]> GeneratePdfSafelyAsync(Func<Task<byte[]>> pdfGenerator, string documentName = "PDF")
        {
            try
            {
                return await pdfGenerator();
            }
            catch (Exception ex)
            {
                throw new PdfGenerationException($"Error al generar {documentName}: {ex.Message}", ex);
            }
        }
    }
}
