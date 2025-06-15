using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Utils;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using gad_checa_gestion_cementerio.Models;
using Newtonsoft.Json;
using gad_checa_gestion_cementerio.services;
using gad_checa_gestion_cementerio.Models.Listas;
using QuestPDF.Fluent;
using gad_checa_gestion_cementerio.Areas.Identity.Data;
namespace gad_checa_gestion_cementerio.Controllers
{
    public class ContratosController : BaseController
    {
        private readonly ContratoService _contratoService;
        private readonly ILogger<ContratosController> _logger;
        private readonly IWebHostEnvironment _env;
        public ContratosController(ApplicationDbContext context, IMapper mapper, UserManager<ApplicationUser> userManager, ILogger<ContratosController> logger, ContratoService contratoService, IWebHostEnvironment env) : base(context, userManager, mapper)
        {
            _logger = logger;
            _contratoService = contratoService;
            _env = env;

        }
        private CreateContratoModel GetContratoFromSession()
        {
            var contratoJson = HttpContext.Session.GetString("NuevoContrato");
            if (string.IsNullOrEmpty(contratoJson))
            {
                return new CreateContratoModel
                {
                    contrato = new ContratoModel(),
                    difunto = new DifuntoModel(),
                    responsables = new List<ResponsableModel>(),
                    pago = new PagoModel()
                };
            }
            return JsonConvert.DeserializeObject<CreateContratoModel>(contratoJson);
        }

