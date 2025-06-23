using AutoMapper;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Utils;
using gad_checa_gestion_cementerio.Controllers.Pdf;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using gad_checa_gestion_cementerio.Models.Listas;
using gad_checa_gestion_cementerio.Areas.Identity.Data;

namespace gad_checa_gestion_cementerio.Controllers
{
    public class CobrosController : BaseController
    {
        public CobrosController(ApplicationDbContext context, IMapper mapper, UserManager<ApplicationUser> userManager) : base(context, userManager, mapper)
        {
        }
        // GET: CobrosController
        public ActionResult Index(string filtro = "", int pagina = 1)
        {
            int pageSize = 10;
            var contratosQuery = _context.Contrato
                .Include(c => c.Boveda)
                .Include(c => c.Difunto)
                .Include(c => c.Responsables)
                .Include(c => c.Cuotas)
                .AsQueryable();

            if (!string.IsNullOrEmpty(filtro))
            {
                contratosQuery = contratosQuery.Where(c =>
                    c.NumeroSecuencial.Contains(filtro) ||
                    c.Difunto.Nombres.Contains(filtro) ||
                    c.Difunto.Apellidos.Contains(filtro));
            }

            int total = contratosQuery.Count();
            var contratos = contratosQuery
                .OrderByDescending(c => c.Cuotas
                    .SelectMany(q => q.Pagos)
                    .OrderByDescending(p => p.FechaPago)
                    .Select(p => p.FechaPago)
                    .FirstOrDefault())
                .Skip((pagina - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var viewModel = new ContratoPaginadaViewModel
            {
                Contratos = _mapper.Map<List<Models.ContratoModel>>(contratos),
                PaginaActual = pagina,
                TotalPaginas = (int)Math.Ceiling(total / (double)pageSize),
                Filtro = filtro,
                TotalResultados = total
            };
            ViewBag.Filtro = filtro;

            return View(viewModel);

        }

        // GET  : COBRAR
        public ActionResult Cobrar(int id)
        {
            var contrato = _context.Contrato
                .Include(c => c.Boveda)
                .Include(c => c.Difunto)
                .Include(c => c.Responsables)
                .Include(c => c.Cuotas)
                .FirstOrDefault(c => c.Id == id);

            if (contrato == null)
            {
                return NotFound();
            }
            var responsablePrincipal = contrato.Responsables.FirstOrDefault();
            var pago = new PagoModel
            {
                FechaPago = DateTime.Now,
                TipoPago = "Efectivo", // O puedes permitir que el usuario seleccione el tipo de pago
                NumeroComprobante = "", // Puedes dejarlo vacío o permitir que el usuario lo ingrese
                Monto = contrato.MontoTotal,
                PersonaPagoId = responsablePrincipal != null ? responsablePrincipal.Id : 0, // Asignar responsable principal
                Cuotas = new List<CuotaModel>()
            };

            var contratoModel = _mapper.Map<Models.ContratoModel>(contrato);
            ViewData["TiposPago"] = new SelectList(new List<string> { "Efectivo", "Transferencia", "Banco" });
            // asignamos al pago, las cuotas pendientes del contrato
            pago.Cuotas = contratoModel.Cuotas.Where(c => !c.Pagada).ToList();

            var personas = _context.Persona
                .Where(p => p.Estado)
                .OrderBy(p => p.Nombres)
                .ThenBy(p => p.Apellidos)
                .ToList();
            ViewBag.Responsables = personas.Select(p => new SelectListItem
            {
                Value = p.Id.ToString(),
                Text = $"{p.Nombres} {p.Apellidos}"
            }).ToList();
            return View(pago);
        }
        [HttpPost]
        public ActionResult Cobrar(PagoModel pago, List<int> CuotasSeleccionadas)
        {
            try
            {
                if (!ModelState.IsValid || !CuotasSeleccionadas.Any())
                {
                    ViewData["TiposPago"] = new SelectList(new List<string> { "Efectivo", "Transferencia", "Banco" });

                    var primeraCuota = _context.Cuota
                        .Include(c => c.Contrato)
                        .ThenInclude(c => c.Responsables)
                        .FirstOrDefault(c => CuotasSeleccionadas.Contains(c.Id));

                    if (primeraCuota != null)
                    {
                        ViewData["Responsables"] = primeraCuota.Contrato.Responsables.Select(r => new SelectListItem
                        {
                            Value = r.Id.ToString(),
                            Text = r.Nombres + " " + r.Apellidos
                        }).ToList();
                    }
                    else
                    {
                        ViewData["Responsables"] = new List<SelectListItem>();
                    }

                    ModelState.AddModelError("", "Debe seleccionar al menos una cuota.");
                    return View(pago);
                }
                else
                {
                    var cuotas = _context.Cuota
                    .Where(c => CuotasSeleccionadas.Contains(c.Id))
                    .ToList();

                    foreach (var cuota in cuotas)
                    {
                        cuota.Pagada = true;
                    }

                    // Se crea el objeto Pago sin modificar los modelos
                    var pagoEntity = new Pago
                    {
                        FechaPago = pago.FechaPago,
                        TipoPago = pago.TipoPago,
                        NumeroComprobante = pago.NumeroComprobante,
                        Monto = cuotas.Sum(c => c.Monto),
                        PersonaPagoId = pago.PersonaPagoId,
                        Cuotas = cuotas
                    };
                    // Se asegura que Entity Framework reconozca los cambios en las cuotas
                    foreach (var cuota in cuotas)
                    {
                        _context.Entry(cuota).State = EntityState.Modified;
                    }

                    _context.Pago.Add(pagoEntity);
                    _context.SaveChanges();
                    TempData["PagoID"] = pagoEntity.Id;
                    // return RedirectToAction("FacturaPdf", new { id = pagoEntity.Id });
                    return RedirectToAction(nameof(Index));
                }
            }
            catch (Exception ex)
            {
                ModelState.AddModelError("", "Ocurrió un error al procesar el pago: " + ex.Message);
                return View(pago);
            }
        }


        public IActionResult FacturaPdf(int id)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var pago = _context.Pago
                .Include(p => p.Cuotas)
                    .ThenInclude(c => c.Contrato)
                        .ThenInclude(c => c.Boveda)
                            .ThenInclude(b => b.Piso)
                                .ThenInclude(p => p.Bloque)
                                    .ThenInclude(b => b.Cementerio)
                .Include(p => p.Cuotas)
                    .ThenInclude(c => c.Contrato)
                        .ThenInclude(c => c.Responsables)
                .FirstOrDefault(p => p.Id == id);

            if (pago == null)
                return NotFound();

            var persona = _context.Persona.FirstOrDefault(p => p.Id == pago.PersonaPagoId);
            if (persona == null)
                return NotFound("Persona que realizó el pago no encontrada.");

            var document = new FacturaPagoPdfDocument(pago, persona);
            var pdf = document.GeneratePdf();

            Response.Headers["Content-Disposition"] = "inline; filename=FacturaPago.pdf";
            return File(pdf, "application/pdf");
        }
        public IActionResult Facturas(int id)
        {
            var pagos = _context.Pago
                .Include(p => p.Cuotas)
                .ThenInclude(c => c.Contrato)
                .ThenInclude(c => c.Responsables)
                    .Include(p => p.Cuotas)
                        .ThenInclude(c => c.Contrato)
                            .ThenInclude(c => c.Difunto)
                .Where(p => p.Cuotas.Any(c => c.ContratoId == id && c.Pagada))
                .OrderByDescending(p => p.FechaPago)
                .ToList();

            var contrato = _context.Contrato.FirstOrDefault(c => c.Id == id);
            ViewData["ContratoId"] = id;
            ViewData["ContratoSerie"] = contrato?.NumeroSecuencial;

            return View(pagos);
        }



    }
}

