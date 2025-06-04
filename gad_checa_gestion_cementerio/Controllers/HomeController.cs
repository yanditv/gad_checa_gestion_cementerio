using System.Diagnostics;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Models.Views;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using gad_checa_gestion_cementerio.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace gad_checa_gestion_cementerio.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly ApplicationDbContext _context;

        public HomeController(ILogger<HomeController> logger, ApplicationDbContext context)
        {
            _logger = logger;
            _context = context;
        }

        public IActionResult Index()
        {
            // Agrupar cuotas por mes y año
            var ingresosMensuales = _context.Cuota
                .AsEnumerable()
                .GroupBy(c => new { c.FechaVencimiento.Year, c.FechaVencimiento.Month })
                .Select(g => new IngresoMensualViewModel
                {
                    Anio = g.Key.Year,
                    Mes = g.Key.Month,
                    TotalIngresado = g.Where(c => c.Pagada).Sum(c => c.Monto),
                    TotalDeuda = g.Where(c => !c.Pagada).Sum(c => c.Monto)
                })
                .OrderBy(x => x.Anio)
                .ThenBy(x => x.Mes)
                .ToList();

            // Transacciones recientes (últimos pagos)
            var transaccionesRecientes = (from pago in _context.Pago
                                          join persona in _context.Persona on pago.PersonaPagoId equals persona.Id
                                          orderby pago.FechaPago descending
                                          select new TransaccionRecienteViewModel
                                          {
                                              NombrePersona = persona.Nombres + " " + persona.Apellidos,
                                              NumeroComprobante = pago.NumeroComprobante,
                                              Monto = pago.Monto,
                                              FechaPago = pago.FechaPago
                                          })
                                          .Take(10)
                                          .ToList();

            var viewModel = new DashboardViewModel
            {
                NumeroDifuntos = _context.Difunto.Count(),

                BovedasDisponibles = _context.Boveda.Include(x => x.Piso.Bloque).Where(x => x.Piso.Bloque.Tipo == "Bovedas").Count(b =>
                    !_context.Contrato.Any(c =>
                        c.BovedaId == b.Id && c.Estado == true && c.FechaFin >= DateTime.Today)
                    ||
                    _context.Contrato.Any(c =>
                        c.BovedaId == b.Id && c.Estado == true && c.FechaFin < DateTime.Today)
                ),

                BovedasOcupadas = _context.Boveda.Include(x => x.Piso.Bloque).Where(x => x.Piso.Bloque.Tipo == "Bovedas").Count(b =>
                    _context.Contrato.Any(c => c.BovedaId == b.Id && c.FechaFin >= DateTime.Today && c.Estado == true)
                ),

                NichosDisponibles = _context.Boveda.Include(x => x.Piso.Bloque).Where(x => x.Piso.Bloque.Tipo == "Nichos")
                .Count(b =>
                    !_context.Contrato.Any(c =>
                        c.BovedaId == b.Id && c.Estado == true && c.FechaFin >= DateTime.Today)
                    ||
                    _context.Contrato.Any(c =>
                        c.BovedaId == b.Id && c.Estado == true && c.FechaFin < DateTime.Today)

                ),
                NichosOcupados = _context.Boveda.Include(x => x.Piso.Bloque).Where(x => x.Piso.Bloque.Tipo == "Nichos").Count(b =>
                    _context.Contrato.Any(c => c.BovedaId == b.Id && c.FechaFin >= DateTime.Today && c.Estado == true)
                ),

                BovedasPorCaducar = _context.Boveda.Include(x => x.Piso.Bloque).Where(x => x.Piso.Bloque.Tipo == "Bovedas").Count(b =>
                    _context.Contrato.Any(c => c.BovedaId == b.Id && c.FechaFin >= DateTime.Today && c.FechaFin <= DateTime.Today.AddDays(8) && c.Estado == true)
                ),

                UltimosContratos = _context.Contrato
                    .OrderByDescending(c => c.FechaFin)
                    .Take(10)
                    .Select(c => new ContratoResumenViewModel
                    {
                        NumeroSecuencial = c.NumeroSecuencial,
                        FechaFin = c.FechaFin,
                        MontoTotal = c.MontoTotal,
                        CuotasPendientes = c.Cuotas.Count(q => !q.Pagada),
                        EstadoContrato = c.FechaFin < DateTime.Today
                            ? "Vencido"
                            : (c.FechaFin <= DateTime.Today.AddDays(8) ? "Próximo a vencer" : "Vigente")
                    })
                    .ToList(),

                IngresosMensuales = ingresosMensuales,
                TransaccionesRecientes = transaccionesRecientes
            };

            return View(viewModel);
        }

        [Authorize(Roles = "Admin")]
        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
