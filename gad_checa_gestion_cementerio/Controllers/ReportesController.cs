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

        public async Task<IActionResult> Bovedas()
        {
            var viewModel = await ObtenerBovedasViewModel();
            return PartialView("~/Views/Reportes/ReporteBovedas/Bovedas.cshtml", viewModel);
        }

        public async Task<IActionResult> IngresosPorFecha(DateTime? desde, DateTime? hasta)
        {
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
                .ToListAsync();

            return bovedas.Select(b => new ReporteBovedasViewModel
            {
                BovedaId = b.Id,
                NumeroBoveda = b.Numero,
                NumeroPiso = b.Piso.NumeroPiso,
                EstadoBoveda = b.Estado ? "Ocupada" : "Libre",
                FechaCreacionBoveda = b.FechaCreacion
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
                .Include(p => p.Cuotas)
                .Where(p => p.FechaPago >= desde && p.FechaPago <= hasta)
                .ToListAsync();

            var ingresos = new List<ReporteIngresoPorFechaViewModel>();

            foreach (var pago in pagos)
            {
                foreach (var cuota in pago.Cuotas)
                {
                    var contrato = cuota.Contrato;
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

        
        [HttpGet]
        public async Task<IActionResult> BovedasPdf()
        {
            QuestPDF.Settings.License = LicenseType.Community;
            var viewModel = await ObtenerBovedasViewModel();
            var document = new BovedasPdfDocument(viewModel);
            var pdf = document.GeneratePdf();

            Response.Headers["Content-Disposition"] = "inline; filename=ReporteBovedas.pdf";
            return File(pdf, "application/pdf");
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
