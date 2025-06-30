using AutoMapper;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Models.Views;
using gad_checa_gestion_cementerio.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Infrastructure;
using QuestPDF.Fluent;
using Rotativa.AspNetCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using gad_checa_gestion_cementerio.Areas.Identity.Data;
using Microsoft.IdentityModel.Tokens;

namespace gad_checa_gestion_cementerio.Controllers
{
    public class ReportesController : BaseController
    {
        public ReportesController(ApplicationDbContext context, IMapper mapper, UserManager<ApplicationUser> userManager, ILogger<ReportesController> logger)
            : base(context, userManager, mapper, logger)
        {
        }

        public async Task<IActionResult> Index(DateTime? desde, DateTime? hasta)
        {
            try
            {
                _logger.LogInformation("ReportesController Index called with desde: {Desde}, hasta: {Hasta}", desde, hasta);

                var vm = new ReportesIndexViewModel
                {
                    CuentasPorCobrar = await Task.Run(() => ObtenerCuentasPorCobrarViewModel()),
                    Bovedas = await ObtenerBovedasViewModel(),
                    Ingresos = await ObtenerIngresosPorFechaViewModel(desde, hasta)
                };

                _logger.LogInformation("ReportesIndexViewModel creado - CuentasPorCobrar: {CuentasPorCobrar}, Bovedas: {Bovedas}, Ingresos: {Ingresos}",
                    vm.CuentasPorCobrar?.Count ?? 0, vm.Bovedas?.Count ?? 0, vm.Ingresos?.Count ?? 0);

                return View(vm);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en ReportesController Index: {Message}", ex.Message);
                var emptyVm = new ReportesIndexViewModel
                {
                    CuentasPorCobrar = new List<ReporteCuentasPorCobrarViewModel>(),
                    Bovedas = new List<ReporteBovedasViewModel>(),
                    Ingresos = new List<ReporteIngresoPorFechaViewModel>()
                };
                return View(emptyVm);
            }
        }

        public IActionResult CuentasPorCobrar()
        {
            var viewModel = ObtenerCuentasPorCobrarViewModel();
            return PartialView("~/Views/Reportes/ReporteCuentasPorCobrar/CuentasPorCobrar.cshtml", viewModel);
        }

        [HttpGet]
        public async Task<IActionResult> Bovedas(string? tipoBloque, string? nombreBloque)
        {
            var bovedas = await _context.Boveda
                .Include(b => b.Propietario)
                .Include(b => b.Piso)
                    .ThenInclude(p => p!.Bloque)
                        .ThenInclude(b => b!.Cementerio)
                .ToListAsync();

            var contratos = await _context.Contrato
                .Include(c => c.Difunto)
                .Include(c => c.Responsables)
                .Where(c => c.Estado)
                .ToListAsync();

            // Debug: Verificar cuántos datos tenemos
            Console.WriteLine($"[DEBUG] Total bóvedas encontradas: {bovedas.Count}");
            Console.WriteLine($"[DEBUG] Total contratos activos: {contratos.Count}");

            var resultado = bovedas.Select(b =>
            {
                var piso = b.Piso;
                var bloque = piso?.Bloque;
                var cementerio = bloque?.Cementerio;
                var contrato = contratos.FirstOrDefault(c => c.BovedaId == b.Id);
                var responsable = contrato?.Responsables.FirstOrDefault();
                var difunto = contrato?.Difunto;

                return new ReporteBovedasViewModel
                {
                    BovedaId = b.Id,
                    NumeroBoveda = !string.IsNullOrEmpty(b.NumeroSecuencial) && b.NumeroSecuencial != "S/N" ? b.NumeroSecuencial : b.Numero.ToString(),
                    FechaCreacionBoveda = b.FechaCreacion,
                    NumeroPiso = piso?.NumeroPiso ?? 0,
                    NombreBloque = bloque?.Descripcion ?? "Sin Bloque",
                    TipoBloque = bloque?.Tipo ?? "Sin Tipo",
                    NombreCementerio = cementerio?.Nombre,
                    NombrePropietario = b.Propietario != null ? $"{b.Propietario.Nombres} {b.Propietario.Apellidos}" : null,
                    CedulaPropietario = b.Propietario?.NumeroIdentificacion,
                    NumeroSecuencialContrato = contrato?.NumeroSecuencial,
                    FechaInicioContrato = contrato?.FechaInicio,
                    FechaFinContrato = contrato?.FechaFin,
                    NumeroDeMeses = contrato?.NumeroDeMeses,
                    MontoTotalContrato = contrato?.MontoTotal,
                    ContratoActivo = contrato?.Estado,

                    NombresDifunto = difunto?.Nombres,
                    ApellidosDifunto = difunto?.Apellidos,
                    FechaFallecimiento = difunto?.FechaFallecimiento,
                    NumeroIdentificacionDifunto = difunto?.NumeroIdentificacion,

                    NombreResponsable = responsable != null ? $"{responsable.Nombres} {responsable.Apellidos}" : null,
                    CedulaResponsable = responsable?.NumeroIdentificacion,
                    TelefonoResponsable = responsable?.Telefono
                };
            }).ToList();

            // Debug: Verificar la transformación de datos
            Console.WriteLine($"[DEBUG] Total registros transformados: {resultado.Count}");
            var tiposEncontrados = resultado.Select(r => r.TipoBloque).Distinct().ToList();
            Console.WriteLine($"[DEBUG] Tipos encontrados: {string.Join(", ", tiposEncontrados)}");

            // Carga tipos disponibles
            var tipos = resultado.Select(r => r.TipoBloque).Distinct().OrderBy(x => x).ToList();

            // Carga bloques según el tipo seleccionado
            var bloques = resultado
                .Where(r => tipoBloque == null || r.TipoBloque == tipoBloque)
                .Select(r => r.NombreBloque)
                .Distinct()
                .OrderBy(x => x)
                .ToList();

            // Aplica filtros
            if (!string.IsNullOrEmpty(tipoBloque))
                resultado = resultado.Where(r => r.TipoBloque == tipoBloque).ToList();

            if (!string.IsNullOrEmpty(nombreBloque))
                resultado = resultado.Where(r => r.NombreBloque == nombreBloque).ToList();

            var vm = new FiltroBovedasViewModel
            {
                TipoBloque = tipoBloque,
                NombreBloque = nombreBloque,
                TiposDisponibles = tipos,
                BloquesDisponibles = bloques,
                Bovedas = resultado
            };

            return PartialView("~/Views/Reportes/ReporteBovedas/Bovedas.cshtml", vm);
        }



