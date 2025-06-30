using Microsoft.AspNetCore.Mvc;
using gad_checa_gestion_cementerio.Services;

namespace gad_checa_gestion_cementerio.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HealthController : ControllerBase
    {
        private readonly IPdfService _pdfService;
        private readonly ILogger<HealthController> _logger;

        public HealthController(IPdfService pdfService, ILogger<HealthController> logger)
        {
            _pdfService = pdfService;
            _logger = logger;
        }

        [HttpGet]
        public IActionResult Get()
        {
            var health = new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                services = new
                {
                    questPdf = _pdfService.IsQuestPdfAvailable() ? "available" : "unavailable"
                }
            };

            if (!_pdfService.IsQuestPdfAvailable())
            {
                _logger.LogWarning("PDF service is not available during health check");
                return StatusCode(503, new
                {
                    status = "degraded",
                    timestamp = DateTime.UtcNow,
                    message = "PDF service is not available",
                    services = health.services
                });
            }

            return Ok(health);
        }

        [HttpGet("pdf")]
        public IActionResult PdfHealth()
        {
            try
            {
                var isAvailable = _pdfService.IsQuestPdfAvailable();

                return Ok(new
                {
                    service = "PDF Generation",
                    status = isAvailable ? "available" : "unavailable",
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking PDF service health");
                return StatusCode(500, new
                {
                    service = "PDF Generation",
                    status = "error",
                    message = ex.Message,
                    timestamp = DateTime.UtcNow
                });
            }
        }
    }
}
