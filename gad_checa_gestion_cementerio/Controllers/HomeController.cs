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
            var hoy = DateTime.Today;

            // 1. CORRECCIÓN DE OCUPACIÓN:
            // En lugar de depender solo de contratos, miramos el campo Estado de la boveda 
            // que marcamos como 'false' (ocupado) en la migración.
            var bovedasRealmenteOcupadasIds = _context.Boveda
                .Where(b => b.Estado == false)
                .Select(b => b.Id)
                .ToHashSet();

            // Agrupar cuotas por mes y año (Mantenemos tu lógica de ingresos)
            var anioActual = DateTime.Now.Year;
            var ingresosMensuales = _context.Cuota
                .Where(c => c.FechaVencimiento.Year == anioActual)
                .GroupBy(c => c.FechaVencimiento.Month)
                .AsEnumerable()
                .Select(g => new IngresoMensualViewModel
                {
                    Anio = anioActual,
                    Mes = g.Key,
                    TotalIngresado = g.Where(c => c.Pagada).Sum(c => c.Monto),
                    TotalDeuda = g.Where(c => !c.Pagada).Sum(c => c.Monto)
                })
                .OrderBy(x => x.Mes)
                .ToList();

            // Transacciones recientes
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
                // 2. DIFUNTOS: Esto contará los 1166 que salen en tu log
                NumeroDifuntos = _context.Difunto.Count(),

                // 3. BOVEDAS: Filtro corregido por estado real
                BovedasDisponibles = _context.Boveda
                    .Include(x => x.Piso.Bloque)
                    .Where(x => x.Piso.Bloque.Tipo == "Boveda")
                    .Count(b => b.Estado == true), // Si estado es true, está libre

                BovedasOcupadas = _context.Boveda
                    .Include(x => x.Piso.Bloque)
                    .Where(x => x.Piso.Bloque.Tipo == "Boveda")
                    .Count(b => b.Estado == false), // Si estado es false, está ocupada

                // 4. NICHOS: Filtro corregido
                NichosDisponibles = _context.Boveda
                    .Include(x => x.Piso.Bloque)
                    .Where(x => x.Piso.Bloque.Tipo == "Nicho")
                    .Count(b => b.Estado == true),

                NichosOcupados = _context.Boveda
                    .Include(x => x.Piso.Bloque)
                    .Where(x => x.Piso.Bloque.Tipo == "Nicho")
                    .Count(b => b.Estado == false),

                // 5. POR CADUCAR: Corregido "Bovedas" -> "Boveda" y lógica de contrato
                BovedasPorCaducar = _context.Contrato
                .Include(c => c.Boveda.Piso.Bloque)
                .Where(c => c.Boveda.Piso.Bloque.Tipo == "Boveda" && c.Estado == true)
                // Contamos todo lo que ya venció O lo que vencerá en los próximos 30 días
                .Count(c => c.FechaFin <= hoy.AddDays(30)),

                UltimosContratos = _context.Contrato
                    .OrderByDescending(c => c.FechaCreacion) // Ordenar por los más nuevos creados
                    .Take(10)
                    .Select(c => new ContratoResumenViewModel
                    {
                        NumeroSecuencial = c.NumeroSecuencial,
                        FechaFin = c.FechaFin,
                        MontoTotal = c.MontoTotal,
                        CuotasPendientes = c.Cuotas.Count(q => !q.Pagada),
                        EstadoContrato = c.FechaFin < hoy ? "Vencido" : (c.FechaFin <= hoy.AddDays(8) ? "Próximo a vencer" : "Vigente")
                    })
                    .ToList(),

                IngresosMensuales = ingresosMensuales,
                TransaccionesRecientes = transaccionesRecientes,

                // Calcular estados de contratos
                ContratosActivos = _context.Contrato.Count(c => c.Estado),
                ContratosPorVencer = _context.Contrato.Count(c => c.Estado && c.FechaFin >= hoy && c.FechaFin <= hoy.AddDays(8)),
                ContratosVencidos = _context.Contrato.Count(c => c.FechaFin < hoy)
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
