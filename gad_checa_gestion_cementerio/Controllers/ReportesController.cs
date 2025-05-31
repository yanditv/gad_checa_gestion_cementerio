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

namespace gad_checa_gestion_cementerio.Controllers
{
    public class ReportesController : BaseController
    {
        public ReportesController(ApplicationDbContext context, IMapper mapper, UserManager<IdentityUser> userManager)
            : base(context, userManager, mapper)
        {
        }

        public async Task<IActionResult> Index(DateTime? desde, DateTime? hasta)
        {
            var vm = new ReportesIndexViewModel
            {
                CuentasPorCobrar = await Task.Run(() => ObtenerCuentasPorCobrarViewModel()),
                Bovedas = await ObtenerBovedasViewModel(),
                Ingresos = await ObtenerIngresosPorFechaViewModel(desde, hasta)
            };

            return View(vm);
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
                .Include(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
                        .ThenInclude(b => b.Cementerio)
                .ToListAsync();

            var contratos = await _context.Contrato
                .Include(c => c.Difunto)
                .Include(c => c.Responsables)
                .Where(c => c.Estado)
                .ToListAsync();

            var resultado = bovedas.Select(b =>
            {
                var piso = b.Piso;
                var bloque = piso.Bloque;
                var cementerio = bloque.Cementerio;
                var contrato = contratos.FirstOrDefault(c => c.BovedaId == b.Id);
                var responsable = contrato?.Responsables.FirstOrDefault();
                var difunto = contrato?.Difunto;

                return new ReporteBovedasViewModel
                {
                    BovedaId = b.Id,
                    NumeroBoveda = b.NumeroSecuecial,
                    EstadoBoveda = b.Estado ? "Ocupada" : "Libre",
                    FechaCreacionBoveda = b.FechaCreacion,
                    NumeroPiso = piso.NumeroPiso,
                    NombreBloque = bloque.Descripcion,
                    TipoBloque = bloque.Tipo,
                    NombreCementerio = cementerio?.Nombre,

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
            var desde = fechaInicio ?? new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
            var hasta = fechaFin ?? desde.AddMonths(1).AddDays(-1);

            ViewBag.Desde = desde.ToString("yyyy-MM-dd");
            ViewBag.Hasta = hasta.ToString("yyyy-MM-dd");

            var viewModel = await ObtenerIngresosPorFechaViewModel(desde, hasta);
            return PartialView("~/Views/Reportes/ReporteIngresos/IngresosPorFecha.cshtml", viewModel);
        }



        public List<ReporteCuentasPorCobrarViewModel> ObtenerCuentasPorCobrarViewModel()
        {
            var cuotasPendientes = _context.Cuota
                .Where(c => !c.Pagada)
                .Include(c => c.Contrato)
                    .ThenInclude(ct => ct.Difunto)
                .Include(c => c.Contrato)
                    .ThenInclude(ct => ct.Boveda)
                        .ThenInclude(b => b.Piso)
                            .ThenInclude(p => p.Bloque)
                                .ThenInclude(bq => bq.Cementerio)
                .Include(c => c.Contrato)
                    .ThenInclude(ct => ct.Responsables)
                .ToList();

            return cuotasPendientes.Select(c => {
                var contrato = c.Contrato;
                var difunto = contrato.Difunto;
                var boveda = contrato.Boveda;
                var piso = boveda.Piso;
                var bloque = piso.Bloque;
                var cementerio = bloque.Cementerio;
                var responsable = contrato.Responsables.FirstOrDefault();

                return new ReporteCuentasPorCobrarViewModel
                {
                    CuotaId = c.Id,
                    FechaVencimiento = c.FechaVencimiento,
                    Monto = c.Monto,
                    Pagada = c.Pagada,
                    NumeroSecuencialContrato = contrato.NumeroSecuencial,
                    FechaInicioContrato = contrato.FechaInicio,
                    FechaFinContrato = contrato.FechaFin,
                    NombreResponsable = responsable != null ? $"{responsable.Nombres} {responsable.Apellidos}" : "Sin Responsable",
                    CedulaResponsable = responsable?.NumeroIdentificacion ?? "N/A",
                    TelefonoResponsable = responsable?.Telefono ?? "N/A",
                    NombreDifunto = $"{difunto.Nombres} {difunto.Apellidos}",
                    CedulaDifunto = difunto.NumeroIdentificacion,
                    FechaFallecimiento = difunto.FechaFallecimiento,
                    Bloque = bloque.Descripcion,
                    Piso = piso.NumeroPiso,
                    NumeroBoveda = boveda.Numero,
                    FechaCreacionCuota = contrato.FechaCreacion,
                    MontoTotalPendiente = c.Monto
                };
            }).ToList();
        }

        private async Task<List<ReporteBovedasViewModel>> ObtenerBovedasViewModel()
        {
            var bovedas = await _context.Boveda
                .Include(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
                .ToListAsync();

            return bovedas.Select(b => new ReporteBovedasViewModel
            {
                BovedaId = b.Id,
                NumeroBoveda = b.NumeroSecuecial,
                NumeroPiso = b.Piso.NumeroPiso,
                EstadoBoveda = b.Estado ? "Ocupada" : "Libre",
                FechaCreacionBoveda = b.FechaCreacion,
                NombreBloque = b.Piso.Bloque.Descripcion,
                TipoBloque = b.Piso.Bloque.Tipo
            }).ToList();
        }


        private async Task<List<ReporteIngresoPorFechaViewModel>> ObtenerIngresosPorFechaViewModel(DateTime? desde, DateTime? hasta)
        {
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
                .ToListAsync();

            var ingresos = new List<ReporteIngresoPorFechaViewModel>();

            foreach (var pago in pagos)
            {
                // Usar la primera cuota para acceder a datos del contrato
                var primeraCuota = pago.Cuotas.FirstOrDefault();
                if (primeraCuota == null) continue;

                var contrato = primeraCuota.Contrato;
                if (contrato == null) continue;

                var boveda = contrato.Boveda;
                var piso = boveda?.Piso;
                var bloque = piso?.Bloque;
                var responsable = contrato.Responsables.FirstOrDefault();

                ingresos.Add(new ReporteIngresoPorFechaViewModel
                {
                    FechaPago = pago.FechaPago,
                    TipoPago = pago.TipoPago,
                    NumeroComprobante = pago.NumeroComprobante,
                    Monto = pago.Monto,
                    PagadoPor = responsable != null ? $"{responsable.Nombres} {responsable.Apellidos}" : "N/A",
                    IdentificacionPagador = responsable?.NumeroIdentificacion ?? "N/A",
                    NumeroContrato = contrato.NumeroSecuencial,
                    TipoIngreso = contrato.EsRenovacion ? "Renovación" : "Inicial",
                    Boveda = $"#{boveda?.Numero}",
                    Piso = piso != null ? piso.NumeroPiso.ToString() : "N/A",
                    Bloque = bloque?.Descripcion ?? "N/A",
                    FechaInicio = desde ?? DateTime.MinValue,
                    FechaFin = hasta ?? DateTime.MaxValue
                });
            }

            return ingresos.OrderBy(i => i.FechaPago).ToList();
        }


        [HttpGet]
        public IActionResult CuentasPorCobrarPdf()
        {
            QuestPDF.Settings.License = LicenseType.Community;
            var viewModel = ObtenerCuentasPorCobrarViewModel();
            var document = new CuentasPorCobrarPdfDocument(viewModel);
            var pdf = document.GeneratePdf();

            Response.Headers["Content-Disposition"] = "inline; filename=ReporteCuentasPorCobrar.pdf";
            return File(pdf, "application/pdf");
        }

        
        [HttpGet]        public IActionResult BovedasPdf(string tipoBloque, string nombreBloque)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            // Traer bóvedas y su ubicación
            var bovedas = _context.Boveda
                .Include(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
                        .ThenInclude(bq => bq.Cementerio)
                .ToList();

            // Traer contratos activos relacionados con bóvedas
            var contratos = _context.Contrato
                .Include(c => c.Responsables)
                .Include(c => c.Difunto)
                .Where(c => c.Estado)
                .ToList();

            // Filtros
            if (!string.IsNullOrEmpty(tipoBloque))
                bovedas = bovedas.Where(b => b.Piso.Bloque.Tipo == tipoBloque).ToList();

            if (!string.IsNullOrEmpty(nombreBloque))
                bovedas = bovedas.Where(b => b.Piso.Bloque.Descripcion == nombreBloque).ToList();

            // Transformar a ViewModel
            var viewModels = bovedas.Select(b =>
            {
                var contrato = contratos.FirstOrDefault(c => c.BovedaId == b.Id);
                var responsable = contrato?.Responsables.FirstOrDefault();
                var difunto = contrato?.Difunto;
                var piso = b.Piso;
                var bloque = piso.Bloque;
                var cementerio = bloque.Cementerio;

                return new ReporteBovedasViewModel
                {
                    BovedaId = b.Id,
                    NumeroBoveda = b.NumeroSecuecial,
                    EstadoBoveda = b.Estado ? "Ocupada" : "Libre",
                    FechaCreacionBoveda = b.FechaCreacion,
                    NumeroPiso = piso.NumeroPiso,
                    NombreBloque = bloque.Descripcion,
                    TipoBloque = bloque.Tipo,
                    NombreCementerio = cementerio?.Nombre,

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

            var document = new BovedasPdfDocument(viewModels);
            var pdf = document.GeneratePdf();

            Response.Headers["Content-Disposition"] = "inline; filename=ReporteBovedas.pdf";
            return File(pdf, "application/pdf");
            return File(pdf, "application/pdf", "ReporteBovedas.pdf");
        }


        [HttpGet]
        public async Task<IActionResult> IngresosPorFechaPdf(DateTime? fechaInicio, DateTime? fechaFin)
        {
            QuestPDF.Settings.License = LicenseType.Community;
            var viewModel = await ObtenerIngresosPorFechaViewModel(fechaInicio, fechaFin);
            var document = new IngresosPorFechaPdfDocument(viewModel);
            var pdf = document.GeneratePdf();

            Response.Headers["Content-Disposition"] = "inline; filename=IngresosPorFecha.pdf";
            return File(pdf, "application/pdf");
        }

    }
}