        private void SaveContratoToSession(CreateContratoModel contrato)
        {
            if (contrato == null)
            {
                HttpContext.Session.Remove("NuevoContrato");
                return;
            }
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
            // Limpiar la sesión anterior si existe
            HttpContext.Session.Remove("NuevoContrato");

            if (idContrato > 0)
            {
                var contrato = _context.Contrato
                    .Include(c => c.Boveda)
                    .Include(c => c.Difunto)
                    .Include(c => c.Responsables)
                    .Include(c => c.Cuotas)
                    .FirstOrDefault(c => c.Id == idContrato);

                if (contrato != null)
                {
                    var contratoModelView = new CreateContratoModel
                    {
                        contrato = _mapper.Map<ContratoModel>(contrato),
                        difunto = _mapper.Map<DifuntoModel>(contrato.Difunto),
                        responsables = _mapper.Map<List<ResponsableModel>>(contrato.Responsables),
                        pago = new PagoModel()
                    };
                    contratoModelView.contrato.NumeroSecuencial = _contratoService.getNumeroContrato(contrato.BovedaId, isRenovacion: true);
                    SaveContratoToSession(contratoModelView);
                    return View(contratoModelView);
                }
                return NotFound();
            }
            return InitializeNewContrato();
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

            // Validaciones adicionales
            if (viewModel.difunto == null)
            {
                return Json(new { success = false, errors = new List<string> { "Debe completar los datos del difunto." } });
            }

            if (viewModel.responsables == null || !viewModel.responsables.Any())
            {
                return Json(new { success = false, errors = new List<string> { "Debe agregar al menos un responsable." } });
            }

            if (viewModel.pago == null || !viewModel.pago.Cuotas.Any())
            {
                return Json(new { success = false, errors = new List<string> { "Debe realizar al menos un pago." } });
            }

            using (var transaction = _context.Database.BeginTransaction())
            {
                try
                {
                    var user = _userManager.GetUserAsync(User).Result;
                    var userId = user?.Id;
                    var now = DateTime.Now;

                    // Crear el contrato
                    var contrato = _mapper.Map<Contrato>(viewModel.contrato);
                    contrato.FechaCreacion = now;
                    contrato.UsuarioCreadorId = userId;
                    contrato.UsuarioActualizadorId = userId;
                    contrato.FechaActualizacion = now;
                    contrato.Estado = true; // Activo por defecto

                    // Crear el difunto
                    contrato.Difunto = _mapper.Map<Difunto>(viewModel.difunto);
                    contrato.Difunto.UsuarioCreadorId = userId;
                    contrato.Difunto.FechaCreacion = now;

                    // Crear los responsables
                    contrato.Responsables = _mapper.Map<List<Responsable>>(viewModel.responsables);
                    contrato.Responsables.ForEach(r =>
                    {
                        r.UsuarioCreador = user;
                        r.FechaCreacion = now;
                    });

                    // Crear las cuotas
                    contrato.Cuotas = _mapper.Map<List<Cuota>>(viewModel.contrato.Cuotas);
                    contrato.Cuotas.ForEach(c =>
                    {

                    });

                    _context.Contrato.Add(contrato);
                    _context.SaveChanges();

                    // Crear el pago
                    var pago = _mapper.Map<Pago>(viewModel.pago);
                    pago.PersonaPagoId = contrato.Responsables.First().Id;
                    pago.FechaPago = now;
                    _context.Pago.Add(pago);

                    _context.SaveChanges();
                    transaction.Commit();

                    // Limpiar la sesión después de guardar exitosamente
                    SaveContratoToSession(null);

                    return Json(new { success = true, contratoId = contrato.Id });
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    _logger.LogError(ex, "Error al guardar el contrato");
                    return Json(new { success = false, errors = new List<string> { "Ocurrió un error al guardar el contrato: " + ex.Message } });
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
            var cementerio = _context.Cementerio.FirstOrDefault();
            var documento = new ContratoPDF(model, cementerio);
            var pdfBytes = documento.GeneratePdf();

            return File(pdfBytes, "application/pdf", "ContratoArrendamiento.pdf");
        }
        [HttpGet]
        public IActionResult VerContratoPDF()
        {
            var cementerio = _context.Cementerio.FirstOrDefault();
            var modelo = GetContratoFromSession(); // o pásalo por parámetro
            var boveda = _context.Boveda.Include(b => b.Piso.Bloque).FirstOrDefault(b => b.Id == modelo.contrato.BovedaId);
            modelo.contrato.Boveda = _mapper.Map<BovedaModel>(boveda);
            var documento = new ContratoPDF(modelo, cementerio);
            var pdfBytes = documento.GeneratePdf();

            var fileName = $"CONTRATO_{modelo.contrato.NumeroSecuencial ?? "Arrendamiento"}.pdf";
            ViewBag.NombreArchivo = fileName;
            Response.Headers["Content-Disposition"] = $"inline; filename={fileName}";
            return new FileContentResult(pdfBytes, "application/pdf");
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

            // Cargar la lista de personas para el select2
            var personas = _context.Persona
                .Select(p => new ResponsableModel
                {
                    Id = p.Id,
                    Nombres = p.Nombres,
                    Apellidos = p.Apellidos,
                    TipoIdentificacion = p.TipoIdentificacion,
                    NumeroIdentificacion = p.NumeroIdentificacion
                })
                .ToList();
            ViewBag.Personas = personas;

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

            // Verificar si el difunto tiene descuento y aplicarlo
            decimal descuento = 0;
            if (contrato.difunto != null && contrato.difunto.DescuentoId != 0)
            {
                var descuentoObj = _context.Descuento.FirstOrDefault(d => d.Id == contrato.difunto.DescuentoId);
                if (descuentoObj != null)
                {
                    descuento = descuentoObj.Porcentaje;
                }
            }

            decimal montoSinDescuento = contrato.pago.Cuotas.Sum(c => c.Monto);
            decimal montoDescuento = montoSinDescuento * (descuento / 100m);
            contrato.pago.Monto = montoSinDescuento - montoDescuento;

            foreach (var cuota in contrato.pago.Cuotas)
            {
                Console.WriteLine(cuota.FechaVencimiento);
                cuota.Monto = contrato.pago.Monto / contrato.pago.Cuotas.Count;
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
            if (ModelState.IsValid)
            {
                var contrato = GetContratoFromSession();

                if (CuotasSeleccionadas == null || !CuotasSeleccionadas.Any())
                {
                    return Json(new { success = false, errors = new List<string> { "Debe seleccionar al menos una cuota para pagar." } });
                }

                // Validar que las cuotas seleccionadas existan
                var cuotasValidas = contrato.contrato.Cuotas.Where(c => CuotasSeleccionadas.Contains(c.TempId)).ToList();
                if (cuotasValidas.Count != CuotasSeleccionadas.Count)
                {
                    return Json(new { success = false, errors = new List<string> { "Una o más cuotas seleccionadas no son válidas." } });
                }

                pago.Cuotas = cuotasValidas;
                pago.Monto = pago.Cuotas.Sum(c => c.Monto);
                pago.FechaPago = DateTime.Now;

                // Marcar las cuotas como pagadas
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

            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return Json(new { success = false, errors });
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
        {
            if (ModelState.IsValid)
            {
                var sessionContrato = GetContratoFromSession();
                sessionContrato.contrato = contrato;

                // Validar fechas
                if (contrato.FechaInicio >= contrato.FechaFin)
                {
                    return Json(new { success = false, errors = new List<string> { "La fecha de inicio debe ser anterior a la fecha de fin." } });
                }

                // Validar número de meses
                if (contrato.NumeroDeMeses <= 0)
                {
                    return Json(new { success = false, errors = new List<string> { "El número de meses debe ser mayor a 0." } });
                }

                // Crear cuotas
                sessionContrato.contrato.Cuotas = new List<CuotaModel>();
                var montoCuota = contrato.MontoTotal / contrato.NumeroDeMeses;
                var fechaActual = contrato.FechaInicio;

                for (int i = 0; i < contrato.NumeroDeMeses; i++)
                {
                    var cuota = new CuotaModel
                    {
                        Monto = montoCuota,
                        FechaVencimiento = fechaActual.AddYears(1),
                        Pagada = false,
                        TempId = Guid.NewGuid()
                    };
                    sessionContrato.contrato.Cuotas.Add(cuota);
                    fechaActual = fechaActual.AddYears(1);
                }

                SaveContratoToSession(sessionContrato);
                return Json(new { success = true });
            }

            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return Json(new { success = false, errors });
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

        #region  Documentos

        [HttpGet]
        public IActionResult SubirDocumento(int idContrato)
        {
            var modelo = new DocumentoViewModel();

            if (idContrato > 0)
            {
                var contrato = _context.Contrato.Find(idContrato);
                if (contrato != null && !string.IsNullOrEmpty(contrato.PathDocumentoFirmado))
                {
                    modelo.RutaGuardada = contrato.PathDocumentoFirmado;
                    modelo.esNuevo = false;
                }
                ViewBag.IdContrato = idContrato;
            }

            return View(modelo);
        }

        [HttpPost]
        public async Task<IActionResult> SubirDocumento(DocumentoViewModel modelo, int idContrato)
        {
            modelo.esNuevo = true; // Aseguramos que sea un nuevo documento
            if (modelo.Archivo == null || modelo.Archivo.Length == 0)
            {
                TempData["Error"] = "Debe seleccionar un archivo válido.";
                return RedirectToAction("SubirDocumento", new { idContrato });
            }
            // Limitar tamaño: 2 MB = 2 * 1024 * 1024 bytes
            if (modelo.Archivo.Length > 2 * 1024 * 1024)
            {
                TempData["Error"] = "El archivo no debe superar los 2 MB.";
                return RedirectToAction("SubirDocumento", new { idContrato });
            }

            if (!modelo.Archivo.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            {
                TempData["Error"] = "Solo se permiten archivos PDF.";
                return RedirectToAction("SubirDocumento", new { idContrato });
            }
            var carpetaDestino = Path.Combine(_env.WebRootPath, "documentos");
            if (!Directory.Exists(carpetaDestino))
                Directory.CreateDirectory(carpetaDestino);

            var nombreArchivo = Guid.NewGuid() + Path.GetExtension(modelo.Archivo.FileName);
            var rutaCompleta = Path.Combine(carpetaDestino, nombreArchivo);

            using (var stream = new FileStream(rutaCompleta, FileMode.Create))
            {
                await modelo.Archivo.CopyToAsync(stream);
            }

            var rutaRelativa = $"/documentos/{nombreArchivo}";

            // Aquí puedes guardar en la BD si deseas

            TempData["RutaGuardada"] = rutaRelativa;
            TempData["Mensaje"] = "Archivo subido exitosamente.";

            // Guardar la ruta en el contrato
            if (idContrato > 0)
            {
                var contrato = _context.Contrato.Find(idContrato);
                if (contrato != null)
                {
                    // Si ya existe un archivo, eliminar el archivo anterior físicamente
                    if (!string.IsNullOrEmpty(contrato.PathDocumentoFirmado))
                    {
                        var rutaAnterior = Path.Combine(_env.WebRootPath, contrato.PathDocumentoFirmado.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                        if (System.IO.File.Exists(rutaAnterior))
                        {
                            System.IO.File.Delete(rutaAnterior);
                        }
                    }
                    contrato.PathDocumentoFirmado = rutaRelativa;
                    _context.SaveChanges();
                }
            }

            // 🔁 Redirige a GET para evitar el reenvío en recarga
            return RedirectToAction("SubirDocumento", new { idContrato });
        }
        #endregion

        [HttpGet]
        public IActionResult BuscarResponsable(string searchTerm)
        {
            var query = _context.Persona
                .Where(p => p.Nombres.Contains(searchTerm) ||
                           p.Apellidos.Contains(searchTerm) ||
                           p.NumeroIdentificacion.Contains(searchTerm))
                .Take(10);

            var personas = query.Select(p => new ResponsableModel
            {
                Id = p.Id,
                Nombres = p.Nombres,
                Apellidos = p.Apellidos,
                TipoIdentificacion = p.TipoIdentificacion,
                NumeroIdentificacion = p.NumeroIdentificacion,
                Telefono = p.Telefono,
                Email = p.Email,
                Direccion = p.Direccion
            }).ToList();

            return PartialView("_CreateResponsables", personas);
        }

        [HttpPost]
        public async Task<IActionResult> GuardarResponsable(ResponsableModel responsable)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    // Verificar si ya existe una persona con el mismo número de identificación
                    var personaExistente = _context.Persona.AsNoTracking()
                        .FirstOrDefault(p => p.NumeroIdentificacion == responsable.NumeroIdentificacion);

                    var identityUser1 = await _userManager.GetUserAsync(User);
                    if (identityUser1 == null)
                    {
                        return Json(new { success = false, errors = new List<string> { "Usuario no encontrado." } });
                    }
                    if (personaExistente != null)
                    {
                        // Si existe, verificar si ya es un responsable
                        var responsableExistente = _context.Responsable
                            .FirstOrDefault(r => r.Id == personaExistente.Id);

                        if (responsableExistente != null)
                        {
                            // Si ya es un responsable, devolver error
                            return Json(new
                            {
                                success = false,
                                errors = new List<string> { "Esta persona ya es un responsable." }
                            });
                        }

                        // Si no es un responsable, actualizar sus datos y crear el responsable
                        personaExistente.Nombres = responsable.Nombres;
                        personaExistente.Apellidos = responsable.Apellidos;
                        personaExistente.Telefono = responsable.Telefono;
                        personaExistente.Email = responsable.Email;
                        personaExistente.Direccion = responsable.Direccion;
                        personaExistente.UsuarioCreadorId = identityUser1.Id;

                        var nuevoResponsable = _mapper.Map<Responsable>(responsable);

                        _context.Responsable.Add(nuevoResponsable);
                        await _context.SaveChangesAsync();

                        return Json(new
                        {
                            success = true,
                            responsable = new
                            {
                                id = nuevoResponsable.Id,
                                nombres = personaExistente.Nombres,
                                apellidos = personaExistente.Apellidos,
                                tipoIdentificacion = personaExistente.TipoIdentificacion,
                                numeroIdentificacion = personaExistente.NumeroIdentificacion,
                                telefono = personaExistente.Telefono,
                                email = personaExistente.Email,
                                direccion = personaExistente.Direccion,
                                fechaInicio = nuevoResponsable.FechaInicio.ToString("yyyy-MM-dd"),
                                fechaFin = nuevoResponsable.FechaFin?.ToString("yyyy-MM-dd")
                            }
                        });
                    }
                    else
                    {
                        var identityUser = await _userManager.GetUserAsync(User);
                        if (identityUser == null)
                        {
                            return Json(new { success = false, errors = new List<string> { "Usuario no encontrado." } });
                        }
                        // Si no existe, crear nueva persona y responsable
                        var nuevoResponsable = _mapper.Map<Responsable>(responsable);
                        nuevoResponsable.UsuarioCreador = identityUser;
                        nuevoResponsable.UsuarioCreadorId = identityUser.Id;
                        nuevoResponsable.FechaCreacion = DateTime.Now;
                        _context.Responsable.Add(nuevoResponsable);
                        await _context.SaveChangesAsync();

                        return Json(new
                        {
                            success = true,
                            responsable = new
                            {
                                id = nuevoResponsable.Id,
                                nombres = nuevoResponsable.Nombres,
                                apellidos = nuevoResponsable.Apellidos,
                                tipoIdentificacion = nuevoResponsable.TipoIdentificacion,
                                numeroIdentificacion = nuevoResponsable.NumeroIdentificacion,
                                telefono = nuevoResponsable.Telefono,
                                email = nuevoResponsable.Email,
                                direccion = nuevoResponsable.Direccion,
                                fechaInicio = nuevoResponsable.FechaInicio.ToString("yyyy-MM-dd"),
                                fechaFin = nuevoResponsable.FechaFin?.ToString("yyyy-MM-dd")
                            }
                        });
                    }
                }
                catch (Exception ex)
                {
                    // Construir mensaje de error detallado
                    var errorMessage = "Error al guardar el responsable: " + ex.Message;

                    // Agregar inner exception si existe
                    if (ex.InnerException != null)
                    {
                        errorMessage += "\nInner Exception: " + ex.InnerException.Message;

                        // Para errores de base de datos, mostrar aún más detalles
                        if (ex.InnerException is DbUpdateException dbEx && dbEx.InnerException != null)
                        {
                            errorMessage += "\nDatabase Error: " + dbEx.InnerException.Message;
                        }
                    }

                    _logger.LogError(ex, "Error al guardar el responsable");
                    return Json(new
                    {
                        success = false,
                        errors = new List<string> { errorMessage }
                    });
                }
            }

            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return Json(new { success = false, errors });
        }
    }
}