        public async Task<IActionResult> IngresosPorFecha(DateTime? fechaInicio, DateTime? fechaFin)
        {
            try
            {
                _logger.LogInformation("IngresosPorFecha called with fechaInicio: {FechaInicio}, fechaFin: {FechaFin}", fechaInicio, fechaFin);

                if (fechaInicio == null || fechaFin == null)
                {
                    //primer día del mes actual y último día del mes actual
                    fechaInicio = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
                    fechaFin = DateTime.Now;
                    _logger.LogInformation("Fechas ajustadas a valores por defecto: fechaInicio: {FechaInicio}, fechaFin: {FechaFin}", fechaInicio, fechaFin);
                }

                var desde = Commons.getFechaInicial(fechaInicio);
                var hasta = Commons.getFechaFinal(fechaFin);

                _logger.LogInformation("Fechas procesadas: desde: {Desde}, hasta: {Hasta}", desde, hasta);

                ViewBag.Desde = desde.ToString("yyyy-MM-dd");
                ViewBag.Hasta = hasta.ToString("yyyy-MM-dd");

                var viewModel = await ObtenerIngresosPorFechaViewModel(desde, hasta);
                _logger.LogInformation("ViewModel obtenido con {Count} registros", viewModel?.Count ?? 0);

                return PartialView("~/Views/Reportes/ReporteIngresos/IngresosPorFecha.cshtml", viewModel);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en IngresosPorFecha: {Message}", ex.Message);
                return PartialView("~/Views/Reportes/ReporteIngresos/IngresosPorFecha.cshtml", new List<ReporteIngresoPorFechaViewModel>());
            }
        }



