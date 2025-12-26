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
            // Agrupar cuotas por mes y año para deudas
            var deudasMensuales = _context.Cuota
                .AsEnumerable()
                .GroupBy(c => new { c.FechaVencimiento.Year, c.FechaVencimiento.Month })
                .Select(g => new
                {
                    Anio = g.Key.Year,
                    Mes = g.Key.Month,
                    TotalDeuda = g.Where(c => !c.Pagada).Sum(c => c.Monto)
                })
                .ToList();

            // Agrupar pagos por mes y año para ingresos
            var pagosAgrupados = _context.Pago
                .AsEnumerable()
                .GroupBy(p => new { p.FechaPago.Year, p.FechaPago.Month })
                .Select(g => new
                {
                    Anio = g.Key.Year,
                    Mes = g.Key.Month,
                    TotalIngresado = g.Sum(p => p.Monto)
                })
                .ToList();

            // Crear lista completa de ingresos mensuales para el año actual
            var anioActual = DateTime.Now.Year;
            var ingresosMensuales = new List<IngresoMensualViewModel>();
            for (int mes = 1; mes <= 12; mes++)
            {
                var pagoMes = pagosAgrupados.FirstOrDefault(p => p.Anio == anioActual && p.Mes == mes);
                var deudaMes = deudasMensuales.FirstOrDefault(d => d.Anio == anioActual && d.Mes == mes);

                ingresosMensuales.Add(new IngresoMensualViewModel
                {
                    Anio = anioActual,
                    Mes = mes,
                    TotalIngresado = pagoMes?.TotalIngresado ?? 0,
                    TotalDeuda = deudaMes?.TotalDeuda ?? 0
                });
            }

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
            // Bóvedas disponibles
            var bovedasDisponibles = _context.Boveda
                .Include(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
                .Include(b => b.Contratos)
                .Where(b => (b.Piso.Bloque.Tipo == "Boveda")
                            && !b.Contratos.Any(c => c.Estado)) // Contratos activos = Estado = true, aquí filtramos disponibles
                .Select(b => b.Id)
                .Distinct()
                .Count();

            // Bóvedas ocupadas
            var bovedasOcupadas = _context.Boveda
                .Include(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
                .Include(b => b.Contratos)
                .Where(b => (b.Piso.Bloque.Tipo == "Boveda")
                            && b.Contratos.Any(c => c.Estado)) // Contratos activos
                .Select(b => b.Id)
                .Distinct()
                .Count();

            // Nichos disponibles
            var nichosDisponibles = _context.Boveda
                .Include(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
                .Include(b => b.Contratos)
                .Where(b => b.Piso.Bloque.Tipo == "Nicho"
                            && !b.Contratos.Any(c => c.Estado))
                .Select(b => b.Id)
                .Distinct()
                .Count();

            // Nichos ocupados
            var nichosOcupados = _context.Boveda
                .Include(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
                .Include(b => b.Contratos)
                .Where(b => b.Piso.Bloque.Tipo == "Nicho"
                            && b.Contratos.Any(c => c.Estado))
                .Select(b => b.Id)
                .Distinct()
                .Count();

            var viewModel = new DashboardViewModel
            {
                NumeroDifuntos = _context.Difunto.Count(),

                BovedasDisponibles = bovedasDisponibles,
                BovedasOcupadas = bovedasOcupadas,
                NichosDisponibles = nichosDisponibles,
                NichosOcupados = nichosOcupados,

                // Bóvedas por caducar: tienen contrato activo próximo a vencer
                BovedasPorCaducar = (from boveda in _context.Boveda
                                     join p in _context.Piso on boveda.PisoId equals p.Id
                                     join bloque in _context.Bloque on p.BloqueId equals bloque.Id
                                     join c in _context.Contrato on boveda.Id equals c.BovedaId
                                     where bloque.Tipo == "Boveda"
                                           && c.Estado == false
                                           && c.FechaFin >= DateTime.Today
                                           && c.FechaFin <= DateTime.Today.AddDays(8)
                                     select boveda.Id).Distinct().Count(),

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
                TransaccionesRecientes = transaccionesRecientes,

                // Calcular estados de contratos
                ContratosActivos = _context.Contrato.Count(c => c.Estado),
                ContratosPorVencer = _context.Contrato.Count(c => c.Estado && c.FechaFin >= DateTime.Today && c.FechaFin <= DateTime.Today.AddDays(8)),
                ContratosVencidos = _context.Contrato.Count(c => c.FechaFin < DateTime.Today)
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
