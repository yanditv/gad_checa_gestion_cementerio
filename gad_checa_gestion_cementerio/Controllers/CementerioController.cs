using AutoMapper;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Models.Views;
using gad_checa_gestion_cementerio.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using System.Drawing;
using System.Reflection.Metadata;

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
        public async Task<IActionResult> Tarifas(CementerioModel cementerioModel)
        {
            var cementerio = _mapper.Map<Cementerio>(cementerioModel);
            _context.Cementerio.Update(cementerio);
            return View("Tarifas/Index", cementerioModel);
        }
        // Acción genérica para crear (puede ser reutilizada por otros módulos)
        // Acción para mostrar el formulario de creación
        [HttpGet]
        public IActionResult Create(string entityType)
        {
            // Determinar el tipo de modelo basado en el parámetro entityType
            Type modelType = GetModelType(entityType);

            if (modelType == null)
            {
                return NotFound(); // O manejar el error de otra manera
            }

            // Crear una instancia del modelo
            var model = Activator.CreateInstance(modelType);

            // Pasar el modelo a la vista correspondiente
            switch (entityType.ToLower())
            {
                case "bloques":
                    var numero_piso = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
                    var tipos = new List<string> { "Bovedas", "Nichos", "Otros" };
                    ViewData["NumeroDePisos"] = new SelectList(numero_piso);
                    ViewData["Tipos"] = new SelectList(tipos);
                    ViewData["Cementerios"] = new SelectList(_context.Cementerio, "Id", "Nombre");
                    return View("Bloques/Bloque", model);
                case "bovedas":
                    var bloques = _context.Bloque.ToList();
                    ViewData["Bloques"] = new SelectList(bloques, "Id", "Descripcion");
                    return View("Bovedas/Boveda", model);
                case "cobros":
                    return View("Cobros/Cobro", model);
                case "difuntos":
                    return View("Difuntos/Difunto", model);
                default:
                    return View(model);
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
                    // Guardar el modelo en la base de datos
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

                    // Redirigir a la vista principal
                    return RedirectToAction("Index");
                }
                //var model = Activator.CreateInstance(typeof(BloqueModel));
                var numero_piso = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
                var tipos = new List<string> { "Bovedas", "Nichos", "Otros" };
                ViewData["NumeroDePisos"] = new SelectList(numero_piso);
                ViewData["Tipos"] = new SelectList(tipos);
                ViewData["Cementerios"] = new SelectList(_context.Cementerio, "Id", "Nombre");
                return View("Bloque", bloque);
            }
            //if (pago != null)
            //{
            //     //model = Activator.CreateInstance(typeof(PagoModel));
            //    if (ModelState.IsValid)
            //    {
            //        // Guardar el modelo en la base de datos
            //        _context.Add(pago);
            //        await _context.SaveChangesAsync();

            //        // Redirigir a la vista principal
            //        return RedirectToAction("Index");
            //    }

            //    return View("Bloque", bloque);
            //}
            //if (cementerio != null)
            //{
            //   // model = Activator.CreateInstance(typeof(CementerioModel));
            //    if (ModelState.IsValid)
            //    {
            //        // Guardar el modelo en la base de datos
            //        _context.Add(cementerio);
            //        await _context.SaveChangesAsync();

            //        // Redirigir a la vista principal
            //        return RedirectToAction("Index");
            //    }

            //    return View("Bloque", bloque);
            //}
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