        public List<ReporteCuentasPorCobrarViewModel> ObtenerCuentasPorCobrarViewModel()
        {
            var cuotasPendientes = _context.Cuota
                .Where(c => !c.Pagada)
                .Include(c => c.Contrato)
                    .ThenInclude(ct => ct!.Difunto)
                .Include(c => c.Contrato)
                    .ThenInclude(ct => ct!.Boveda)
                        .ThenInclude(b => b!.Piso)
                            .ThenInclude(p => p!.Bloque)
                                .ThenInclude(bq => bq!.Cementerio)
                .Include(c => c.Contrato)
                    .ThenInclude(ct => ct!.Responsables)
                .ToList();

            var agruladoPorContrato = cuotasPendientes
                .GroupBy(c => c.ContratoId)
                .Select(g =>
                {
                    var primeraCuota = g.First();
                    var contrato = primeraCuota.Contrato;
                    var difunto = contrato?.Difunto;
                    var boveda = contrato?.Boveda;
                    var piso = boveda?.Piso;
                    var bloque = piso?.Bloque;
                    var cementerio = bloque?.Cementerio;
                    var responsable = contrato?.Responsables.FirstOrDefault();

                    return new ReporteCuentasPorCobrarViewModel
                    {
                        CuotaId = primeraCuota.Id,
                        FechaVencimiento = g.Min(c => c.FechaVencimiento),
                        Monto = g.Sum(c => c.Monto),
                        Pagada = false,
                        NumeroSecuencialContrato = contrato?.NumeroSecuencial ?? "N/A",
                        FechaInicioContrato = contrato?.FechaInicio ?? DateTime.MinValue,
                        FechaFinContrato = contrato?.FechaFin ?? DateTime.MinValue,
                        NombreResponsable = responsable != null ? $"{responsable.Nombres} {responsable.Apellidos}" : "Sin Responsable",
                        CedulaResponsable = responsable?.NumeroIdentificacion ?? "N/A",
                        TelefonoResponsable = responsable?.Telefono ?? "N/A",
                        NombreDifunto = difunto != null ? $"{difunto.Nombres} {difunto.Apellidos}" : "N/A",
                        CedulaDifunto = difunto?.NumeroIdentificacion ?? "N/A",
                        FechaFallecimiento = difunto?.FechaFallecimiento ?? DateTime.MinValue,
                        Bloque = bloque?.Descripcion ?? "N/A",
                        Piso = piso?.NumeroPiso ?? 0,
                        NumeroBoveda = boveda?.Numero ?? 0,
                        FechaCreacionCuota = contrato?.FechaCreacion ?? DateTime.MinValue,
                        MontoTotalPendiente = g.Sum(c => c.Monto)
                    };
                })
                .ToList();

            return agruladoPorContrato;
        }

        private async Task<List<ReporteBovedasViewModel>> ObtenerBovedasViewModel()
        {
            var bovedas = await _context.Boveda
                .Include(b => b.Piso)
                    .ThenInclude(p => p!.Bloque)
                .ToListAsync();

            return bovedas.Select(b => new ReporteBovedasViewModel
            {
                BovedaId = b.Id,
                NumeroBoveda = b.NumeroSecuencial ?? "N/A",
                NumeroPiso = b.Piso?.NumeroPiso ?? 0,
                EstadoBoveda = b.Estado ? "Ocupada" : "Libre",
                FechaCreacionBoveda = b.FechaCreacion,
                NombreBloque = b.Piso?.Bloque?.Descripcion ?? "N/A",
                TipoBloque = b.Piso?.Bloque?.Tipo ?? "N/A"
            }).ToList();
        }


