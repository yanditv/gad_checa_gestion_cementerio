using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Utils;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using gad_checa_gestion_cementerio.Models;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using Newtonsoft.Json;
using gad_checa_gestion_cementerio.services;
using gad_checa_gestion_cementerio.Models.Listas;
using QuestPDF.Fluent;
namespace gad_checa_gestion_cementerio.Controllers
{
    public class ContratosController : BaseController
    {
        private readonly ContratoService _contratoService;
        private readonly ILogger<ContratosController> _logger;
        public ContratosController(ApplicationDbContext context, IMapper mapper, UserManager<IdentityUser> userManager, ILogger<ContratosController> logger, ContratoService contratoService) : base(context, userManager, mapper)
        {
            _logger = logger;
            _contratoService = contratoService;

        }
        private CreateContratoModel GetContratoFromSession()
        {
            var contratoJson = HttpContext.Session.GetString("NuevoContrato");
            if (string.IsNullOrEmpty(contratoJson))
            {
                return new CreateContratoModel();
            }
            return JsonConvert.DeserializeObject<CreateContratoModel>(contratoJson);
        }

        private void SaveContratoToSession(CreateContratoModel contrato)
        {
            var contratoJson = JsonConvert.SerializeObject(contrato);
            HttpContext.Session.SetString("NuevoContrato", contratoJson);
        }
        // GET: Contratos
        public async Task<IActionResult> Index(string filtro = "", int pagina = 1)
        {
            int pageSize = 10;
            var contratosQuery = _context.Contrato
            .Include(c => c.Difunto)
            .Include(c => c.Cuotas)
            .Include(c => c.Boveda)
            .AsQueryable();

            if (!string.IsNullOrEmpty(filtro))
            {
                contratosQuery = contratosQuery.Where(c =>
                    c.NumeroSecuencial.Contains(filtro) ||
                    c.Difunto.Nombres.Contains(filtro) ||
                    c.Difunto.Apellidos.Contains(filtro));
            }

            int total = await contratosQuery.CountAsync();
            var contratos = await contratosQuery
            .OrderBy(c => c.Id)
            .Skip((pagina - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

            var viewModel = new ContratoPaginadaViewModel
            {
                Contratos = _mapper.Map<List<ContratoModel>>(contratos),
                PaginaActual = pagina,
                TotalPaginas = (int)Math.Ceiling(total / (double)pageSize),
                Filtro = filtro,
                TotalResultados = total
            };
            ViewBag.Filtro = filtro;
            return View(viewModel);
        }

        // GET: Contratos/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var contrato = await _context.Contrato
                .Include(c => c.Boveda)
                .FirstOrDefaultAsync(m => m.Id == id);
            if (contrato == null)
            {
                return NotFound();
            }

            return View(contrato);
        }

        // GET: Contratos/Create
        public IActionResult Create(int idContrato = 0)
        {
            if (idContrato > 0)
            {
                var contrato = _context.Contrato
                    .Include(c => c.Boveda)
                    .Include(c => c.Difunto)
                    .Include(c => c.Responsables)
                    .Include(c => c.Cuotas)
                    .FirstOrDefault(c => c.Id == idContrato);
                contrato.NumeroSecuencial = _contratoService.getNumeroContrato(contrato.BovedaId, isRenovacion: true);
                if (contrato != null)
                {

                    var contratoModelView = new CreateContratoModel
                    {
                        contrato = _mapper.Map<ContratoModel>(contrato),
                        difunto = _mapper.Map<DifuntoModel>(contrato.Difunto),
                        responsables = _mapper.Map<List<ResponsableModel>>(contrato.Responsables),
                    };
                    SaveContratoToSession(contratoModelView);
                    return View(contratoModelView);
                }
                else
                {
                    return NotFound();
                }
            }
            else
            {
                return InitializeNewContrato();
            }
        }
        private IActionResult InitializeNewContrato()
        {
            ViewData["BovedaId"] = new SelectList(_context.Boveda, "Id", "Estado");

            var contrato = GetContratoFromSession();
            var tipos = new List<string> { "Cedula", "RUC" };
            contrato.contrato = _mapper.Map<ContratoModel>(_contratoService.nuevoContrato());
            ViewData["TiposIdentificacion"] = new SelectList(tipos);
            SaveContratoToSession(contrato);
            return View(contrato);
        }
        public void onChangeBoveda(int bovedaId)
        {
            var boveda = _context.Boveda.Find(bovedaId);
            if (boveda != null)
            {
                var contrato = GetContratoFromSession();
                contrato.contrato.BovedaId = boveda.Id;
                SaveContratoToSession(contrato);
            }
        }

        // POST: Contratos/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        public IActionResult Save()
        {
            var viewModel = GetContratoFromSession();

            if (viewModel?.contrato == null)
            {
                return Json(new { success = false, errors = new List<string> { "No se encontró información del contrato en la sesión." } });
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return Json(new { success = false, errors });
            }

            using (var transaction = _context.Database.BeginTransaction())
            {
                try
                {
                    // Obtener usuario y su Id solo una vez
                    var userTask = _userManager.GetUserAsync(User);
                    userTask.Wait();
                    var user = userTask.Result;
                    var userId = user?.Id;

                    var contrato = _mapper.Map<Contrato>(viewModel.contrato);
                    contrato.FechaCreacion = DateTime.Now;
                    contrato.UsuarioCreadorId = userId;
                    contrato.UsuarioActualizadorId = userId;
                    contrato.FechaActualizacion = DateTime.Now;

                    // Difunto
                    contrato.Difunto = _mapper.Map<Difunto>(viewModel.difunto);
                    contrato.DifuntoId = viewModel.difunto.Id;
                    contrato.Difunto.UsuarioCreadorId = userId;
                    contrato.Difunto.FechaCreacion = DateTime.Now;

                    // Responsables
                    contrato.Responsables = _mapper.Map<List<Responsable>>(viewModel.responsables);
                    var now = DateTime.Now;
                    contrato.Responsables.ForEach(r =>
                    {
                        r.UsuarioCreador = user;
                        r.FechaCreacion = now;
                    });

                    _context.Contrato.Add(contrato);
                    _context.SaveChanges();

                    // Ahora sí, el primer responsable tiene Id
                    var pago = _mapper.Map<Pago>(viewModel.pago);
                    pago.PersonaPagoId = contrato.Responsables.FirstOrDefault()?.Id ?? 0;
                    pago.Cuotas = contrato.Cuotas.Where(c => c.Pagada).ToList();
                    pago.FechaPago = now;
                    _context.Pago.Add(pago);

                    _context.SaveChanges();

                    transaction.Commit();
                    return Json(new { success = true });
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    _logger.LogError(ex, "Error al guardar el contrato");
                    return Json(new { success = false, errors = new List<string> { "Ocurrió un error al guardar el contrato." } });
                }
            }
        }

        // GET: Contratos/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var contrato = await _context.Contrato.FindAsync(id);
            if (contrato == null)
            {
                return NotFound();
            }
            ViewData["BovedaId"] = new SelectList(_context.Boveda, "Id", "Estado", contrato.BovedaId);
            return View(contrato);
        }

