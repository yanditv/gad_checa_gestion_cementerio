using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using gad_checa_gestion_cementerio.Controllers.Pdf;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Utils;
using Microsoft.Extensions.Logging;

namespace gad_checa_gestion_cementerio.Services
{
    public interface IPdfService
    {
        Task<byte[]> GenerateFacturaPagoAsync(Pago pago, Persona responsable);
        bool IsQuestPdfAvailable();
    }

    public class PdfService : IPdfService
    {
        private readonly ILogger<PdfService> _logger;
        private readonly bool _questPdfAvailable;

        public PdfService(ILogger<PdfService> logger)
        {
            _logger = logger;
            _questPdfAvailable = CheckQuestPdfAvailability();
        }

        public bool IsQuestPdfAvailable() => _questPdfAvailable;

        private bool CheckQuestPdfAvailability()
        {
            try
            {
                // Configurar licencia
                QuestPDF.Settings.License = LicenseType.Community;

                // Intentar crear un documento simple para verificar que QuestPDF funciona
                var testDoc = Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(QuestPDF.Helpers.PageSizes.A4);
                        page.Content().Text("Test");
                    });
                });

                // Intentar generar el PDF de prueba
                var testBytes = testDoc.GeneratePdf();

                _logger.LogInformation("QuestPDF verification successful");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "QuestPDF verification failed: {Message}", ex.Message);
                return false;
            }
        }

        public async Task<byte[]> GenerateFacturaPagoAsync(Pago pago, Persona responsable)
        {
            if (!_questPdfAvailable)
            {
                _logger.LogError("Cannot generate PDF: QuestPDF is not available");
                throw new PdfServiceUnavailableException();
            }

            // Validar datos requeridos
            PdfErrorHandler.ValidateRequiredData(pago, "Pago");
            PdfErrorHandler.ValidateRequiredData(responsable, "Responsable");

            try
            {
                _logger.LogInformation("Generating Factura Pago PDF for Pago ID: {PagoId}", pago.Id);

                var document = new FacturaPagoPdfDocument(pago, responsable);
                var pdfBytes = await Task.Run(() =>
                    PdfErrorHandler.GeneratePdfSafely(() => document.GeneratePdf(), "Factura de Pago"));

                _logger.LogInformation("PDF generated successfully for Pago ID: {PagoId}", pago.Id);
                return pdfBytes;
            }
            catch (PdfException)
            {
                // Re-lanzar excepciones de PDF ya manejadas
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error generating PDF for Pago ID: {PagoId}", pago.Id);
                throw new PdfGenerationException($"Error inesperado al generar la factura de pago: {ex.Message}", ex);
            }
        }
    }
}