        private async Task<List<ReporteIngresoPorFechaViewModel>> ObtenerIngresosPorFechaViewModel(DateTime? desde, DateTime? hasta)
        {
            try
            {
                _logger.LogInformation("ObtenerIngresosPorFechaViewModel called with desde: {Desde}, hasta: {Hasta}", desde, hasta);

                // Optimizar la consulta usando AsSplitQuery() para evitar el warning de múltiples includes
                var pagos = await _context.Pago
                    .Include(p => p.Cuotas)
                        .ThenInclude(c => c.Contrato)
                            .ThenInclude(c => c.Boveda)
                                .ThenInclude(b => b.Piso)
                                    .ThenInclude(p => p.Bloque)
                    .Include(p => p.Cuotas)
                        .ThenInclude(c => c.Contrato)
                            .ThenInclude(c => c.Responsables)
                    .Include(p => p.Cuotas)
                        .ThenInclude(c => c.Contrato)
                            .ThenInclude(c => c.Difunto)
                    .Where(p => p.FechaPago >= desde && p.FechaPago <= hasta)
                    .AsSplitQuery() // Esto divide la consulta en múltiples queries más simples para mejorar rendimiento
                    .ToListAsync();

                _logger.LogInformation("Encontrados {Count} pagos en el rango de fechas", pagos.Count);

                var ingresos = new List<ReporteIngresoPorFechaViewModel>();

                foreach (var pago in pagos)
                {
                    // Usar la primera cuota para acceder a datos del contrato
                    var primeraCuota = pago.Cuotas.FirstOrDefault();
                    if (primeraCuota == null)
                    {
                        _logger.LogWarning("Pago con ID {PagoId} no tiene cuotas asociadas", pago.Id);

                        // Crear un registro básico sin detalles del contrato
                        ingresos.Add(new ReporteIngresoPorFechaViewModel
                        {
                            FechaPago = pago.FechaPago,
                            TipoPago = pago.TipoPago ?? "N/A",
                            NumeroComprobante = pago.NumeroComprobante ?? "N/A",
                            Monto = pago.Monto,
                            PagadoPor = "Sin Responsable",
                            IdentificacionPagador = "N/A",
                            NumeroContrato = "Sin Contrato",
                            TipoIngreso = "N/A",
                            Boveda = "N/A",
                            Piso = "N/A",
                            Bloque = "N/A",
                            FechaInicio = Commons.getFechaInicial(desde ?? DateTime.MinValue),
                            FechaFin = Commons.getFechaFinal(hasta ?? DateTime.MaxValue)
                        });
                        continue;
                    }

                    var contrato = primeraCuota.Contrato;
                    if (contrato == null)
                    {
                        _logger.LogWarning("Cuota con ID {CuotaId} no tiene contrato asociado", primeraCuota.Id);

                        // Crear un registro básico sin detalles del contrato
                        ingresos.Add(new ReporteIngresoPorFechaViewModel
                        {
                            FechaPago = pago.FechaPago,
                            TipoPago = pago.TipoPago ?? "N/A",
                            NumeroComprobante = pago.NumeroComprobante ?? "N/A",
                            Monto = pago.Monto,
                            PagadoPor = "Sin Responsable",
                            IdentificacionPagador = "N/A",
                            NumeroContrato = "Sin Contrato",
                            TipoIngreso = "N/A",
                            Boveda = "N/A",
                            Piso = "N/A",
                            Bloque = "N/A",
                            FechaInicio = Commons.getFechaInicial(desde ?? DateTime.MinValue),
                            FechaFin = Commons.getFechaFinal(hasta ?? DateTime.MaxValue)
                        });
                        continue;
                    }

                    var boveda = contrato.Boveda;
                    var piso = boveda?.Piso;
                    var bloque = piso?.Bloque;
                    var responsable = contrato.Responsables.FirstOrDefault();

                    ingresos.Add(new ReporteIngresoPorFechaViewModel
                    {
                        FechaPago = pago.FechaPago,
                        TipoPago = pago.TipoPago ?? "N/A",
                        NumeroComprobante = pago.NumeroComprobante ?? "N/A",
                        Monto = pago.Cuotas.Sum(c => c.Monto),
                        PagadoPor = responsable != null ? $"{responsable.Nombres} {responsable.Apellidos}" : "N/A",
                        IdentificacionPagador = responsable?.NumeroIdentificacion ?? "N/A",
                        NumeroContrato = contrato.NumeroSecuencial ?? "N/A",
                        TipoIngreso = contrato.EsRenovacion ? "Renovación" : "Inicial",
                        Boveda = boveda != null ? $"#{boveda.Numero}" : "N/A",
                        Piso = piso != null ? piso.NumeroPiso.ToString() : "N/A",
                        Bloque = bloque?.Descripcion ?? "N/A",
                        FechaInicio = Commons.getFechaInicial(desde ?? DateTime.MinValue),
                        FechaFin = Commons.getFechaFinal(hasta ?? DateTime.MaxValue)
                    });
                }

                _logger.LogInformation("Procesados {Count} ingresos exitosamente", ingresos.Count);
                return ingresos.OrderBy(i => i.FechaPago).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en ObtenerIngresosPorFechaViewModel: {Message}", ex.Message);
                return new List<ReporteIngresoPorFechaViewModel>();
            }
        }


        [HttpGet]
        public IActionResult CuentasPorCobrarPdf()
        {
            return PdfErrorHandler.ExecutePdfOperation(() =>
            {
                var viewModel = ObtenerCuentasPorCobrarViewModel();
                PdfErrorHandler.ValidateRequiredData(viewModel, "Datos de cuentas por cobrar");

                var document = new CuentasPorCobrarPdfDocument(viewModel);
                var pdf = PdfErrorHandler.GeneratePdfSafely(() => document.GeneratePdf(), "Reporte de Cuentas por Cobrar");

                Response.Headers["Content-Disposition"] = "inline; filename=ReporteCuentasPorCobrar.pdf";
                return File(pdf, "application/pdf");
            }, _logger, this, "Index", "Generación de reporte de cuentas por cobrar");
        }