        // POST: Contratos/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,BovedaId,FechaInicio,FechaFin,MontoTotal,Estado,Observaciones")] Contrato contrato)
        {
            if (id != contrato.Id)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(contrato);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!ContratoExists(contrato.Id))
                    {
                        return NotFound();
                    }
                    else
                    {
                        throw;
                    }
                }
                return RedirectToAction(nameof(Index));
            }
            ViewData["BovedaId"] = new SelectList(_context.Boveda, "Id", "Estado", contrato.BovedaId);
            return View(contrato);
        }

        // GET: Contratos/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var contrato = await _context.Contrato
                .Include(c => c.Boveda)
                .FirstOrDefaultAsync(m => m.Id == id);
            if (contrato == null)
            {
                return NotFound();
            }

            return View(contrato);
        }

        // POST: Contratos/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var contrato = await _context.Contrato.FindAsync(id);
            if (contrato != null)
            {
                _context.Contrato.Remove(contrato);
            }

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private bool ContratoExists(int id)
        {
            return _context.Contrato.Any(e => e.Id == id);
        }
        public IActionResult GenerarContratoPDF(CreateContratoModel model)
        {
            var documento = new ContratoPDF(model);
            var pdfBytes = documento.GeneratePdf();

            return File(pdfBytes, "application/pdf", "ContratoArrendamiento.pdf");
        }
        [HttpGet]
        public IActionResult VerContratoPDF()
        {
            var modelo = GetContratoFromSession(); // o pásalo por parámetro
            var boveda = _context.Boveda.Include(b => b.Piso.Bloque).FirstOrDefault(b => b.Id == modelo.contrato.BovedaId);
            modelo.contrato.Boveda = _mapper.Map<BovedaModel>(boveda);
            var documento = new ContratoPDF(modelo);
            var pdfBytes = documento.GeneratePdf();

            return File(pdfBytes, "application/pdf");
        }
        // CREAR DIFUNTO
        [HttpGet]
        public IActionResult CreateDifunto()
        {
            var contrato = GetContratoFromSession();
            var difunto = contrato.difunto ?? new DifuntoModel();
            var descuentos = _context.Descuento.ToList();
            ViewData["DescuentoId"] = new SelectList(descuentos, "Id", "Descripcion");
            return PartialView("_CreateDifunto", difunto);
        }
        [HttpPost]
        public IActionResult CreateDifunto(DifuntoModel difunto)
        {
            if (ModelState.IsValid)
            {
                var contrato = GetContratoFromSession();
                // Lógica para guardar los datos del difunto
                // ...
                contrato.difunto = difunto;
                contrato.contrato.DifuntoId = difunto.Id;
                SaveContratoToSession(contrato);
                return Json(new { success = true });
            }

            return Json(new { success = false, errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
        }


        // CREAR RESPONSABLE
        [HttpGet]
        public IActionResult CreateResponsables()
        {
            var contrato = GetContratoFromSession();
            var responsables = contrato.responsables;
            var tipos = new List<string> { "Cedula", "RUC" };
            ViewData["TiposIdentificacion"] = new SelectList(tipos);
            return PartialView("_CreateResponsables", responsables);
        }
        [HttpPost]
        public IActionResult CreateResponsables(List<ResponsableModel> responsables)
        {
            if (ModelState.IsValid)
            {
                var contrato = GetContratoFromSession();
                contrato.contrato.Responsables = responsables;
                SaveContratoToSession(contrato);
                return Json(new { success = true });
            }

            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return Json(new { success = false, errors });
        }
        [HttpPost]
        public IActionResult AddResponsable(ResponsableModel responsable)
        {
            if (ModelState.IsValid)
            {
                var contrato = GetContratoFromSession();
                contrato.responsables.Add(responsable);
                SaveContratoToSession(contrato);
                return Json(new { success = true, responsable });
            }
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return Json(new { success = false, errors });
        }
        // CREAR PAGO
        [HttpGet]
        public IActionResult CreatePago()
        {
            ViewData["TiposPago"] = new SelectList(new List<string> { "Efectivo", "Transferencia", "Banco" });
            var contrato = GetContratoFromSession();
            contrato.pago.Cuotas = contrato.contrato.Cuotas.Where(c => !c.Pagada).ToList();
            contrato.pago.FechaPago = DateTime.Now;
            contrato.pago.Monto = contrato.pago.Cuotas.Sum(c => c.Monto);
            foreach (var cuota in contrato.pago.Cuotas)
            {
                Console.WriteLine(cuota.FechaVencimiento);
            }
            var firstResponsable = contrato.responsables.FirstOrDefault();
            if (firstResponsable != null)
            {
                contrato.pago.PersonaPagoId = firstResponsable.Id;
            }
            SaveContratoToSession(contrato);
            return PartialView("_CreatePago", contrato.pago);
        }
        [HttpPost]
        public IActionResult CreatePago(PagoModel pago, List<Guid> CuotasSeleccionadas)
        {
            Console.WriteLine("Cuotas seleccionadas: " + string.Join(", ", CuotasSeleccionadas));
            if (ModelState.IsValid)
            {
                var contrato = GetContratoFromSession();
                pago.Cuotas = contrato.contrato.Cuotas.Where(c => CuotasSeleccionadas.Contains(c.TempId)).ToList();

                // Marcar las cuotas seleccionadas como pagadas
                foreach (var cuota in contrato.contrato.Cuotas)
                {
                    if (CuotasSeleccionadas.Contains(cuota.TempId))
                    {
                        cuota.Pagada = true;
                    }
                }

                contrato.pago = pago;
                SaveContratoToSession(contrato);
                return Json(new { success = true });
            }

            return Json(new { success = false, errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
        }
        // CREAR CONTRATO 
        [HttpGet]
        public IActionResult CreateContrato()
        {
            var contrato_model = GetContratoFromSession();
            var tarifa = _context.Cementerio.FirstOrDefault()?.tarifa_arriendo ?? 0;
            contrato_model.contrato.NumeroDeMeses = 5;
            contrato_model.contrato.FechaInicio = DateTime.Now;
            contrato_model.contrato.FechaFin = contrato_model.contrato.FechaInicio.AddYears(contrato_model.contrato.NumeroDeMeses);
            contrato_model.contrato.Difunto = new DifuntoModel();
            contrato_model.contrato.MontoTotal = tarifa;
            ViewBag.BovedaId = new SelectList(_context.Boveda.Where(b => b.Estado), "Id", "Numero");
            return PartialView("_CreateContrato", contrato_model.contrato);
        }
        [HttpGet]
        public IActionResult RecargarContratoByTipo(int idBoveda)
        {
            // Lógica para obtener el modelo actualizado según el tipo
            var contratoSession = GetContratoFromSession();
            var contrato_model = contratoSession.contrato;
            contrato_model.NumeroSecuencial = _contratoService.getNumeroContrato(idBoveda);
            SaveContratoToSession(contratoSession);
            //return Json(new { success = true, contrato = contrato_model });
            return Json(new { success = true, numeroSecuencial = contrato_model.NumeroSecuencial });
            // return View("Create", contratoSession); // O puedes retornar Json(model) si prefieres trabajar con JS puro
        }

        [HttpPost]
        public IActionResult CreateContrato(ContratoModel contrato)
        {// Asegurarse de que el difunto no sea nulo
            contrato.Difunto ??= new DifuntoModel()
            {
                Nombres = "",
                Apellidos = "",
                FechaNacimiento = DateTime.Now,
                FechaFallecimiento = DateTime.Now,
                NumeroIdentificacion = ""
            };
            contrato.Boveda = _mapper.Map<BovedaModel>(_context.Boveda.Include(x => x.Piso.Bloque).Include(x => x.UsuarioCreador).Where(x => x.Id == contrato.BovedaId).FirstOrDefault());

            if (ModelState.IsValid)
            {
                var sessionContrato = GetContratoFromSession();
                sessionContrato.contrato = contrato;
                // crear cuotas a partir del numero de meses
                var montoCuota = contrato.MontoTotal / contrato.NumeroDeMeses;
                for (int i = 0; i < contrato.NumeroDeMeses; i++)
                {
                    var cuota = new CuotaModel
                    {
                        Monto = montoCuota,
                        FechaVencimiento = contrato.FechaInicio.AddYears(i + 1),
                        Pagada = false

                    };
                    sessionContrato.contrato.Cuotas.Add(cuota);

                }
                SaveContratoToSession(sessionContrato);
                return Json(new { success = true });
            }

            return Json(new { success = false, errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
        }
        //Documento

        // CREAR CONTRATO
        [HttpGet]
        public IActionResult DocumentoContrato()
        {
            var contrato = GetContratoFromSession();

            return PartialView("_DocumentoContrato", contrato);
        }
        #region BusquedaBovedas
        [HttpGet]
        public IActionResult BuscarBovedas(string filtro, int pagina = 1)
        {
            int pageSize = 10;
            var query = _context.Boveda.AsQueryable();

            if (!string.IsNullOrEmpty(filtro))
            {
                query = query.Where(b => b.NumeroSecuecial.Contains(filtro));
            }

            int total = query.Count();
            var bovedas = query
                .Include(b => b.Piso.Bloque)
                .OrderBy(b => b.NumeroSecuecial)
                .Skip((pagina - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var viewModel = new BovedaPaginadaViewModel
            {
                Bovedas = _mapper.Map<List<BovedaModel>>(bovedas),
                PaginaActual = pagina,
                TotalPaginas = (int)Math.Ceiling(total / (double)pageSize),

                Filtro = filtro
            };

            return PartialView("_SelectBoveda", viewModel);
        }
        public IActionResult BuscarBovedasJson(string filtro, int pagina = 1)
        {
            int pageSize = 10;
            var query = _context.Boveda.AsQueryable();

            if (!string.IsNullOrEmpty(filtro))
            {
                query = query.Where(b => b.NumeroSecuecial.Contains(filtro));
            }

            int total = query.Count();

            var bovedas = query
            .Include(b => b.Piso.Bloque)
                .OrderBy(b => b.NumeroSecuecial)
                .Skip((pagina - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var listaBovedas = _mapper.Map<List<BovedaModel>>(bovedas);

            var resultado = new
            {
                bovedas = listaBovedas.Select(b => new
                {
                    id = b.Id,
                    numeroSecuecial = b.NumeroSecuecial,
                    numero = b.Numero,
                    tipo = b.Piso.Bloque.Tipo,
                    estado = b.Estado ? "Activa" : "Inactiva"
                }),
                paginaActual = pagina,
                totalPaginas = (int)Math.Ceiling(total / (double)pageSize),
                filtro = filtro
            };

            return Json(resultado);
        }
        #endregion
    }
}
