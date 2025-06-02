using AutoMapper;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Models.Views;
using gad_checa_gestion_cementerio.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace gad_checa_gestion_cementerio.Controllers
{
    public class CementerioController : BaseController
    {
        public CementerioController(ApplicationDbContext context, IMapper mapper, UserManager<IdentityUser> userManager) : base(context, userManager, mapper)
        {
        }

        public async Task<IActionResult> Index()
        {
            var cementerios = await _context.Cementerio.ToListAsync();
            var cementeriosModel = _mapper.Map<List<CementerioModel>>(cementerios);
            return View(cementeriosModel);
        }
        public async Task<IActionResult> Bloques()
        {
            var bloques = await _context.Bloque.ToListAsync();
            var bloquesModel = _mapper.Map<List<BloqueViewModel>>(bloques);
            return View("Bloques/Index", bloquesModel);
        }

        public async Task<IActionResult> Bovedas()
        {
            var bovedas = await _context.Boveda
                .Include(x => x.Piso)
                .ToListAsync();
            var bovedasModel = _mapper.Map<List<BovedaViewModel>>(bovedas);

            var bloque = await _context.Bloque.ToListAsync();

            var viewModel = new BovedaFilterModel();

            viewModel.Bovedas = bovedasModel;
            viewModel.Piso = bovedasModel.FirstOrDefault()?.Piso.Id ?? 0;

            ViewData["Bloques"] = new SelectList(bloque, "Id", "Descripcion");
            return View("Bovedas/Index", viewModel);
        }

        public async Task<IActionResult> Difuntos()
        {
            var difuntos = await _context.Difunto.ToListAsync();
            var difuntosModel = _mapper.Map<List<DifuntoModel>>(difuntos);
            return View("Difuntos/Index", difuntosModel);
        }
        public async Task<IActionResult> Cobros()
        {
            var pagos = await _context.Pago.ToListAsync();
            var pagosModel = _mapper.Map<List<PagoModel>>(pagos);
            return View("Cobros/Index", pagosModel);
        }

        public async Task<IActionResult> Tarifas()
        {
            var cementerio = await _context.Cementerio.FirstOrDefaultAsync();
            var cementerioModel = _mapper.Map<CementerioModel>(cementerio);
            return View("Tarifas/Index", cementerioModel);
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Tarifas(CementerioModel cementerioModel)
        {
            if (!ModelState.IsValid)
                return View("Tarifas/Index", cementerioModel);

            var cementerio = await _context.Cementerio.FirstOrDefaultAsync();
            if (cementerio == null)
                return NotFound();

            Console.WriteLine($"Valor anterior en DB: {cementerio.tarifa_arriendo}");
            Console.WriteLine($"Valor recibido del formulario: {cementerioModel.tarifa_arriendo}");

            cementerio.tarifa_arriendo = cementerioModel.tarifa_arriendo;
            cementerio.FechaActualizacion = DateTime.Now;

            _context.Entry(cementerio).Property(c => c.tarifa_arriendo).IsModified = true;
            _context.Entry(cementerio).Property(c => c.FechaActualizacion).IsModified = true;

            await _context.SaveChangesAsync();

            Console.WriteLine($"Nuevo valor guardado: {cementerio.tarifa_arriendo}");

            ViewBag.MensajeExito = "Tarifa actualizada correctamente.";
            var actualizado = _mapper.Map<CementerioModel>(cementerio);
            return View("Tarifas/Index", actualizado);
        }
        // Acción genérica para crear (puede ser reutilizada por otros módulos)
        // Acción para mostrar el formulario de creación
        [HttpGet]
        public async Task<IActionResult> Create(string entityType)
        {
            // Determinar el tipo de modelo basado en el parámetro entityType
            Type modelType = GetModelType(entityType);

            if (modelType == null)
            {
                return NotFound(); // O manejar el error de otra manera
            }

            switch (entityType.ToLower())
            {
                case "bloques":
                    var bloqueModel = new BloqueModel();

                    // Obtener la tarifa desde el cementerio
                    var tarifaCementerio = await _context.Cementerio
                        .Select(c => c.tarifa_arriendo)
                        .FirstOrDefaultAsync();

                    bloqueModel.TarifaBase = tarifaCementerio ?? 0;

                    var numero_piso = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
                    var tipos = new List<string> { "Bovedas", "Nichos", "Otros" };

                    ViewData["NumeroDePisos"] = new SelectList(numero_piso);
                    ViewData["Tipos"] = new SelectList(tipos);
                    ViewData["Cementerios"] = new SelectList(_context.Cementerio, "Id", "Nombre");

                    return View("Bloques/Bloque", bloqueModel);

                case "bovedas":
                    var bloques = _context.Bloque.ToList();
                    ViewData["Bloques"] = new SelectList(bloques, "Id", "Descripcion");
                    var bovedaModel = Activator.CreateInstance(modelType);
                    return View("Bovedas/Boveda", bovedaModel);

                case "cobros":
                    var cobroModel = Activator.CreateInstance(modelType);
                    return View("Cobros/Cobro", cobroModel);

                case "difuntos":
                    var difuntoModel = Activator.CreateInstance(modelType);
                    return View("Difuntos/Difunto", difuntoModel);

                default:
                    var defaultModel = Activator.CreateInstance(modelType);
                    return View(defaultModel);
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create(BloqueModel bloque)
        {
            if (bloque != null)
            {
                bloque.FechaCreacion = DateTime.Now;
                if (ModelState.IsValid)
                {
                    var bloq = _mapper.Map<Bloque>(bloque);
                    bloq.FechaCreacion = DateTime.Now;
                    bloq.UsuarioCreadorId = _userManager.GetUserId(User);
                    bloq.CementerioId = 1;
                    bloq.Estado = true;
                    bloq.FechaActualizacion = DateTime.Now;

                    var listBovedas = new List<Boveda>();

                    foreach (var piso in bloq.Pisos)
                    {
                        for (int i = 0; i < bloq.BovedasPorPiso; i++)
                        {
                            listBovedas.Add(new Boveda
                            {
                                Estado = true,
                                FechaCreacion = DateTime.Now,
                                UsuarioCreador = _userManager.GetUserAsync(User).Result,
                                PisoId = piso.Id,
                                Piso = piso,
                                Numero = i + 1
                            });
                        }
                        _context.Boveda.AddRange(listBovedas);
                    }
                    _context.Add(bloq);
                    await _context.SaveChangesAsync();

                    return RedirectToAction("Index");
                }

                var numero_piso = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
                var tipos = new List<string> { "Bovedas", "Nichos", "Otros" };
                ViewData["NumeroDePisos"] = new SelectList(numero_piso);
                ViewData["Tipos"] = new SelectList(tipos);
                ViewData["Cementerios"] = new SelectList(_context.Cementerio, "Id", "Nombre");
                return View("Bloques/Bloque", bloque);
            }

            return View("Bloques/Bloque", bloque);
        }
        // Método auxiliar para obtener el tipo de modelo
        private Type GetModelType(string entityType)
        {
            switch (entityType.ToLower())
            {
                case "bloques":
                    return typeof(BloqueModel);
                case "bovedas":
                    return typeof(BovedaViewModel);
                case "cobros":
                    return typeof(PagoModel);
                case "difuntos":
                    return typeof(DifuntoModel);
                default:
                    return null;
            }
        }


    }
}
