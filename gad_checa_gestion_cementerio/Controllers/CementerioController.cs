using AutoMapper;
using gad_checa_gestion_cementerio.Areas.Identity.Data;
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
        public CementerioController(ApplicationDbContext context, IMapper mapper, UserManager<ApplicationUser> userManager) : base(context, userManager, mapper)
        {
        }

        public async Task<IActionResult> Index()
        {
            var cementerios = await _context.Cementerio.FirstOrDefaultAsync();
            var cementeriosModel = _mapper.Map<CementerioModel>(cementerios);
            var entidades = new List<string> { "Banco", "Cooperativa de Ahorra y credito" };
            ViewData["entidades"] = new SelectList(entidades);
            return View(cementeriosModel);
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Index(CementerioModel cementerioModel)
        {
            var entidades = new List<string> { "Banco", "Cooperativa de Ahorra y credito" };
            ViewData["endidades"] = new SelectList(entidades);
            if (ModelState.IsValid)
            {
                var cementerio = await _context.Cementerio.FirstOrDefaultAsync();
                if (cementerio == null)
                {
                    return NotFound();
                }

                // Actualizar los campos del cementerio
                cementerio.Nombre = cementerioModel.Nombre;
                cementerio.Direccion = cementerioModel.Direccion;
                cementerio.Email = cementerioModel.Email;
                cementerio.Telefono = cementerioModel.Telefono;
                cementerio.Presidente = cementerioModel.Presidente;
                cementerio.AbreviaturaTituloPresidente = cementerioModel.AbreviaturaTituloPresidente;
                cementerio.FechaActualizacion = DateTime.Now;
                //actualiza el banco y cooperativa
                cementerio.EntidadFinanciera = cementerioModel.EntidadFinanciera;
                cementerio.NombreEntidadFinanciera = cementerioModel.NombreEntidadFinanciera;
                cementerio.NumeroCuenta = cementerioModel.NumeroCuenta;

                cementerio.UsuarioActualizador = await _userManager.GetUserAsync(User);
                cementerio.UsuarioActualizadorId = _userManager.GetUserId(User);
                _context.Entry(cementerio).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                var actualizado = _mapper.Map<CementerioModel>(cementerio);
                ViewData["endidades"] = new SelectList(entidades);
                return View(actualizado);
            }
            else
            {
                ViewData["endidades"] = new SelectList(entidades);
                return View(cementerioModel);
            }
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

            // El problema está aquí. Estás mapeando a BovedaModel, pero BovedaFilterModel
            // espera BovedaViewModel en su propiedad Bovedas.
            // Si BovedaFilterModel.Bovedas es List<BovedaViewModel>, entonces debes mapear a BovedaViewModel.
            var bovedasModel = _mapper.Map<List<BovedaViewModel>>(bovedas); // CAMBIO A BovedaViewModel

            var bloque = await _context.Bloque.ToListAsync();

            var viewModel = new BovedaFilterModel();

            viewModel.Bovedas = bovedasModel; // Ahora coincidirá con el tipo esperado

            // Esta línea es problemática si bovedasModel está vacío, ya que FirstOrDefault() será null.
            // Se abordará en las advertencias.
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
            var cementerio = await _context.Cementerio.FirstOrDefaultAsync();

            if (cementerio == null)
                return NotFound();
            // Actualizar las tarifas del cementerio

            cementerio.VecesRenovacionNicho = cementerioModel.VecesRenovacionNicho;
            cementerio.VecesRenovacionBovedas = cementerioModel.VecesRenovacionBovedas;
            cementerio.AniosArriendoNicho = cementerioModel.AniosArriendoNicho;
            cementerio.AniosArriendoBovedas = cementerioModel.AniosArriendoBovedas;
            cementerio.tarifa_arriendo_nicho = cementerioModel.tarifa_arriendo_nicho;
            cementerio.tarifa_arriendo = cementerioModel.tarifa_arriendo;
            cementerio.FechaActualizacion = DateTime.Now;
            cementerio.UsuarioActualizador = await _userManager.GetUserAsync(User);
            cementerio.UsuarioActualizadorId = _userManager.GetUserId(User);
            _context.Entry(cementerio).State = EntityState.Modified;
            await _context.SaveChangesAsync();
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
                    var bovedaModel = Activator.CreateInstance(modelType) as BovedaModel; // Asegúrate de que es BovedaModel

                    // *** CAMBIO CLAVE AQUÍ: Crear un SelectList para Propietarios en Create ***
                    var propietariosForCreate = await _context.Persona
                        .Select(p => new SelectListItem
                        {
                            Value = p.Id.ToString(),
                            Text = p.Nombres + " " + p.Apellidos
                        })
                        .ToListAsync();

                    // Convertir a SelectList ANTES de pasarla a ViewData
                    ViewData["Propietarios"] = new SelectList(propietariosForCreate, "Value", "Text");

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
                    return typeof(BovedaModel);
                case "cobros":
                    return typeof(PagoModel);
                case "difuntos":
                    return typeof(DifuntoModel);
                default:
                    return null;
            }
        }

        [HttpGet]
        public async Task<IActionResult> Edit(string entityType, int id = 1)
        {
            // Determinar el tipo de modelo basado en el parámetro entityTyp
            Type modelType = GetModelType(entityType);

            if (modelType == null)
            {
                return NotFound(); // O manejar el error de otra manera
            }
            switch (entityType.ToLower())
            {
                case "bloques":

                    return View("Bloques/Bloque", new BloqueModel());

                case "bovedas":
                    var boveda = await _context.Boveda
                        .Include(b => b.Piso)
                        .Include(b => b.Propietario)
                        .FirstOrDefaultAsync(b => b.Id == id);

                    if (boveda == null)
                        return NotFound();

                    var bovedaModel = _mapper.Map<BovedaModel>(boveda);
                    Console.WriteLine($"PropietarioId en el modelo: {bovedaModel.PropietarioId}");
                    var pisos = await _context.Piso.ToListAsync();
                    ViewBag.Pisos = new SelectList(pisos, "Id", "Numero", bovedaModel.PisoId);

                    // *** CAMBIO CLAVE AQUÍ: Crear una List<SelectListItem> ***
                    var propietarios = await _context.Persona
                        .Select(p => new SelectListItem
                        {
                            Value = p.Id.ToString(),
                            Text = p.Nombres + " " + p.Apellidos,
                            Selected = (p.Id == boveda.PropietarioId) // Utiliza las propiedades Nombres y Apellidos
                        })
                        .ToListAsync();

                    ViewBag.Propietarios = propietarios; // Ahora es una List<SelectListItem> directamente

                    foreach (var prop in propietarios)
                    {
                        Console.WriteLine($"Prop: {prop.Text}, Selected: {prop.Selected}");
                    }

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
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(BovedaModel model)
        {
            if (!ModelState.IsValid)
            {
                var bloques = await _context.Bloque.ToListAsync();
                ViewData["Bloques"] = new SelectList(bloques, "Id", "Descripcion");
                return View("Bovedas/Boveda", model);
            }

            var boveda = await _context.Boveda.FindAsync(model.Id);
            if (boveda == null)
                return NotFound();

            // Actualiza campos
            boveda.NumeroSecuencial = model.NumeroSecuencial;
            boveda.FechaActualizacion = DateTime.Now;
            boveda.UsuarioActualizador = await _userManager.GetUserAsync(User);
            boveda.PropietarioId = model.PropietarioId;
            Console.WriteLine($"Propietario recibido del formulario: {model.PropietarioId}");
            _context.Entry(boveda).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            Console.WriteLine($"Asignado a boveda: {boveda.PropietarioId}");

            return RedirectToAction("Bovedas");
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(BovedaModel model)
        {
            if (!ModelState.IsValid)
            {
                // Cargar combos nuevamente si hay errores
                var bloques = await _context.Bloque.ToListAsync();
                ViewData["Bloques"] = new SelectList(bloques, "Id", "Descripcion");

                var propietarios = await _context.Persona
                    .OfType<Propietario>()
                    .Where(p => p.Estado)
                    .Select(p => new SelectListItem
                    {
                        Value = p.Id.ToString(),
                        Text = p.Nombres + " " + p.Apellidos
                    }).ToListAsync();

                ViewBag.Propietarios = propietarios;

                return View("Bovedas/Boveda", model);
            }

            // Guardar la nueva bóveda
            var boveda = _mapper.Map<Boveda>(model);
            boveda.FechaCreacion = DateTime.Now;
            boveda.UsuarioCreador = await _userManager.GetUserAsync(User);
            boveda.FechaActualizacion = DateTime.Now;

            _context.Boveda.Add(boveda);
            await _context.SaveChangesAsync();

            return RedirectToAction("Bovedas");
        }




    }
}
