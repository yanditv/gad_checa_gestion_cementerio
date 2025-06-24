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
using QuestPDF.Infrastructure;
using QuestPDF.Helpers;
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

        private void SaveContratoToSession(CreateContratoModel? contrato)
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
                .ThenInclude(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
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
            .OrderByDescending(c => c.FechaCreacion)
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

            // Agregar información adicional para la vista
            ViewBag.Filtro = filtro;

            // Obtener configuración del cementerio
            var cementerio = _context.Cementerio.FirstOrDefault();
            ViewBag.Cementerio = cementerio;
            ViewBag.MaxRenovacionesBovedas = cementerio?.VecesRenovacionBovedas ?? 0;
            ViewBag.MaxRenovacionesNichos = cementerio?.VecesRenovacionNicho ?? 0;

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
                    .ThenInclude(b => b.Piso)
                        .ThenInclude(p => p.Bloque)
                .Include(c => c.Boveda)
                    .ThenInclude(b => b.Propietario)
                .Include(c => c.Difunto)
                .Include(c => c.Responsables)
                .Include(c => c.Cuotas)
                    .ThenInclude(c => c.Pagos)
                .Include(c => c.ContratoOrigen) // Incluir el contrato original si existe
                .FirstOrDefaultAsync(m => m.Id == id);

            if (contrato == null)
            {
                return NotFound();
            }

            var contratoModel = _mapper.Map<ContratoModel>(contrato);

            // Mapear las fechas de pago a las cuotas y asociar el PagoId si está pagada
            foreach (var cuota in contratoModel.Cuotas)
            {
                var cuotaEntity = contrato.Cuotas.FirstOrDefault(c => c.Id == cuota.Id);
                if (cuotaEntity?.Pagos != null && cuotaEntity.Pagos.Any())
                {
                    cuota.FechaPago = cuotaEntity.Pagos.First().FechaPago;
                    // Asociar el PagoId para la vista
                    cuota.PagoId = cuotaEntity.Pagos.First().Id;
                }
            }

            // Asegurar que la bóveda y el propietario estén correctamente mapeados
            if (contrato.Boveda != null)
            {
                contratoModel.Boveda = _mapper.Map<BovedaModel>(contrato.Boveda);
            }

            // Si es una renovación, cargar los datos del contrato original
            if (contrato.EsRenovacion && contrato.ContratoOrigenId.HasValue && contrato.ContratoOrigen != null)
            {
                contratoModel.ContratoOrigen = _mapper.Map<ContratoModel>(contrato.ContratoOrigen);
                ViewBag.ContratoOrigen = contratoModel.ContratoOrigen;
            }            // Buscar contratos que son renovaciones de este (contratos hijos)
            var contratosHijos = _context.Contrato
                .Where(c => c.ContratoOrigenId == id)
                .OrderBy(c => c.FechaInicio)
                .ToList();

            if (contratosHijos.Any())
            {
                ViewBag.ContratosHijos = _mapper.Map<List<ContratoModel>>(contratosHijos);
            }

            // Obtener el contrato raíz para calcular renovaciones totales
            int contratoRaizId = contrato.Id;
            if (contrato.EsRenovacion && contrato.ContratoOrigenId.HasValue)
            {
                // Encontrar el contrato raíz siguiendo la cadena hacia arriba
                var contratoActual = contrato;
                while (contratoActual.EsRenovacion && contratoActual.ContratoOrigenId.HasValue)
                {
                    var contratoAnterior = _context.Contrato
                        .FirstOrDefault(c => c.Id == contratoActual.ContratoOrigenId);

                    if (contratoAnterior == null) break;

                    contratoRaizId = contratoAnterior.Id;
                    contratoActual = contratoAnterior;
                }
            }

            // Contar todas las renovaciones en la cadena y obtener límites
            int totalRenovaciones = ContarRenovacionesEnCadena(contratoRaizId);

            // Obtener configuración del cementerio para límites de renovaciones
            var cementerio = _context.Cementerio.FirstOrDefault();
            int maxRenovaciones = 0;

            // Determinar el tipo de espacio y su límite máximo de renovaciones
            string? tipoBoveda = contrato.Boveda?.Piso?.Bloque?.Tipo?.ToLower();
            if (tipoBoveda == "nichos")
            {
                maxRenovaciones = cementerio?.VecesRenovacionNicho ?? 0;
            }
            else
            {
                maxRenovaciones = cementerio?.VecesRenovacionBovedas ?? 0;
            }

            // Pasar estos datos a la vista
            ViewBag.TotalRenovacionesEnCadena = totalRenovaciones;
            ViewBag.MaxRenovacionesPermitidas = maxRenovaciones;

            return View(contratoModel);
        }

        // GET: Contratos/Create
        public IActionResult Create(int idContrato = 0)
        {
            // Limpiar la sesión anterior si existe
            HttpContext.Session.Remove("NuevoContrato");

            // Si idContrato > 0, entonces es una renovación
            bool esRenovacion = idContrato > 0;

            if (esRenovacion)
            {
                var contrato = _context.Contrato
                    .Include(c => c.Boveda)
                        .ThenInclude(b => b.Piso)
                            .ThenInclude(p => p.Bloque)
                    .Include(c => c.Difunto)
                    .Include(c => c.Responsables)
                    .Include(c => c.Cuotas)
                    .AsNoTracking() // Evitar el seguimiento de cambios
                    .FirstOrDefault(c => c.Id == idContrato);

                if (contrato != null)
                {
                    // Verificar límites de renovación
                    var cementerio = _context.Cementerio.FirstOrDefault();
                    if (cementerio == null)
                    {
                        TempData["Error"] = "No se encontró información del cementerio para verificar renovaciones.";
                        return RedirectToAction(nameof(Index));
                    }

                    // Obtener el tipo de bóveda (nichos o bovedas)
                    string? tipoBoveda = null;
                    if (contrato.Boveda?.Piso?.Bloque != null)
                    {
                        tipoBoveda = contrato.Boveda.Piso.Bloque.Tipo;
                    }

                    // Contar cuántas veces se ha renovado este contrato (hijos generados directamente)
                    int vecesRenovado = _context.Contrato
                        .Count(c => c.ContratoOrigenId == contrato.Id);

                    // Determinar máximo de renovaciones según el tipo
                    int maxRenovaciones;
                    if (tipoBoveda?.ToLower() == "nichos")
                    {
                        maxRenovaciones = cementerio.VecesRenovacionNicho;
                    }
                    else // Por defecto consideramos que es una bóveda
                    {
                        maxRenovaciones = cementerio.VecesRenovacionBovedas;
                    }

                    // Si el máximo de renovaciones es 0, no se permite ninguna renovación
                    if (maxRenovaciones == 0)
                    {
                        TempData["Error"] = $"No se permite renovar este tipo de contrato según la configuración del cementerio.";
                        return RedirectToAction(nameof(Details), new { id = idContrato });
                    }

                    // Encontrar el contrato raíz (primer contrato en la cadena)
                    int contratoRaizId = contrato.Id;

                    // Si es una renovación, buscar el contrato raíz original
                    if (contrato.EsRenovacion && contrato.ContratoOrigenId.HasValue)
                    {
                        // Buscar el contrato raíz siguiendo la cadena hasta el inicio
                        var contratoActual = contrato;

                        // Seguir la cadena hacia arriba hasta encontrar el contrato raíz
                        while (contratoActual.EsRenovacion && contratoActual.ContratoOrigenId.HasValue)
                        {
                            var contratoAnterior = _context.Contrato
                                .FirstOrDefault(c => c.Id == contratoActual.ContratoOrigenId);

                            if (contratoAnterior == null) break;

                            contratoRaizId = contratoAnterior.Id;
                            contratoActual = contratoAnterior;
                        }
                    }

                    // Encontrar el último contrato en la cadena de renovaciones
                    var ultimoContrato = EncontrarUltimoContratoEnCadena(contratoRaizId);

                    // Verificar si este contrato es el último de la cadena
                    if (ultimoContrato != null && ultimoContrato.Id != contrato.Id)
                    {
                        // Si no es el último, redirigir al usuario a los detalles del último contrato
                        TempData["Error"] = $"Solo se puede renovar el contrato más reciente en la cadena de renovaciones. " +
                            $"Debe renovar el contrato {ultimoContrato.NumeroSecuencial} en su lugar.";
                        return RedirectToAction(nameof(Details), new { id = ultimoContrato.Id });
                    }

                    // IMPORTANTE: Verificar el número total de renovaciones en toda la cadena
                    int totalRenovacionesEnCadena = ContarRenovacionesEnCadena(contratoRaizId);

                    // Verificar si ya se alcanzó el límite total de renovaciones permitidas para esta cadena
                    if (totalRenovacionesEnCadena >= maxRenovaciones)
                    {
                        string tipoEspacio = tipoBoveda?.ToLower() == "nichos" ? "nicho" : "bóveda";
                        TempData["Error"] = $"No se puede renovar este {tipoEspacio}. La cadena completa ya ha alcanzado el límite máximo de {maxRenovaciones} renovaciones.";
                        return RedirectToAction(nameof(Details), new { id = idContrato });
                    }

                    // En una renovación, la fecha de inicio debe ser justo después de la fecha fin del contrato anterior
                    DateTime nuevaFechaInicio = contrato.FechaFin.AddDays(1); // La fecha fin del contrato anterior será la inicial del nuevo

                    // Crear un nuevo modelo sin las referencias circulares
                    var contratoModelView = new CreateContratoModel
                    {
                        contrato = new ContratoModel
                        {
                            Id = contrato.Id,
                            BovedaId = contrato.BovedaId,
                            FechaInicio = nuevaFechaInicio, // Usar la nueva fecha de inicio
                            FechaFin = nuevaFechaInicio.AddYears(contrato.NumeroDeMeses), // Calcular nueva fecha fin
                            NumeroDeMeses = contrato.NumeroDeMeses,
                            MontoTotal = contrato.MontoTotal,
                            Observaciones = $"Renovación del contrato {contrato.NumeroSecuencial} de fecha {contrato.FechaInicio:dd/MM/yyyy} al {contrato.FechaFin:dd/MM/yyyy}",
                            Estado = contrato.Estado,
                            NumeroSecuencial = _contratoService.getNumeroContrato(contrato.BovedaId, isRenovacion: true),
                            EsRenovacion = true, // Marcar como renovación
                            ContratoOrigenId = contrato.Id // Establecer referencia al contrato original
                        },
                        difunto = contrato.Difunto != null ? new DifuntoModel
                        {
                            Id = contrato.Difunto.Id,
                            Nombres = contrato.Difunto.Nombres,
                            Apellidos = contrato.Difunto.Apellidos,
                            NumeroIdentificacion = contrato.Difunto.NumeroIdentificacion,
                            FechaFallecimiento = contrato.Difunto.FechaFallecimiento,
                            DescuentoId = contrato.Difunto.DescuentoId
                        } : null,
                        responsables = contrato.Responsables?.Select(r => new ResponsableModel
                        {
                            Id = r.Id,
                            Nombres = r.Nombres,
                            Apellidos = r.Apellidos,
                            TipoIdentificacion = r.TipoIdentificacion,
                            NumeroIdentificacion = r.NumeroIdentificacion,
                            Telefono = r.Telefono,
                            Email = r.Email,
                            Direccion = r.Direccion,
                            FechaInicio = r.FechaInicio,
                            FechaFin = r.FechaFin
                        }).ToList() ?? new List<ResponsableModel>(),
                        pago = new PagoModel()
                    };

                    // Añadir información sobre renovaciones a ViewBag
                    ViewBag.VecesRenovado = vecesRenovado + 1;
                    ViewBag.MaxRenovaciones = maxRenovaciones;

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
            }            // Validar si se puede renovar según la configuración del cementerio
            if (viewModel.contrato.EsRenovacion && viewModel.contrato.ContratoOrigenId.HasValue)
            {
                var cementerio = _context.Cementerio.FirstOrDefault();
                if (cementerio == null)
                {
                    return Json(new { success = false, errors = new List<string> { "No se encontró información del cementerio para verificar renovaciones." } });
                }

                // Obtener el contrato padre inmediato
                var contratoPadre = _context.Contrato
                    .Include(c => c.Boveda)
                        .ThenInclude(b => b.Piso)
                            .ThenInclude(p => p.Bloque)
                    .FirstOrDefault(c => c.Id == viewModel.contrato.ContratoOrigenId);

                if (contratoPadre == null)
                {
                    return Json(new { success = false, errors = new List<string> { "No se pudo encontrar el contrato padre." } });
                }

                // Encontrar el contrato raíz (primer contrato en la cadena)
                int contratoRaizId = contratoPadre.Id;
                var contratoActual = contratoPadre;

                // Seguir la cadena hacia arriba hasta encontrar el contrato raíz
                while (contratoActual.EsRenovacion && contratoActual.ContratoOrigenId.HasValue)
                {
                    var contratoAnterior = _context.Contrato
                        .FirstOrDefault(c => c.Id == contratoActual.ContratoOrigenId);

                    if (contratoAnterior == null) break;

                    contratoRaizId = contratoAnterior.Id;
                    contratoActual = contratoAnterior;
                }

                // El contrato raíz es el contrato original de toda la cadena
                var contratoOriginal = _context.Contrato
                    .Include(c => c.Boveda)
                        .ThenInclude(b => b.Piso)
                            .ThenInclude(p => p.Bloque)
                    .FirstOrDefault(c => c.Id == contratoRaizId);

                if (contratoOriginal == null)
                {
                    return Json(new { success = false, errors = new List<string> { "No se pudo encontrar el contrato original de la cadena." } });
                }

                // Obtener el tipo de bóveda (nichos o bovedas)
                string? tipoBoveda = contratoOriginal.Boveda?.Piso?.Bloque?.Tipo;

                // Contar cuántas veces se ha renovado en toda la cadena
                int renovacionesTotales = ContarRenovacionesEnCadena(contratoRaizId);

                // Determinar máximo de renovaciones según el tipo
                int maxRenovaciones = 0; // Por defecto 0 si no se puede determinar el tipo
                if (tipoBoveda?.ToLower() == "nichos")
                {
                    maxRenovaciones = cementerio.VecesRenovacionNicho;
                }
                else if (tipoBoveda?.ToLower() == "bovedas")
                {
                    maxRenovaciones = cementerio.VecesRenovacionBovedas;
                }

                // Verificar si se alcanzó el límite de renovaciones total en la cadena
                if (renovacionesTotales >= maxRenovaciones)
                {
                    string mensaje = tipoBoveda?.ToLower() == "nichos" ?
                        $"No se puede renovar este nicho. La cadena ha alcanzado el límite máximo de {maxRenovaciones} renovaciones." :
                        $"No se puede renovar esta bóveda. La cadena ha alcanzado el límite máximo de {maxRenovaciones} renovaciones.";

                    return Json(new { success = false, errors = new List<string> { mensaje } });
                }

                // Encontrar el último contrato en la cadena de renovaciones
                var ultimoContrato = EncontrarUltimoContratoEnCadena(contratoRaizId);

                // Verificar si este contrato es el último de la cadena
                if (ultimoContrato != null && ultimoContrato.Id != contratoPadre.Id)
                {
                    return Json(new
                    {
                        success = false,
                        errors = new List<string> {
                            $"Solo se puede renovar el contrato más reciente en la cadena de renovaciones. " +
                            $"Debe renovar el contrato {ultimoContrato.NumeroSecuencial} en su lugar."
                        }
                    });
                }

                // Verificar si el contrato padre ya tiene hijos (no puede tener más de 1 renovación directa)
                bool padreYaTieneHijos = _context.Contrato
                    .Any(c => c.ContratoOrigenId == contratoPadre.Id && c.Id != viewModel.contrato.Id);

                if (padreYaTieneHijos)
                {
                    return Json(new
                    {
                        success = false,
                        errors = new List<string> {
                        "Este contrato ya ha sido renovado anteriormente. No se puede renovar más de una vez el mismo contrato."
                    }
                    });
                }
            }

            var strategy = _context.Database.CreateExecutionStrategy();
            return strategy.Execute(() =>
            {
                using (var transaction = _context.Database.BeginTransaction())
                {
                    try
                    {
                        var user = _userManager.GetUserAsync(User).Result;
                        var userId = user?.Id;
                        var now = DateTime.Now;

                        // Convertir las personas a responsables antes de asociarlas al contrato
                        // Primero verifica si las personas ya existen
                        var responsables = new List<Responsable>();
                        foreach (var persona in viewModel.responsables)
                        {
                            // Verifica si ya existe un responsable para esta persona
                            var responsableExistente = _context.Responsable
                                .FirstOrDefault(r => r.NumeroIdentificacion == persona.NumeroIdentificacion);

                            if (responsableExistente != null)
                            {
                                // Si existe, actualiza sus datos si es necesario
                                responsableExistente.FechaInicio = now;
                                responsableExistente.FechaFin = viewModel.contrato.FechaFin ?? DateTime.Now.AddYears(5);
                                responsables.Add(responsableExistente);
                            }
                            else
                            {
                                // Si no existe, crea uno nuevo
                                var responsable = _mapper.Map<Responsable>(persona);
                                responsable.Id = 0;
                                responsable.FechaInicio = now;
                                responsable.FechaFin = viewModel.contrato.FechaFin ?? DateTime.Now.AddYears(5);
                                responsable.FechaCreacion = now;
                                responsable.UsuarioCreadorId = userId;
                                _context.Responsable.Add(responsable);
                                responsables.Add(responsable);
                            }
                        }

                        // Crear el contrato
                        var contrato = new Contrato
                        {
                            NumeroSecuencial = viewModel.contrato.NumeroSecuencial,
                            BovedaId = viewModel.contrato.BovedaId,
                            FechaInicio = viewModel.contrato.FechaInicio,
                            FechaFin = viewModel.contrato.FechaFin ?? DateTime.Now.AddYears(5),
                            NumeroDeMeses = viewModel.contrato.NumeroDeMeses,
                            MontoTotal = viewModel.contrato.MontoTotal,
                            Observaciones = viewModel.contrato.Observaciones ?? "",
                            FechaCreacion = now,
                            UsuarioCreadorId = userId,
                            UsuarioActualizadorId = userId,
                            Responsables = responsables,
                            FechaActualizacion = now,
                            Estado = true,
                            EsRenovacion = viewModel.contrato.EsRenovacion, // Incluir información sobre si es renovación
                            ContratoOrigenId = viewModel.contrato.ContratoOrigenId // Establecer referencia al contrato original
                        };

                        // Crear el difunto
                        var difunto = new Difunto
                        {
                            NumeroIdentificacion = viewModel.difunto.NumeroIdentificacion,
                            Nombres = viewModel.difunto.Nombres,
                            Apellidos = viewModel.difunto.Apellidos,
                            FechaFallecimiento = viewModel.difunto.FechaFallecimiento,
                            UsuarioCreadorId = userId,
                            FechaCreacion = now,
                            DescuentoId = viewModel.difunto.DescuentoId

                        };
                        contrato.Difunto = difunto;


                        _context.Contrato.Add(contrato);
                        _context.SaveChanges();

                        // Crear las cuotas después de que el contrato tenga ID
                        contrato.Cuotas = _mapper.Map<List<Cuota>>(viewModel.contrato.Cuotas);
                        foreach (var cuota in contrato.Cuotas)
                        {
                            cuota.ContratoId = contrato.Id;
                            _context.Cuota.Add(cuota);
                        }

                        // Crear el pago
                        var pago = _mapper.Map<Pago>(viewModel.pago);
                        pago.PersonaPagoId = viewModel.responsables.First().Id;
                        pago.FechaPago = now;
                        pago.Cuotas = contrato.Cuotas.Where(c => c.Pagada).ToList();
                        _context.Pago.Add(pago);

                        _context.SaveChanges();
                        transaction.Commit();

                        // Limpiar la sesión después de guardar exitosamente
                        HttpContext.Session.Remove("NuevoContrato");

                        return Json(new { success = true, contratoId = contrato.Id });
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        _logger.LogError(ex, "Error al guardar el contrato");

                        var errorMessage = ex.InnerException?.Message ?? ex.Message;
                        if (errorMessage.Contains("See the inner exception for details"))
                        {
                            errorMessage = ex.InnerException?.InnerException?.Message ?? errorMessage;
                        }

                        return Json(new
                        {
                            success = false,
                            errors = new List<string> {
                                "Error al guardar el contrato: " + errorMessage
                            }
                        });
                    }
                }
            });
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
            if (cementerio == null)
            {
                TempData["Error"] = "No se encontró información del cementerio para generar el contrato.";
                return RedirectToAction(nameof(Index));
            }
            var documento = new ContratoPDF(model, cementerio);
            var pdfBytes = documento.GeneratePdf();

            return File(pdfBytes, "application/pdf", "ContratoArrendamiento.pdf");
        }

        [HttpGet]
        public IActionResult Print(int id)
        {
            try
            {
                var cementerio = _context.Cementerio.FirstOrDefault();
                if (cementerio == null)
                {
                    TempData["Error"] = "No se encontró información del cementerio para generar el contrato.";
                    return RedirectToAction(nameof(Index));
                }

                // Cargar el contrato y todas sus relaciones necesarias
                var contrato = _context.Contrato
                    .Include(c => c.Boveda)
                        .ThenInclude(b => b.Piso)
                            .ThenInclude(p => p.Bloque)
                    .Include(c => c.Boveda)
                        .ThenInclude(b => b.Propietario)
                    .Include(c => c.Difunto)
                    .Include(c => c.Responsables)
                    .Include(c => c.Cuotas)
                        .ThenInclude(cu => cu.Pagos)
                    .Include(c => c.ContratoOrigen)
                    .FirstOrDefault(c => c.Id == id);

                if (contrato == null)
                {
                    TempData["Error"] = "No se encontró el contrato para generar el PDF.";
                    return RedirectToAction(nameof(Index));
                }

                var contratoModel = _mapper.Map<ContratoModel>(contrato);

                // Mapear las fechas de pago a las cuotas y asociar el PagoId si está pagada
                foreach (var cuota in contratoModel.Cuotas)
                {
                    var cuotaEntity = contrato.Cuotas.FirstOrDefault(c => c.Id == cuota.Id);
                    if (cuotaEntity?.Pagos != null && cuotaEntity.Pagos.Any())
                    {
                        cuota.FechaPago = cuotaEntity.Pagos.First().FechaPago;
                        // Asociar el PagoId para la vista
                        cuota.PagoId = cuotaEntity.Pagos.First().Id;
                    }
                }

                // Asegurar que la bóveda y el propietario estén correctamente mapeados
                if (contrato.Boveda != null)
                {
                    contratoModel.Boveda = _mapper.Map<BovedaModel>(contrato.Boveda);
                }

                // Si es una renovación, cargar los datos del contrato original
                if (contrato.EsRenovacion && contrato.ContratoOrigenId.HasValue && contrato.ContratoOrigen != null)
                {
                    contratoModel.ContratoOrigen = _mapper.Map<ContratoModel>(contrato.ContratoOrigen);
                }

                // Crear el modelo para el PDF
                var modelo = new CreateContratoModel
                {
                    contrato = contratoModel,
                    difunto = contratoModel.Difunto ?? new DifuntoModel(),
                    responsables = contratoModel.Responsables ?? new List<ResponsableModel>(),
                    pago = new PagoModel() // Si necesitas pagos, puedes mapearlos aquí
                };

                var documento = new ContratoPDF(modelo, cementerio);
                var pdfBytes = documento.GeneratePdf();

                var fileName = $"CONTRATO_{contratoModel.NumeroSecuencial ?? "Arrendamiento"}.pdf";
                ViewBag.NombreArchivo = fileName;
                Response.Headers["Content-Disposition"] = $"inline; filename={fileName}";
                return new FileContentResult(pdfBytes, "application/pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar PDF del contrato {ContratoId}", id);
                TempData["Error"] = $"Error al generar el PDF: {ex.Message}";
                return RedirectToAction(nameof(Details), new { id });
            }
        }

        [HttpGet]
        public object TestPDF()
        {
            try
            {
                // Crear un PDF simple de prueba
                var document = Document.Create(container =>
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(2, Unit.Centimetre);
                        page.DefaultTextStyle(x => x.FontSize(12));

                        page.Header().Text("TEST PDF").Bold().FontSize(20);
                        page.Content().Column(column =>
                        {
                            column.Item().Text($"Generado el: {DateTime.Now:dd/MM/yyyy HH:mm:ss}");
                            column.Item().PaddingTop(20).Text("Este es un PDF de prueba para verificar que QuestPDF funciona correctamente en el entorno Docker.");
                            column.Item().PaddingTop(10).Text("Si puedes ver este PDF, significa que QuestPDF está funcionando correctamente.");
                        });
                        page.Footer().Row(row =>
                        {
                            row.RelativeItem().Text("Página");
                            row.RelativeItem().AlignRight().Text("1");
                        });
                    });
                });

                var pdfBytes = document.GeneratePdf();
                return File(pdfBytes, "application/pdf", "test.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar PDF de prueba");
                return Content($"Error al generar PDF: {ex.Message}", "text/plain");
            }
        }

        [HttpGet]
        public IActionResult VerContratoPDF()
        {
            try
            {
                var cementerio = _context.Cementerio.FirstOrDefault();
                if (cementerio == null)
                {
                    TempData["Error"] = "No se encontró información del cementerio para generar el contrato.";
                    return RedirectToAction(nameof(Index));
                }

                var modelo = GetContratoFromSession(); // o pásalo por parámetro
                if (modelo?.contrato == null || modelo.contrato.BovedaId <= 0)
                {
                    TempData["Error"] = "No hay información de contrato para visualizar.";
                    return RedirectToAction(nameof(Index));
                }

                var boveda = _context.Boveda.Include(b => b.Piso).ThenInclude(p => p.Bloque)
                    .FirstOrDefault(b => b.Id == modelo.contrato.BovedaId);
                if (boveda != null)
                {
                    modelo.contrato.Boveda = _mapper.Map<BovedaModel>(boveda);
                }
                var documento = new ContratoPDF(modelo, cementerio);
                var pdfBytes = documento.GeneratePdf();

                var fileName = $"CONTRATO_{modelo.contrato.NumeroSecuencial ?? "Arrendamiento"}.pdf";
                ViewBag.NombreArchivo = fileName;
                Response.Headers["Content-Disposition"] = $"inline; filename={fileName}";
                return new FileContentResult(pdfBytes, "application/pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al generar PDF de vista previa del contrato");
                TempData["Error"] = $"Error al generar el PDF: {ex.Message}";
                return RedirectToAction(nameof(Index));
            }
        }
        // CREAR DIFUNTO
        [HttpGet]
        public IActionResult CreateDifunto()
        {
            var contrato = GetContratoFromSession();
            var difunto = contrato.difunto ?? new DifuntoModel();
            difunto.FechaNacimiento = DateTime.Now.AddYears(-30); // Establecer fecha de nacimiento por defecto
            difunto.FechaFallecimiento = DateTime.Now; // Establecer fecha de fallecimiento por defecto
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
                contrato.difunto = difunto;
                contrato.contrato.DifuntoId = difunto.Id;

                // Si el difunto tiene descuento, aplicar a las cuotas
                if (difunto.DescuentoId != 0)
                {
                    var descuentoObj = _context.Descuento.FirstOrDefault(d => d.Id == difunto.DescuentoId);
                    if (descuentoObj != null)
                    {
                        decimal porcentaje = descuentoObj.Porcentaje;
                        foreach (var cuota in contrato.contrato.Cuotas)
                        {
                            cuota.Monto = Math.Round(cuota.Monto * (1 - (porcentaje / 100m)), 2);
                        }
                        // NO actualizar contrato.contrato.MontoTotal aquí
                    }
                }
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
        public IActionResult CreateResponsables([FromBody] List<ResponsableModel> responsables)
        {
            if (ModelState.IsValid)
            {
                try
                {
                    var contrato = GetContratoFromSession();
                    contrato.responsables = responsables;
                    SaveContratoToSession(contrato);
                    return Json(new { success = true });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al guardar los responsables");
                    return Json(new { success = false, errors = new List<string> { ex.Message } });
                }
            }

            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return Json(new { success = false, errors });
        }
        [HttpPost]
        public IActionResult AddResponsable(ResponsableModel responsable)
        {
            _logger.LogInformation("Datos recibidos: {@Responsable}", responsable);

            if (responsable == null || responsable.Id <= 0)
            {
                return Json(new { success = false, message = "Datos del responsable inválidos" });
            }

            var persona = _context.Persona.AsNoTracking()
                .FirstOrDefault(p => p.Id == responsable.Id);

            if (persona == null)
            {
                _logger.LogWarning("Persona no encontrada con ID: {Id}", responsable.Id);
                return Json(new { success = false, message = "Persona no encontrada" });
            }

            // Verificar si ya existe en la lista de responsables
            var contrato = GetContratoFromSession();
            if (contrato.responsables.Any(r => r.Id == responsable.Id))
            {
                return Json(new { success = false, message = "Esta persona ya está en la lista de responsables" });
            }

            // Crear el modelo de responsable con los datos de la persona
            var responsableModel = new ResponsableModel
            {
                Id = persona.Id,
                Nombres = persona.Nombres,
                Apellidos = persona.Apellidos,
                TipoIdentificacion = persona.TipoIdentificacion,
                NumeroIdentificacion = persona.NumeroIdentificacion,
                Telefono = persona.Telefono,
                Email = persona.Email,
                Direccion = persona.Direccion,
                FechaInicio = DateTime.Now,
                FechaFin = null
            };

            contrato.responsables.Add(responsableModel);
            SaveContratoToSession(contrato);

            return Json(new { success = true, contrato.responsables });
        }
        [HttpPost]
        public IActionResult RemoveResponsable(int id)
        {
            try
            {
                if (id <= 0)
                {
                    _logger.LogWarning("ID de responsable inválido");
                    return Json(new { success = false, message = "ID de responsable inválido." });
                }

                _logger.LogInformation($"Intentando remover responsable con ID: {id}");

                var contrato = GetContratoFromSession();
                if (contrato?.responsables == null)
                {
                    _logger.LogWarning("No se encontró el contrato en la sesión");
                    return Json(new { success = false, message = "No se encontró el contrato en la sesión." });
                }

                _logger.LogInformation($"Responsables en sesión: {contrato.responsables.Count}");

                var responsableToRemove = contrato.responsables.FirstOrDefault(r => r.Id == id);
                if (responsableToRemove != null)
                {
                    contrato.responsables.Remove(responsableToRemove);
                    SaveContratoToSession(contrato);
                    _logger.LogInformation($"Responsable {id} removido exitosamente");
                    return Json(new { success = true, message = "Responsable removido exitosamente" });
                }

                _logger.LogWarning($"No se encontró el responsable con ID: {id}");
                return Json(new { success = false, message = "Responsable no encontrado." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al remover el responsable");
                return Json(new { success = false, message = ex.Message });
            }
        }
        // CREAR PAGO
        [HttpGet]
        public IActionResult CreatePago()
        {
            ViewData["TiposPago"] = new SelectList(new List<string> { "Efectivo", "Transferencia", "Banco" });
            var contrato = GetContratoFromSession();
            // Mostrar siempre todas las cuotas, no solo las no pagadas
            contrato.pago.Cuotas = contrato.contrato.Cuotas;
            contrato.pago.FechaPago = DateTime.Now;

            decimal descuento = 0;
            if (contrato.difunto != null && contrato.difunto.DescuentoId != 0)
            {
                var descuentoObj = _context.Descuento.FirstOrDefault(d => d.Id == contrato.difunto.DescuentoId);
                if (descuentoObj != null)
                {
                    descuento = descuentoObj.Porcentaje;
                }
            }
            ViewBag.DescuentoPorcentaje = descuento;
            ViewBag.MontoOriginal = contrato.contrato.MontoTotal;

            decimal montoSinDescuento = contrato.contrato.MontoTotal;
            decimal montoDescuento = montoSinDescuento * (descuento / 100m);
            contrato.pago.Monto = montoSinDescuento - montoDescuento;

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

                // Permitir monto 0 si hay descuento del 100%
                if (pago.Monto < 0)
                {
                    return Json(new { success = false, errors = new List<string> { "El monto no puede ser negativo." } });
                }

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
            decimal tarifa = 0;
            var cementerio = _context.Cementerio.FirstOrDefault();
            if (contrato_model.contrato.BovedaId > 0)
            {
                var boveda = _context.Boveda
                    .Include(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
                    .FirstOrDefault(b => b.Id == contrato_model.contrato.BovedaId);
                if (boveda?.Piso?.Bloque != null)
                {
                    var tipo = boveda.Piso.Bloque.Tipo?.ToLower();
                    if (tipo == "nichos")
                    {
                        tarifa = cementerio?.tarifa_arriendo_nicho ?? 0;
                    }
                    else
                    {
                        tarifa = cementerio?.tarifa_arriendo ?? 0;
                    }
                }
            }
            else
            {
                tarifa = cementerio?.tarifa_arriendo ?? 0;
            }
            contrato_model.contrato.NumeroDeMeses = 5;
            contrato_model.contrato.FechaInicio = DateTime.Now;
            contrato_model.contrato.FechaFin = contrato_model.contrato.FechaInicio.AddYears(contrato_model.contrato.NumeroDeMeses);
            contrato_model.contrato.Difunto = new DifuntoModel();
            contrato_model.contrato.MontoTotal = tarifa;

            // Asegurarse de que la propiedad EsRenovacion se mantenga
            // Esto es especialmente importante si estamos renovando un contrato existente

            // Si tenemos información de renovación en la sesión, mantenerla
            if (contrato_model.contrato.EsRenovacion && contrato_model.contrato.ContratoOrigenId.HasValue)
            {
                ViewBag.EsRenovacion = true;
                ViewBag.ContratoOrigenId = contrato_model.contrato.ContratoOrigenId;

                // Obtener información del contrato original para mostrarla
                var contratoOriginal = _context.Contrato
                    .FirstOrDefault(c => c.Id == contrato_model.contrato.ContratoOrigenId);

                if (contratoOriginal != null)
                {
                    ViewBag.ContratoOriginalNumero = contratoOriginal.NumeroSecuencial;
                }
            }

            ViewBag.BovedaId = new SelectList(_context.Boveda.Where(b => b.Estado), "Id", "Numero");
            return PartialView("_CreateContrato", contrato_model.contrato);
        }
        [HttpGet]
        public IActionResult RecargarContratoByTipo(int idBoveda)
        {
            // Lógica para obtener el modelo actualizado según el tipo
            var contratoSession = GetContratoFromSession();
            var contrato_model = contratoSession.contrato;

            // Verificar si es una renovación basándose en la EsRenovacion del modelo
            bool isRenovacion = contrato_model.EsRenovacion;

            // Información adicional a devolver en el Json
            var responseData = new Dictionary<string, object>();

            // Generar el número secuencial indicando si es renovación
            contrato_model.NumeroSecuencial = _contratoService.getNumeroContrato(idBoveda, isRenovacion);
            responseData["numeroSecuencial"] = contrato_model.NumeroSecuencial;

            // Obtener la tarifa según el tipo de bóveda
            var boveda = _context.Boveda
                .Include(b => b.Piso)
                .ThenInclude(p => p.Bloque)
                .FirstOrDefault(b => b.Id == idBoveda);

            if (boveda?.Piso?.Bloque != null)
            {
                var cementerio = _context.Cementerio.FirstOrDefault();
                decimal tarifa = 0;
                var tipo = boveda.Piso.Bloque.Tipo?.ToLower();

                if (tipo == "nichos")
                {
                    tarifa = cementerio?.tarifa_arriendo_nicho ?? 0;
                }
                else
                {
                    tarifa = cementerio?.tarifa_arriendo ?? 0;
                }

                contrato_model.MontoTotal = tarifa;
                responseData["montoTotal"] = Math.Round(tarifa, 2);
            }

            // Si es una renovación, incluir información sobre el contrato original
            if (isRenovacion && contrato_model.ContratoOrigenId.HasValue)
            {
                var contratoOriginal = _context.Contrato
                    .FirstOrDefault(c => c.Id == contrato_model.ContratoOrigenId);

                if (contratoOriginal != null)
                {
                    responseData["contratoOriginalNumero"] = contratoOriginal.NumeroSecuencial;
                    responseData["contratoOriginalId"] = contratoOriginal.Id;
                }
            }

            SaveContratoToSession(contratoSession);
            return Json(new { success = true, data = responseData });
        }

        [HttpPost]
        public IActionResult CreateContrato(ContratoModel contrato)
        {
            // Validar que se haya seleccionado una bóveda
            if (contrato.BovedaId == 0)
            {
                return Json(new { success = false, errors = new List<string> { "Debe seleccionar una bóveda." } });
            }

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
        public IActionResult BuscarBovedas(string filtro = "", string tipo = "", int pagina = 1)
        {


            var viewModel = new BovedaPaginadaViewModel
            {
                Bovedas = new List<BovedaModel>(),
                PaginaActual = pagina,
                TotalPaginas = 0,
                Filtro = filtro,
                Tipo = tipo
            };

            return PartialView("_SelectBoveda", viewModel);
        }
        public IActionResult BuscarBovedasJson(string filtro = "", string tipo = "", int pagina = 1)
        {
            try
            {
                int pageSize = 10;
                var hoy = DateTime.Today;
                var query = _context.Boveda
                    .Include(b => b.Piso)
                        .ThenInclude(p => p.Bloque)
                    .Include(b => b.Propietario)
                    .Include(b => b.Contratos)
                        .ThenInclude(c => c.Difunto)
                    .Where(b => b.Estado)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(filtro))
                {
                    query = query.Where(b => (b.NumeroSecuencial != null && b.NumeroSecuencial.Contains(filtro))
                        || b.Numero.ToString().Contains(filtro));
                }

                if (!string.IsNullOrEmpty(tipo))
                {
                    query = query.Where(b => b.Piso != null && b.Piso.Bloque != null && b.Piso.Bloque.Tipo == tipo);
                }

                // FILTRO AVANZADO DE DISPONIBILIDAD
                query = query.Where(b =>
                    // 1. No tiene contrato vigente (ningún contrato activo)
                    !b.Contratos.Any(c => c.Estado == true && (c.FechaFin == null || c.FechaFin >= hoy))
                    && (
                        // 2. Si tiene propietario y NO tiene contrato vigente, mostrar
                        (b.Propietario != null && !b.Contratos.Any(c => c.Estado == true && (c.FechaFin == null || c.FechaFin >= hoy)))
                        // 3. Si no tiene propietario y no tiene contrato vigente, mostrar
                        || (b.Propietario == null)
                    )
                // 4. Si tiene propietario y contrato vigente con difunto, NO mostrar (ya lo cubre el primer filtro)
                );

                // Adicional: Si tiene propietario y algún contrato vigente con difunto, NO mostrar
                query = query.Where(b =>
                    !b.Contratos.Any(c => c.Estado == true && (c.FechaFin == null || c.FechaFin >= hoy) && c.Difunto != null)
                );

                int total = query.Count();

                var bovedas = query
                    .OrderByDescending(b => b.NumeroSecuencial != null)
                    .ThenBy(b => b.NumeroSecuencial)
                    .Skip((pagina - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                var listaBovedas = _mapper.Map<List<BovedaModel>>(bovedas);

                var resultado = new
                {
                    bovedas = listaBovedas.Select(b => new
                    {
                        id = b.Id,
                        numeroSecuencial = b.NumeroSecuencial,
                        numero = b.Numero,
                        tipo = b.Piso?.Bloque?.Tipo ?? "No especificado",
                        estado = b.Estado ? "Activa" : "Inactiva",
                        propietario = b.Propietario != null ? ($"{b.Propietario.Nombres} {b.Propietario.Apellidos}") : "Sin propietario"
                    }),
                    paginaActual = pagina,
                    totalPaginas = (int)Math.Ceiling(total / (double)pageSize),
                    filtro = filtro
                };

                return Json(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al buscar bóvedas");
                return StatusCode(500, new { error = "Error al buscar bóvedas" });
            }
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
                    Responsable nuevoResponsable;
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

                        nuevoResponsable = _mapper.Map<Responsable>(responsable);
                        _context.Responsable.Add(nuevoResponsable);
                        await _context.SaveChangesAsync();
                    }
                    else
                    {
                        // Crear directamente un Responsable (hereda de Persona)
                        nuevoResponsable = new gad_checa_gestion_cementerio.Data.Responsable
                        {
                            Nombres = responsable.Nombres,
                            Apellidos = responsable.Apellidos,
                            TipoIdentificacion = responsable.TipoIdentificacion,
                            NumeroIdentificacion = responsable.NumeroIdentificacion,
                            Telefono = responsable.Telefono,
                            Email = responsable.Email,
                            Direccion = responsable.Direccion,
                            Estado = true,
                            FechaCreacion = DateTime.Now,
                            UsuarioCreadorId = identityUser1.Id,
                            UsuarioCreador = identityUser1,
                            FechaInicio = DateTime.Now,
                            FechaFin = responsable.FechaFin
                        };
                        _context.Responsable.Add(nuevoResponsable);
                        await _context.SaveChangesAsync();
                    }

                    // Agregar a la sesión del contrato si no está ya
                    var contrato = GetContratoFromSession();
                    if (!contrato.responsables.Any(r => r.NumeroIdentificacion == nuevoResponsable.NumeroIdentificacion))
                    {
                        contrato.responsables.Add(new ResponsableModel
                        {
                            Id = nuevoResponsable.Id,
                            Nombres = nuevoResponsable.Nombres,
                            Apellidos = nuevoResponsable.Apellidos,
                            TipoIdentificacion = nuevoResponsable.TipoIdentificacion,
                            NumeroIdentificacion = nuevoResponsable.NumeroIdentificacion,
                            Telefono = nuevoResponsable.Telefono,
                            Email = nuevoResponsable.Email,
                            Direccion = nuevoResponsable.Direccion,
                            FechaInicio = nuevoResponsable.FechaInicio,
                            FechaFin = nuevoResponsable.FechaFin
                        });
                        SaveContratoToSession(contrato);
                    }

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

        // Método para contar recursivamente todas las renovaciones en la cadena
        private int ContarRenovacionesEnCadena(int contratoId)
        {
            // Obtener todos los hijos directos
            var hijos = _context.Contrato
                .Where(c => c.ContratoOrigenId == contratoId && c.EsRenovacion)
                .ToList();

            if (hijos.Count == 0)
                return 0;

            int total = hijos.Count;

            // Contar recursivamente los hijos de cada hijo
            foreach (var hijo in hijos)
            {
                total += ContarRenovacionesEnCadena(hijo.Id);
            }

            return total;
        }

        // Método para encontrar el último contrato en una cadena de renovaciones
        private Contrato? EncontrarUltimoContratoEnCadena(int contratoRaizId)
        {
            // Obtener todos los contratos relacionados con este contrato raíz
            var contratosRelacionados = _context.Contrato
                .Include(c => c.Boveda)
                .Where(c => c.Id == contratoRaizId ||
                            c.ContratoOrigenId == contratoRaizId ||
                            _context.Contrato.Any(pc => pc.Id == c.ContratoOrigenId &&
                                                       (pc.Id == contratoRaizId || pc.ContratoOrigenId == contratoRaizId)))
                .ToList();

            // Construir un diccionario de padres a hijos
            var hijosPorPadre = new Dictionary<int, List<Contrato>>();

            foreach (var c in contratosRelacionados)
            {
                if (c.ContratoOrigenId.HasValue)
                {
                    if (!hijosPorPadre.ContainsKey(c.ContratoOrigenId.Value))
                    {
                        hijosPorPadre[c.ContratoOrigenId.Value] = new List<Contrato>();
                    }

                    hijosPorPadre[c.ContratoOrigenId.Value].Add(c);
                }
            }

            // Empezamos con el contrato raíz
            var contratoActual = contratosRelacionados.FirstOrDefault(c => c.Id == contratoRaizId);

            if (contratoActual == null)
                return null;

            // Mientras el contrato actual tenga hijos, avanzamos al hijo
            while (hijosPorPadre.ContainsKey(contratoActual.Id) && hijosPorPadre[contratoActual.Id].Any())
            {
                contratoActual = hijosPorPadre[contratoActual.Id].OrderByDescending(c => c.FechaCreacion).First();
            }

            return contratoActual;
        }

        [HttpGet]
        public IActionResult PrintRecibo(int id)
        {
            var contrato = _context.Contrato.FirstOrDefault(c => c.Id == id);
            if (contrato == null)
            {
                TempData["Error"] = "No se encontró el contrato para imprimir el recibo.";
                return RedirectToAction(nameof(Index));
            }

            if (string.IsNullOrEmpty(contrato.PathDocumentoFirmado))
            {
                TempData["Error"] = "Aún no se ha subido el comprobante de recibido (documento firmado) para este contrato.";
                return RedirectToAction(nameof(Details), new { id });
            }

            // El path guardado es relativo a wwwroot, por ejemplo: /documentos/archivo.pdf
            var rutaRelativa = contrato.PathDocumentoFirmado.TrimStart('/');
            var rutaCompleta = Path.Combine(_env.WebRootPath, rutaRelativa.Replace('/', Path.DirectorySeparatorChar));

            if (!System.IO.File.Exists(rutaCompleta))
            {
                TempData["Error"] = "El archivo del comprobante firmado no se encuentra en el servidor. Por favor, vuelva a subirlo.";
                return RedirectToAction(nameof(Details), new { id });
            }

            var fileName = Path.GetFileName(rutaCompleta);
            Response.Headers["Content-Disposition"] = $"inline; filename={fileName}";
            return PhysicalFile(rutaCompleta, "application/pdf");
        }

        [HttpGet]
        public IActionResult GetResponsables()
        {
            var contrato = GetContratoFromSession();
            var responsables = contrato?.responsables ?? new List<ResponsableModel>();

            return Json(new
            {
                success = true,
                responsables = responsables.Select(r => new
                {
                    id = r.Id,
                    nombres = r.Nombres,
                    apellidos = r.Apellidos,
                    tipoIdentificacion = r.TipoIdentificacion,
                    numeroIdentificacion = r.NumeroIdentificacion,
                    telefono = r.Telefono,
                    email = r.Email,
                    direccion = r.Direccion,
                    fechaInicio = r.FechaInicio.ToString("yyyy-MM-dd"),
                    fechaFin = r.FechaFin?.ToString("yyyy-MM-dd")
                })
            });
        }
    }
}
