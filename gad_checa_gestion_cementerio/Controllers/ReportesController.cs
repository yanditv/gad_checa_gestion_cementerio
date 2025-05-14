using AutoMapper;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Models.Views;
using gad_checa_gestion_cementerio.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rotativa.AspNetCore;
using System;
using System.Linq;
using System.Threading.Tasks;

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
                CuentasPorCobrar = await ObtenerCuentasPorCobrarViewModel(),
                Bovedas = await ObtenerBovedasViewModel(),
                Ingresos = await ObtenerIngresosPorFechaViewModel(desde, hasta)
            };

            return View(vm);
        }

        public async Task<IActionResult> CuentasPorCobrar()
        {
            var viewModel = await ObtenerCuentasPorCobrarViewModel();
           return PartialView("~/Views/Reportes/ReporteCuentasPorCobrar/CuentasPorCobrar.cshtml", new List<ReporteCuentasPorCobrarViewModel> { viewModel });
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

        private async Task<ReporteCuentasPorCobrarViewModel> ObtenerCuentasPorCobrarViewModel()
        {
            var cuotasPendientes = await _context.Cuota
                .Include(c => c.Contrato)
                .Where(c => !c.Pagada)
                .ToListAsync();

            var totalPendiente = cuotasPendientes.Sum(c => c.Monto);

            return new ReporteCuentasPorCobrarViewModel
            {
                CuotasPendientes = cuotasPendientes,
                MontoTotalPendiente = totalPendiente
            };
        }


        private async Task<List<ReporteBovedasViewModel>> ObtenerBovedasViewModel()
        {
            var bovedas = await _context.Boveda
                .Include(b => b.Piso)
                .ToListAsync();

            var viewModels = bovedas.Select(b => new ReporteBovedasViewModel
            {
                BovedaId = b.Id,
                Numero = b.Numero,
                NumeroPiso = b.Piso.NumeroPiso,
                Estado = b.Estado ? "Ocupada" : "Libre"
            }).ToList();

            return viewModels;
        }



       private async Task<List<ReporteIngresoPorFechaViewModel>> ObtenerIngresosPorFechaViewModel(DateTime? desde, DateTime? hasta)
        {
            var viewModel = await _context.Pago
                .Where(p => p.FechaPago >= desde && p.FechaPago <= hasta)
                .SelectMany(p => p.Cuotas.Select(c => new
                {
                    p.FechaPago,
                    c.Monto,
                    Contrato = c.Contrato,
                    Boveda = c.Contrato.Boveda,
                    TipoIngreso = c.Contrato.EsRenovacion ? "Renovación" : "Inicial"
                }))
                .GroupBy(x => new { x.FechaPago.Date, x.Boveda.Numero, x.TipoIngreso })
                .Select(g => new ReporteIngresoPorFechaViewModel
                {
                    Fecha = g.Key.Date,
                    Boveda = "Bóveda #" + g.Key.Numero,
                    TipoIngreso = g.Key.TipoIngreso,
                    Total = g.Sum(x => x.Monto)
                })
                .OrderBy(r => r.Fecha)
                .ToListAsync();

            return viewModel;
        }


        [HttpGet]
        public async Task<IActionResult> CuentasPorCobrarPdf()
        {
            var viewModel = await ObtenerCuentasPorCobrarViewModel();
            return new ViewAsPdf("CuentasPorCobrarPdf", viewModel)
            {
                FileName = "CuentasPorCobrar.pdf"
            };
        }

        [HttpGet]
        public async Task<IActionResult> BovedasPdf()
        {
            var viewModel = await ObtenerBovedasViewModel();
            return new ViewAsPdf("BovedasPdf", viewModel)
            {
                FileName = "Bovedas.pdf"
            };
        }

        [HttpGet]
        public async Task<IActionResult> IngresosPorFechaPdf(DateTime? fechaInicio, DateTime? fechaFin)
        {
            var viewModel = await ObtenerIngresosPorFechaViewModel(fechaInicio, fechaFin);
            return new ViewAsPdf("IngresosPorFechaPdf", viewModel)
            {
                FileName = "IngresosPorFecha.pdf"
            };
        }
    }
}