        [HttpGet]
        public IActionResult BovedasPdf(string tipoBloque, string nombreBloque)
        {
            return PdfErrorHandler.ExecutePdfOperation(() =>
            {
                // Traer bóvedas y su ubicación
                var bovedas = _context.Boveda
                    .Include(b => b.Propietario)
                    .Include(b => b.Piso)
                        .ThenInclude(p => p!.Bloque)
                            .ThenInclude(bq => bq!.Cementerio)
                    .ToList();

                // Traer contratos activos relacionados con bóvedas
                var contratos = _context.Contrato
                    .Include(c => c.Responsables)
                    .Include(c => c.Difunto)
                    .Where(c => c.Estado)
                    .ToList();

                // Filtros
                if (!string.IsNullOrEmpty(tipoBloque))
                    bovedas = bovedas.Where(b => b.Piso?.Bloque?.Tipo == tipoBloque).ToList();

                if (!string.IsNullOrEmpty(nombreBloque))
                    bovedas = bovedas.Where(b => b.Piso?.Bloque?.Descripcion == nombreBloque).ToList();

                // Transformar a ViewModel
                var viewModels = bovedas.Select(b =>
                {
                    var contrato = contratos.FirstOrDefault(c => c.BovedaId == b.Id);
                    var responsable = contrato?.Responsables.FirstOrDefault();
                    var difunto = contrato?.Difunto;
                    var piso = b.Piso;
                    var bloque = piso?.Bloque;
                    var cementerio = bloque?.Cementerio;

                    return new ReporteBovedasViewModel
                    {
                        BovedaId = b.Id,
                        NumeroBoveda = string.IsNullOrEmpty(b.NumeroSecuencial) ? b.Id.ToString() : b.NumeroSecuencial,
                        EstadoBoveda = b.Estado ? "Ocupada" : "Libre",
                        FechaCreacionBoveda = b.FechaCreacion,
                        NumeroPiso = piso?.NumeroPiso ?? 0,
                        NombreBloque = bloque?.Descripcion ?? "N/A",
                        TipoBloque = bloque?.Tipo ?? "N/A",
                        NombreCementerio = cementerio?.Nombre,
                        NombrePropietario = b.Propietario != null ? $"{b.Propietario.Nombres} {b.Propietario.Apellidos}" : null,
                        CedulaPropietario = b.Propietario?.NumeroIdentificacion,

                        NumeroSecuencialContrato = contrato?.NumeroSecuencial,
                        FechaInicioContrato = contrato?.FechaInicio,
                        FechaFinContrato = contrato?.FechaFin,
                        NumeroDeMeses = contrato?.NumeroDeMeses,
                        MontoTotalContrato = contrato?.MontoTotal,
                        ContratoActivo = contrato?.Estado,

                        NombresDifunto = difunto?.Nombres,
                        ApellidosDifunto = difunto?.Apellidos,
                        FechaFallecimiento = difunto?.FechaFallecimiento,
                        NumeroIdentificacionDifunto = difunto?.NumeroIdentificacion,

                        NombreResponsable = responsable != null ? $"{responsable.Nombres} {responsable.Apellidos}" : "Sin Responsable",
                        CedulaResponsable = responsable?.NumeroIdentificacion,
                        TelefonoResponsable = responsable?.Telefono
                    };
                }).ToList();

                PdfErrorHandler.ValidateRequiredData(viewModels, "Datos de bóvedas");

                var document = new BovedasPdfDocument(viewModels);
                var pdf = PdfErrorHandler.GeneratePdfSafely(() => document.GeneratePdf(), "Reporte de Bóvedas");

                Response.Headers["Content-Disposition"] = "inline; filename=ReporteBovedas.pdf";
                return File(pdf, "application/pdf");
            }, _logger, this, "Index", "Generación de reporte de bóvedas");
        }


        [HttpGet]
        public async Task<IActionResult> IngresosPorFechaPdf(DateTime? fechaInicio, DateTime? fechaFin)
        {
            return await PdfErrorHandler.ExecutePdfOperationAsync(async () =>
            {
                // Usar las fechas procesadas para consistencia
                var desde = Commons.getFechaInicial(fechaInicio);
                var hasta = Commons.getFechaFinal(fechaFin);

                var viewModel = await ObtenerIngresosPorFechaViewModel(desde, hasta);
                PdfErrorHandler.ValidateRequiredData(viewModel, "Datos de ingresos por fecha");

                var document = new IngresosPorFechaPdfDocument(viewModel);
                var pdf = await Task.Run(() =>
                    PdfErrorHandler.GeneratePdfSafely(() => document.GeneratePdf(), "Reporte de Ingresos por Fecha"));

                Response.Headers["Content-Disposition"] = "inline; filename=IngresosPorFecha.pdf";
                return File(pdf, "application/pdf");
            }, _logger, this, "Index", "Generación de reporte de ingresos por fecha");
        }

    }
}
