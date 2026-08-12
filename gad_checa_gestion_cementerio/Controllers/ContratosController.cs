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
using System.Globalization;
using System.Text;
namespace gad_checa_gestion_cementerio.Controllers
{
    public class ContratosController : BaseController
    {
        private readonly ContratoService _contratoService;
        private const int DuracionContratoAniosPorDefecto = 5;

        private static void NormalizarDuracionContrato(ContratoModel contrato)
        {
            contrato.NumeroDeMeses = DuracionContratoAniosPorDefecto;
            contrato.FechaFin = contrato.FechaInicio.AddYears(DuracionContratoAniosPorDefecto);
        }
        private readonly IWebHostEnvironment _env;
        public ContratosController(ApplicationDbContext context, IMapper mapper, UserManager<ApplicationUser> userManager, ILogger<ContratosController> logger, ContratoService contratoService, IWebHostEnvironment env) : base(context, userManager, mapper, logger)
        {
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
        public async Task<IActionResult> Index(string filtro = "", string estado = "", int pagina = 1)
        {
            int pageSize = 10;
            var contratosQuery = _context.Contrato
            .Include(c => c.Difunto)
            .Include(c => c.Cuotas)
            .Include(c => c.Boveda)
                .ThenInclude(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
            .Include(c => c.ContratoRelacionado)
                .ThenInclude(cr => cr.Difunto)
            .AsQueryable();

            // Filtro por texto - Búsqueda inteligente
            if (!string.IsNullOrWhiteSpace(filtro))
            {
                filtro = filtro.Trim();

                // Dividir el filtro en palabras para búsqueda flexible
                var palabras = filtro.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);

                foreach (var palabra in palabras)
                {
                    var palabraLocal = palabra; // Variable local para closure
                    contratosQuery = contratosQuery.Where(c =>
                        c.NumeroSecuencial.Contains(palabraLocal) ||
                        (c.Difunto != null && (
                            c.Difunto.Nombres.Contains(palabraLocal) ||
                            c.Difunto.Apellidos.Contains(palabraLocal) ||
                            (c.Difunto.Nombres + " " + c.Difunto.Apellidos).Contains(palabraLocal) ||
                            (c.Difunto.NumeroIdentificacion != null && c.Difunto.NumeroIdentificacion.Contains(palabraLocal)))) ||
                        (c.Boveda != null && (
                            c.Boveda.Numero.ToString().Contains(palabraLocal) ||
                            (c.Boveda.NumeroSecuencial != null && c.Boveda.NumeroSecuencial.Contains(palabraLocal)))) ||
                        c.Responsables.Any(r =>
                            r.Nombres.Contains(palabraLocal) ||
                            r.Apellidos.Contains(palabraLocal) ||
                            (r.Nombres + " " + r.Apellidos).Contains(palabraLocal) ||
                            (r.NumeroIdentificacion != null && r.NumeroIdentificacion.Contains(palabraLocal))));
                }
            }

            // Filtro por estado
            var hoy = DateTime.Today;
            if (!string.IsNullOrWhiteSpace(estado))
            {
                estado = estado.Trim();
                switch (estado.ToLower())
                {
                    case "activos":
                        contratosQuery = contratosQuery.Where(c => c.Estado == true && c.FechaFin >= hoy);
                        break;
                    case "porvencer":
                        var fecha30Dias = hoy.AddDays(30);
                        contratosQuery = contratosQuery.Where(c => c.Estado == true && c.FechaFin >= hoy && c.FechaFin <= fecha30Dias);
                        break;
                    case "vencidos":
                        contratosQuery = contratosQuery.Where(c => c.Estado == true && c.FechaFin < hoy);
                        break;
                    case "inactivos":
                        contratosQuery = contratosQuery.Where(c => c.Estado == false);
                        break;
                }
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
            ViewBag.Estado = estado;

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
                .Include(c => c.ContratoRelacionado) // Incluir el contrato relacionado si existe
                    .ThenInclude(cr => cr.Difunto) // Incluir el difunto del contrato relacionado
                .Include(c => c.ContratoRelacionado) // Incluir el contrato relacionado con su bóveda
                    .ThenInclude(cr => cr.Boveda) // Incluir la bóveda del contrato relacionado
                        .ThenInclude(b => b.Piso) // Incluir el piso de la bóveda relacionada
                            .ThenInclude(p => p.Bloque) // Incluir el bloque del piso de la bóveda relacionada
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
            }

            // Si tiene un contrato relacionado, cargar sus datos
            if (contrato.ContratoRelacionadoId.HasValue && contrato.ContratoRelacionado != null)
            {
                contratoModel.ContratoRelacionado = _mapper.Map<ContratoModel>(contrato.ContratoRelacionado);
            }

            // Buscar contratos que son renovaciones de este (contratos hijos)
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
            string? tipoBoveda = contrato.Boveda?.Piso?.Bloque?.Tipo;
            string? description = contrato.Boveda?.Piso?.Bloque?.Descripcion.ToUpperInvariant();
            if (EsNicho(tipoBoveda))
            {
                maxRenovaciones = cementerio?.VecesRenovacionNicho ?? 0;
            }
            else if (description?.Contains("Tumulos") == true)
            {
                // Si tienes lógica especial para TÚMULOS, agrégala aquí
                maxRenovaciones = 0; // O el valor correspondiente
            }
            else // BÓVEDAS u otros
            {
                maxRenovaciones = cementerio?.VecesRenovacionBovedas ?? 0;
            }

            // Pasar estos datos a la vista
            ViewBag.TotalRenovacionesEnCadena = totalRenovaciones;
            ViewBag.MaxRenovacionesPermitidas = maxRenovaciones;

            return View(contratoModel);
        }

        // GET: Contratos/CreateRelacionado - Para crear un segundo contrato en la misma bóveda
        public IActionResult CreateRelacionado(int contratoExistenteId)
        {
            // Limpiar la sesión anterior si existe
            HttpContext.Session.Remove("NuevoContrato");

            var contratoExistente = _context.Contrato
                .Include(c => c.Boveda)
                    .ThenInclude(b => b.Piso)
                        .ThenInclude(p => p.Bloque)
                .Include(c => c.Difunto)
                .FirstOrDefault(c => c.Id == contratoExistenteId);

            if (contratoExistente == null)
            {
                TempData["Error"] = "No se encontró el contrato especificado.";
                return RedirectToAction(nameof(Index));
            }

            if (contratoExistente.Boveda?.PropietarioId == null)
            {
                TempData["Error"] = "Solo se puede agregar otro difunto en bóvedas con propietario.";
                return RedirectToAction("Edit", "Bovedas", new { id = contratoExistente.BovedaId });
            }

            // Verificar que la bóveda no esté completamente ocupada (máximo 2 difuntos)
            var contratosEnBoveda = _context.Contrato
                .Where(c => c.BovedaId == contratoExistente.BovedaId &&
                           c.Estado == true &&
                           c.FechaFin >= DateTime.Today)
                .Count();

            if (contratosEnBoveda >= 2)
            {
                TempData["Error"] = "Esta bóveda ya tiene el máximo de contratos permitidos (2).";
                return RedirectToAction(nameof(Details), new { id = contratoExistenteId });
            }

            // Preparar el modelo con información del contrato existente
            var contratoExistenteModel = new ContratoModel
            {
                Id = contratoExistente.Id,
                NumeroSecuencial = contratoExistente.NumeroSecuencial,
                BovedaId = contratoExistente.BovedaId,
                FechaInicio = contratoExistente.FechaInicio,
                FechaFin = contratoExistente.FechaFin,
                NumeroDeMeses = contratoExistente.NumeroDeMeses,
                MontoTotal = contratoExistente.MontoTotal,
                Estado = contratoExistente.Estado,
                Observaciones = contratoExistente.Observaciones,
                EsRenovacion = contratoExistente.EsRenovacion,
                VecesRenovado = contratoExistente.VecesRenovado,
                ContratoOrigenId = contratoExistente.ContratoOrigenId,
                ContratoRelacionadoId = contratoExistente.ContratoRelacionadoId,
                Boveda = contratoExistente.Boveda != null ? new BovedaModel
                {
                    Id = contratoExistente.Boveda.Id,
                    Numero = contratoExistente.Boveda.Numero,
                    NumeroSecuencial = contratoExistente.Boveda.NumeroSecuencial,
                    Estado = contratoExistente.Boveda.Estado,
                    PisoId = contratoExistente.Boveda.PisoId ?? contratoExistente.Boveda.Piso?.Id ?? 0,
                    PropietarioId = contratoExistente.Boveda.PropietarioId
                } : null,
                Difunto = contratoExistente.Difunto != null ? new DifuntoModel
                {
                    Id = contratoExistente.Difunto.Id,
                    Nombres = contratoExistente.Difunto.Nombres,
                    Apellidos = contratoExistente.Difunto.Apellidos,
                    NumeroIdentificacion = contratoExistente.Difunto.NumeroIdentificacion,
                    FechaFallecimiento = contratoExistente.Difunto.FechaFallecimiento,
                    DescuentoId = contratoExistente.Difunto.DescuentoId
                } : null
            };

            var model = new CreateContratoModel
            {
                ContratoExistenteId = contratoExistenteId,
                ContratoExistente = contratoExistenteModel,
                contrato = new ContratoModel
                {
                    BovedaId = contratoExistente.BovedaId,
                    ContratoRelacionadoId = contratoExistenteId,
                    FechaInicio = DateTime.Now,
                    Estado = true,
                    EsRenovacion = false
                }
            };

            SaveContratoToSession(model);

            ViewBag.EsContratoRelacionado = true;
            ViewBag.ContratoExistente = contratoExistente;

            return View("Create", model);
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
                    if (EsNicho(tipoBoveda))
                    {
                        maxRenovaciones = cementerio.VecesRenovacionNicho;
                    }
                    else if (EsTumulo(tipoBoveda))
                    {
                        // Si tienes lógica especial para TÚMULOS, agrégala aquí
                        maxRenovaciones = 0; // O el valor correspondiente
                    }
                    else // BÓVEDAS u otros
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
                        string tipoEspacio = EsNicho(tipoBoveda) ? "nicho" : "bóveda";
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
                            FechaFin = nuevaFechaInicio.AddYears(DuracionContratoAniosPorDefecto), // Calcular nueva fecha fin
                            NumeroDeMeses = DuracionContratoAniosPorDefecto,
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
            }

            if (viewModel.contrato.EsRenovacion && viewModel.contrato.ContratoOrigenId.HasValue)
            {
                NormalizarDuracionContrato(viewModel.contrato);

                foreach (var responsable in viewModel.responsables)
                {
                    if (responsable.FechaInicio == default || responsable.FechaInicio < viewModel.contrato.FechaInicio)
                    {
                        responsable.FechaInicio = viewModel.contrato.FechaInicio;
                    }

                    if (!responsable.FechaFin.HasValue || responsable.FechaFin.Value > viewModel.contrato.FechaFin)
                    {
                        responsable.FechaFin = viewModel.contrato.FechaFin;
                    }
                }
            }

            // Validar si se puede renovar según la configuración del cementerio
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

                // Obtener el tipo de bóveda (NICHOS, TÚMULOS, BÓVEDAS)
                string? tipoBoveda = contratoOriginal.Boveda?.Piso?.Bloque?.Tipo;

                // Contar cuántas veces se ha renovado en toda la cadena
                int renovacionesTotales = ContarRenovacionesEnCadena(contratoRaizId);

                // Determinar máximo de renovaciones según el tipo
                int maxRenovaciones = 0; // Por defecto 0 si no se puede determinar el tipo
                if (EsNicho(tipoBoveda))
                {
                    maxRenovaciones = cementerio.VecesRenovacionNicho;
                }
                else if (EsTumulo(tipoBoveda))
                {
                    // Si tienes lógica especial para TÚMULOS, agrégala aquí
                    maxRenovaciones = 0; // O el valor correspondiente
                }
                else if (EsBoveda(tipoBoveda))
                {
                    maxRenovaciones = cementerio.VecesRenovacionBovedas;
                }

                // Verificar si se alcanzó el límite de renovaciones total en la cadena
                if (renovacionesTotales >= maxRenovaciones)
                {
                    string mensaje = EsNicho(tipoBoveda) ?
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
                        if (user == null)
                        {
                            return Json(new { success = false, errors = new List<string> { "No se pudo obtener el usuario autenticado para guardar el contrato." } });
                        }

                        var userId = user.Id;
                        var now = DateTime.Now;

                        // Convertir las personas a responsables antes de asociarlas al contrato
                        // Primero verifica si las personas ya existen
                        var responsables = new List<Responsable>();
                        var responsablePagoSeleccionado = viewModel.responsables
                            .FirstOrDefault(r => r.Id == viewModel.pago.PersonaPagoId);
                        foreach (var persona in viewModel.responsables)
                        {
                            // Verifica si ya existe un responsable para esta persona
                            var responsableExistente = _context.Responsable
                                .FirstOrDefault(r => r.NumeroIdentificacion == persona.NumeroIdentificacion);

                            if (responsableExistente != null)
                            {
                                // Si existe, actualiza sus datos si es necesario
                                responsableExistente.FechaInicio = persona.FechaInicio == default ? viewModel.contrato.FechaInicio : persona.FechaInicio;
                                responsableExistente.FechaFin = persona.FechaFin ?? viewModel.contrato.FechaFin ?? DateTime.Now.AddYears(5);
                                responsables.Add(responsableExistente);
                            }
                            else
                            {
                                // Si no existe, crea uno nuevo
                                var responsable = _mapper.Map<Responsable>(persona);
                                responsable.Id = 0;
                                responsable.FechaInicio = persona.FechaInicio == default ? viewModel.contrato.FechaInicio : persona.FechaInicio;
                                responsable.FechaFin = persona.FechaFin ?? viewModel.contrato.FechaFin ?? DateTime.Now.AddYears(5);
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
                            ContratoOrigenId = viewModel.contrato.ContratoOrigenId, // Establecer referencia al contrato original
                            ContratoRelacionadoId = viewModel.contrato.ContratoRelacionadoId // Establecer referencia al contrato relacionado
                        };

                        // Crear el difunto
                        var difunto = new Difunto
                        {
                            NumeroIdentificacion = viewModel.difunto.NumeroIdentificacion,
                            Nombres = viewModel.difunto.Nombres,
                            Apellidos = viewModel.difunto.Apellidos,
                            FechaNacimiento = viewModel.difunto.FechaNacimiento ?? DateTime.Now.AddYears(-70), // Usar fecha por defecto si es null
                            FechaFallecimiento = viewModel.difunto.FechaFallecimiento ?? DateTime.Now.AddDays(-30), // Usar fecha por defecto si es null
                            UsuarioCreadorId = userId,
                            UsuarioActualizadorId = userId,
                            FechaCreacion = now,
                            FechaActualizacion = now,
                            DescuentoId = viewModel.difunto.DescuentoId,
                            Estado = true

                        };
                        contrato.Difunto = difunto;


                        _context.Contrato.Add(contrato);
                        _context.SaveChanges();

                        // Si es un contrato relacionado, actualizar la relación bidireccional
                        if (contrato.ContratoRelacionadoId.HasValue)
                        {
                            var contratoExistente = _context.Contrato.Find(contrato.ContratoRelacionadoId.Value);
                            if (contratoExistente != null && contratoExistente.ContratoRelacionadoId == null)
                            {
                                contratoExistente.ContratoRelacionadoId = contrato.Id;
                                _context.SaveChanges();
                            }
                        }

                        // Crear las cuotas después de que el contrato tenga ID
                        contrato.Cuotas = _mapper.Map<List<Cuota>>(viewModel.contrato.Cuotas);
                        foreach (var cuota in contrato.Cuotas)
                        {
                            cuota.ContratoId = contrato.Id;
                            _context.Cuota.Add(cuota);
                        }

                        // Crear el pago
                        var pago = _mapper.Map<Pago>(viewModel.pago);
                        var responsablePago = responsables.FirstOrDefault(r => r.Id == viewModel.pago.PersonaPagoId);
                        if (responsablePago == null && responsablePagoSeleccionado != null)
                        {
                            responsablePago = responsables.FirstOrDefault(r =>
                                r.NumeroIdentificacion == responsablePagoSeleccionado.NumeroIdentificacion);
                        }

                        if (responsablePago == null)
                        {
                            return Json(new { success = false, errors = new List<string> { "Debe seleccionar un responsable válido para el pago." } });
                        }

                        pago.PersonaPagoId = responsablePago.Id;
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

            var contrato = await _context.Contrato
                .Include(c => c.Responsables)
                .Include(c => c.Cuotas)
                    .ThenInclude(c => c.Pagos)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (contrato == null)
            {
                return NotFound();
            }

            PrepararDatosEdicionContrato(contrato);
            return View(contrato);
        }

        // POST: Contratos/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,FechaInicio,FechaFin,MontoTotal,Observaciones")] Contrato contrato, int? responsablePrincipalId)
        {
            if (id != contrato.Id)
            {
                return NotFound();
            }

            ModelState.Clear();

            try
            {
                var contratoDb = await _context.Contrato
                    .Include(c => c.Responsables)
                    .Include(c => c.Cuotas)
                        .ThenInclude(c => c.Pagos)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (contratoDb == null)
                {
                    return NotFound();
                }

                if (contrato.FechaInicio >= contrato.FechaFin)
                {
                    ModelState.AddModelError(string.Empty, "La fecha de inicio debe ser anterior a la fecha de fin.");
                    contratoDb.FechaInicio = contrato.FechaInicio;
                    contratoDb.FechaFin = contrato.FechaFin;
                    contratoDb.MontoTotal = contrato.MontoTotal;
                    contratoDb.Observaciones = contrato.Observaciones ?? "";
                    PrepararDatosEdicionContrato(contratoDb, responsablePrincipalId);
                    return View(contratoDb);
                }

                contratoDb.FechaInicio = contrato.FechaInicio;
                contratoDb.FechaFin = contrato.FechaFin;
                contratoDb.NumeroDeMeses = CalcularAniosContrato(contrato.FechaInicio, contrato.FechaFin);
                contratoDb.MontoTotal = contrato.MontoTotal;
                contratoDb.Observaciones = contrato.Observaciones ?? "";
                contratoDb.FechaActualizacion = DateTime.Now;

                var user = await _userManager.GetUserAsync(User);
                if (user != null)
                {
                    contratoDb.UsuarioActualizadorId = user.Id;
                }

                if (responsablePrincipalId.HasValue)
                {
                    var responsablePerteneceAlContrato = contratoDb.Responsables.Any(r => r.Id == responsablePrincipalId.Value);
                    if (!responsablePerteneceAlContrato)
                    {
                        ModelState.AddModelError(string.Empty, "El responsable seleccionado no pertenece a este contrato.");
                        PrepararDatosEdicionContrato(contratoDb, responsablePrincipalId);
                        return View(contratoDb);
                    }

                    var pagos = contratoDb.Cuotas
                        .SelectMany(c => c.Pagos)
                        .ToList();

                    foreach (var pago in pagos)
                    {
                        pago.PersonaPagoId = responsablePrincipalId.Value;
                    }
                }

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

            return RedirectToAction(nameof(Details), new { id });
        }

        private void PrepararDatosEdicionContrato(Contrato contrato, int? responsablePrincipalId = null)
        {
            var responsablePagoId = responsablePrincipalId
                ?? contrato.Cuotas?
                    .SelectMany(c => c.Pagos)
                    .OrderByDescending(p => p.FechaPago)
                    .ThenByDescending(p => p.Id)
                    .Select(p => (int?)p.PersonaPagoId)
                    .FirstOrDefault()
                ?? contrato.Responsables?
                    .OrderByDescending(r => r.FechaInicio)
                    .ThenByDescending(r => r.Id)
                    .Select(r => (int?)r.Id)
                    .FirstOrDefault();

            ViewBag.ResponsablePrincipalId = responsablePagoId;
            ViewBag.ResponsablesContrato = contrato.Responsables?
                .OrderByDescending(r => r.FechaInicio)
                .ThenByDescending(r => r.Id)
                .Select(r => new SelectListItem
                {
                    Value = r.Id.ToString(),
                    Text = $"{r.Nombres} {r.Apellidos} - {r.NumeroIdentificacion}",
                    Selected = responsablePagoId.HasValue && r.Id == responsablePagoId.Value
                })
                .ToList() ?? new List<SelectListItem>();
        }

        // NumeroDeMeses guarda AÑOS (ver ContratoModel.NumeroDeMeses). Se redondea al año más
        // cercano porque los contratos suelen terminar un día antes de cumplir el aniversario
        // (09/06/2020 al 08/06/2025 son 5 años, no 4).
        private static int CalcularAniosContrato(DateTime fechaInicio, DateTime fechaFin)
        {
            var anios = (int)Math.Round((fechaFin - fechaInicio).TotalDays / 365.25, MidpointRounding.AwayFromZero);
            return Math.Max(1, anios);
        }

        [HttpGet]
        public IActionResult BuscarResponsableEdicion(int contratoId, string? searchTerm)
        {
            var termino = searchTerm?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(termino))
            {
                return Json(new { results = Array.Empty<object>() });
            }

            var responsablesContratoIdentificaciones = _context.Contrato
                .Where(c => c.Id == contratoId)
                .SelectMany(c => c.Responsables.Select(r => r.NumeroIdentificacion))
                .ToList();

            var results = _context.Persona
                .Where(p => !responsablesContratoIdentificaciones.Contains(p.NumeroIdentificacion) &&
                            (p.Nombres.Contains(termino) ||
                             p.Apellidos.Contains(termino) ||
                             p.NumeroIdentificacion.Contains(termino)))
                .OrderBy(p => p.Apellidos)
                .ThenBy(p => p.Nombres)
                .Take(10)
                .Select(p => new
                {
                    id = p.Id,
                    text = $"{p.Nombres} {p.Apellidos} - {p.NumeroIdentificacion}"
                })
                .ToList();

            return Json(new { results });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AgregarResponsableContrato(int contratoId, int responsableId)
        {
            var contrato = await _context.Contrato
                .Include(c => c.Responsables)
                .Include(c => c.Cuotas)
                    .ThenInclude(c => c.Pagos)
                .FirstOrDefaultAsync(c => c.Id == contratoId);

            if (contrato == null)
            {
                return Json(new { success = false, message = "No se encontró el contrato." });
            }

            var responsable = await ObtenerOCrearResponsableDesdePersona(responsableId);
            if (responsable == null)
            {
                return Json(new { success = false, message = "No se encontró el responsable seleccionado." });
            }

            if (!contrato.Responsables.Any(r => r.Id == responsable.Id))
            {
                responsable.FechaInicio = contrato.FechaInicio;
                responsable.FechaFin = contrato.FechaFin;
                contrato.Responsables.Add(responsable);
            }

            var pagos = contrato.Cuotas.SelectMany(c => c.Pagos).ToList();
            foreach (var pago in pagos)
            {
                pago.PersonaPagoId = responsable.Id;
            }

            contrato.FechaActualizacion = DateTime.Now;
            var user = await _userManager.GetUserAsync(User);
            if (user != null)
            {
                contrato.UsuarioActualizadorId = user.Id;
            }

            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                responsable = ResponsableEdicionJson(responsable)
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CrearResponsableContrato(int contratoId, ResponsableModel responsable)
        {
            ModelState.Clear();

            var contrato = await _context.Contrato
                .Include(c => c.Responsables)
                .Include(c => c.Cuotas)
                    .ThenInclude(c => c.Pagos)
                .FirstOrDefaultAsync(c => c.Id == contratoId);

            if (contrato == null)
            {
                return Json(new { success = false, message = "No se encontró el contrato." });
            }

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Json(new { success = false, message = "No se pudo obtener el usuario autenticado." });
            }

            var nuevoResponsable = _context.Responsable
                .FirstOrDefault(r => r.NumeroIdentificacion == responsable.NumeroIdentificacion);

            if (nuevoResponsable == null)
            {
                nuevoResponsable = new Responsable
                {
                    Nombres = responsable.Nombres,
                    Apellidos = responsable.Apellidos,
                    TipoIdentificacion = responsable.TipoIdentificacion,
                    NumeroIdentificacion = responsable.NumeroIdentificacion,
                    Telefono = responsable.Telefono,
                    Email = responsable.Email,
                    Direccion = responsable.Direccion,
                    Estado = true,
                    FechaInicio = contrato.FechaInicio,
                    FechaFin = contrato.FechaFin,
                    FechaCreacion = DateTime.Now,
                    UsuarioCreadorId = user.Id
                };
                _context.Responsable.Add(nuevoResponsable);
                await _context.SaveChangesAsync();
            }
            else
            {
                nuevoResponsable.FechaInicio = contrato.FechaInicio;
                nuevoResponsable.FechaFin = contrato.FechaFin;
            }

            if (!contrato.Responsables.Any(r => r.NumeroIdentificacion == nuevoResponsable.NumeroIdentificacion))
            {
                contrato.Responsables.Add(nuevoResponsable);
            }

            foreach (var pago in contrato.Cuotas.SelectMany(c => c.Pagos))
            {
                pago.PersonaPagoId = nuevoResponsable.Id;
            }

            contrato.FechaActualizacion = DateTime.Now;
            contrato.UsuarioActualizadorId = user.Id;

            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                responsable = ResponsableEdicionJson(nuevoResponsable)
            });
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerResponsableContrato(int contratoId, int responsableId)
        {
            var responsable = await _context.Contrato
                .Where(c => c.Id == contratoId)
                .SelectMany(c => c.Responsables)
                .FirstOrDefaultAsync(r => r.Id == responsableId);

            if (responsable == null)
            {
                return Json(new { success = false, message = "El responsable no pertenece a este contrato." });
            }

            // Un mismo responsable puede estar vinculado a varios contratos: editarlo los afecta a todos
            var otrosContratos = await _context.Contrato
                .CountAsync(c => c.Id != contratoId && c.Responsables.Any(r => r.Id == responsableId));

            return Json(new
            {
                success = true,
                otrosContratos,
                responsable = new
                {
                    id = responsable.Id,
                    nombres = responsable.Nombres,
                    apellidos = responsable.Apellidos,
                    tipoIdentificacion = responsable.TipoIdentificacion,
                    numeroIdentificacion = responsable.NumeroIdentificacion,
                    telefono = responsable.Telefono,
                    email = responsable.Email,
                    direccion = responsable.Direccion
                }
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EditarResponsableContrato(int contratoId, int responsableId, ResponsableModel responsable)
        {
            ModelState.Clear();

            var contrato = await _context.Contrato
                .Include(c => c.Responsables)
                .FirstOrDefaultAsync(c => c.Id == contratoId);

            if (contrato == null)
            {
                return Json(new { success = false, message = "No se encontró el contrato." });
            }

            var responsableDb = contrato.Responsables.FirstOrDefault(r => r.Id == responsableId);
            if (responsableDb == null)
            {
                return Json(new { success = false, message = "El responsable no pertenece a este contrato." });
            }

            var nombres = responsable.Nombres?.Trim() ?? string.Empty;
            var apellidos = responsable.Apellidos?.Trim() ?? string.Empty;
            var identificacion = responsable.NumeroIdentificacion?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(nombres) || string.IsNullOrWhiteSpace(apellidos) || string.IsNullOrWhiteSpace(identificacion))
            {
                return Json(new { success = false, message = "Nombres, apellidos e identificación son obligatorios." });
            }

            // Solo se valida si la identificación cambia: los datos migrados del catastro ya
            // contienen responsables repetidos y bloquearlos impediría editar el resto de campos
            if (!string.Equals(responsableDb.NumeroIdentificacion, identificacion, StringComparison.OrdinalIgnoreCase))
            {
                var identificacionEnUso = await _context.Responsable
                    .AnyAsync(r => r.Id != responsableId && r.NumeroIdentificacion == identificacion);
                if (identificacionEnUso)
                {
                    return Json(new { success = false, message = "Ya existe otro responsable con ese número de identificación." });
                }
            }

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Json(new { success = false, message = "No se pudo obtener el usuario autenticado." });
            }

            responsableDb.Nombres = nombres;
            responsableDb.Apellidos = apellidos;
            responsableDb.NumeroIdentificacion = identificacion;

            if (!string.IsNullOrWhiteSpace(responsable.TipoIdentificacion))
            {
                responsableDb.TipoIdentificacion = responsable.TipoIdentificacion.Trim();
            }
            if (!string.IsNullOrWhiteSpace(responsable.Telefono))
            {
                responsableDb.Telefono = responsable.Telefono.Trim();
            }
            if (!string.IsNullOrWhiteSpace(responsable.Email))
            {
                responsableDb.Email = responsable.Email.Trim();
            }
            if (!string.IsNullOrWhiteSpace(responsable.Direccion))
            {
                responsableDb.Direccion = responsable.Direccion.Trim();
            }

            contrato.FechaActualizacion = DateTime.Now;
            contrato.UsuarioActualizadorId = user.Id;

            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                responsable = ResponsableEdicionJson(responsableDb)
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> EliminarResponsableContrato(int contratoId, int responsableId)
        {
            var contrato = await _context.Contrato
                .Include(c => c.Responsables)
                .Include(c => c.Cuotas)
                    .ThenInclude(c => c.Pagos)
                .FirstOrDefaultAsync(c => c.Id == contratoId);

            if (contrato == null)
            {
                return Json(new { success = false, message = "No se encontró el contrato." });
            }

            var responsable = contrato.Responsables.FirstOrDefault(r => r.Id == responsableId);
            if (responsable == null)
            {
                return Json(new { success = false, message = "El responsable no pertenece a este contrato." });
            }

            if (contrato.Responsables.Count <= 1)
            {
                return Json(new { success = false, message = "El contrato debe conservar al menos un responsable." });
            }

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Json(new { success = false, message = "No se pudo obtener el usuario autenticado." });
            }

            // Solo se desvincula del contrato: la persona sigue existiendo y conserva sus otros contratos
            contrato.Responsables.Remove(responsable);

            var reemplazo = contrato.Responsables
                .OrderByDescending(r => r.FechaInicio)
                .ThenByDescending(r => r.Id)
                .First();

            // Si el retirado era quien figuraba como arrendatario, el documento pasa al reemplazo
            var pagosReasignados = contrato.Cuotas
                .SelectMany(c => c.Pagos)
                .Where(p => p.PersonaPagoId == responsableId)
                .ToList();

            foreach (var pago in pagosReasignados)
            {
                pago.PersonaPagoId = reemplazo.Id;
            }

            contrato.FechaActualizacion = DateTime.Now;
            contrato.UsuarioActualizadorId = user.Id;

            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                responsablePrincipalId = reemplazo.Id,
                reasignado = pagosReasignados.Count > 0
            });
        }

        private async Task<Responsable?> ObtenerOCrearResponsableDesdePersona(int personaId)
        {
            var persona = await _context.Persona.AsNoTracking().FirstOrDefaultAsync(p => p.Id == personaId);
            if (persona == null)
            {
                return null;
            }

            var responsable = await _context.Responsable
                .FirstOrDefaultAsync(r => r.NumeroIdentificacion == persona.NumeroIdentificacion);
            if (responsable != null)
            {
                return responsable;
            }

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return null;
            }

            responsable = new Responsable
            {
                Nombres = persona.Nombres,
                Apellidos = persona.Apellidos,
                TipoIdentificacion = persona.TipoIdentificacion,
                NumeroIdentificacion = persona.NumeroIdentificacion,
                Telefono = persona.Telefono,
                Email = persona.Email,
                Direccion = persona.Direccion,
                Estado = true,
                FechaInicio = DateTime.Now,
                FechaCreacion = DateTime.Now,
                UsuarioCreadorId = user.Id
            };
            _context.Responsable.Add(responsable);
            await _context.SaveChangesAsync();
            return responsable;
        }

        private static object ResponsableEdicionJson(Responsable responsable)
        {
            return new
            {
                id = responsable.Id,
                text = $"{responsable.Nombres} {responsable.Apellidos} - {responsable.NumeroIdentificacion}",
                nombres = responsable.Nombres,
                apellidos = responsable.Apellidos,
                identificacion = responsable.NumeroIdentificacion,
                telefono = responsable.Telefono,
                email = responsable.Email
            };
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
            try
            {
                var cementerio = _context.Cementerio.FirstOrDefault();
                PdfErrorHandler.ValidateRequiredData(cementerio, "Información del cementerio");
                PdfErrorHandler.ValidateRequiredData(model, "Datos del contrato");

                var documento = new ContratoPDF(model, cementerio);

                // Usar GeneratePdfSafely que debería manejar errores de layout automáticamente
                var pdfBytes = PdfErrorHandler.GeneratePdfSafely(() => documento.GeneratePdf(), "Contrato de Arrendamiento");

                return File(pdfBytes, "application/pdf", "ContratoArrendamiento.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en GenerarContratoPDF: {Message}", ex.Message);
                TempData["Error"] = $"Error al generar el PDF: {ex.Message}. Se generó un documento simplificado.";
                return RedirectToAction("Index");
            }
        }

        [HttpGet]
        public IActionResult Print(int id)
        {
            try
            {
                var cementerio = _context.Cementerio.FirstOrDefault();
                PdfErrorHandler.ValidateRequiredData(cementerio, "Información del cementerio");

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

                PdfErrorHandler.ValidateRequiredData(contrato, "Contrato");

                var contratoModel = _mapper.Map<ContratoModel>(contrato);

                // Mapear las fechas de pago a las cuotas y asociar el PagoId si está pagada
                foreach (var cuota in contratoModel.Cuotas)
                {
                    var cuotaEntity = contrato.Cuotas.FirstOrDefault(c => c.Id == cuota.Id);
                    if (cuotaEntity?.Pagos != null && cuotaEntity.Pagos.Any())
                    {
                        cuota.FechaPago = cuotaEntity.Pagos.First().FechaPago;
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

                // Crear el modelo para el PDF con validaciones adicionales
                var modelo = new CreateContratoModel
                {
                    contrato = contratoModel,
                    difunto = contratoModel.Difunto ?? new DifuntoModel
                    {
                        Nombres = "No especificado",
                        Apellidos = "No especificado",
                        NumeroIdentificacion = "No especificado"
                    },
                    responsables = contratoModel.Responsables ?? new List<ResponsableModel>(),
                    pago = new PagoModel
                    {
                        PersonaPagoId = contrato.Cuotas
                            .SelectMany(c => c.Pagos)
                            .OrderByDescending(p => p.FechaPago)
                            .ThenByDescending(p => p.Id)
                            .Select(p => p.PersonaPagoId)
                            .FirstOrDefault()
                    }
                };

                // Validaciones adicionales para evitar problemas en el PDF
                if (string.IsNullOrEmpty(modelo.difunto.Nombres))
                {
                    modelo.difunto.Nombres = "No especificado";
                }
                if (string.IsNullOrEmpty(modelo.difunto.Apellidos))
                {
                    modelo.difunto.Apellidos = "No especificado";
                }
                if (string.IsNullOrEmpty(modelo.difunto.NumeroIdentificacion))
                {
                    modelo.difunto.NumeroIdentificacion = "No especificado";
                }

                // LOGGING DETALLADO PARA DEBUGGING
                _logger.LogInformation("=== DATOS DEL CONTRATO PARA PDF ===");
                _logger.LogInformation("Contrato ID: {Id}", id);
                _logger.LogInformation("Número Secuencial: {NumSec}", modelo.contrato.NumeroSecuencial);
                _logger.LogInformation("Presidente: {Pres} (Length: {Len})", cementerio.Presidente, cementerio.Presidente?.Length ?? 0);
                _logger.LogInformation("Difunto: {Dif} (Length: {Len})", modelo.difunto.NombresCompletos, modelo.difunto.NombresCompletos?.Length ?? 0);
                var responsablePrincipal = modelo.responsables.OrderByDescending(r => r.Id).FirstOrDefault();
                _logger.LogInformation("Responsable: {Resp} (Length: {Len})",
                    responsablePrincipal?.NombresCompletos,
                    responsablePrincipal?.NombresCompletos?.Length ?? 0);
                _logger.LogInformation("Observaciones: {Obs} (Length: {Len})",
                    modelo.contrato.Observaciones?.Substring(0, Math.Min(50, modelo.contrato.Observaciones?.Length ?? 0)) + "...",
                    modelo.contrato.Observaciones?.Length ?? 0);
                _logger.LogInformation("Bloque Descripción: {Bloq} (Length: {Len})",
                    modelo.contrato.Boveda?.Piso?.Bloque?.Descripcion,
                    modelo.contrato.Boveda?.Piso?.Bloque?.Descripcion?.Length ?? 0);
                _logger.LogInformation("Número de Cuotas: {NCuotas}", modelo.contrato.Cuotas?.Count ?? 0);
                _logger.LogInformation("===================================");

                // Intentar generar el PDF con manejo robusto de errores
                var documento = new ContratoPDF(modelo, cementerio);
                var pdfBytes = PdfErrorHandler.GeneratePdfSafely(() => documento.GeneratePdf(), "Contrato PDF");

                return File(pdfBytes, "application/pdf", $"Contrato_{contrato.NumeroSecuencial}.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en Print para contrato {Id}: {Message}", id, ex.Message);
                TempData["Error"] = $"Error al generar el PDF del contrato: {ex.Message}";
                return RedirectToAction("Index");
            }
        }

        [HttpGet]
        public IActionResult TestPDF()
        {
            return PdfErrorHandler.ExecutePdfOperation(() =>
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

                var pdfBytes = PdfErrorHandler.GeneratePdfSafely(() => document.GeneratePdf(), "PDF de prueba");
                return File(pdfBytes, "application/pdf", "test.pdf");
            }, _logger, this, "Index", "Generación de PDF de prueba");
        }

        [HttpGet]
        public IActionResult VerContratoPDF()
        {
            return PdfErrorHandler.ExecutePdfOperation(() =>
            {
                var cementerio = _context.Cementerio.FirstOrDefault();
                PdfErrorHandler.ValidateRequiredData(cementerio, "Información del cementerio");

                var modelo = GetContratoFromSession();
                PdfErrorHandler.ValidateRequiredData(modelo?.contrato, "Información de contrato");

                if (modelo.contrato.BovedaId <= 0)
                {
                    throw new PdfDataException("No hay información válida de bóveda para el contrato");
                }

                var boveda = _context.Boveda.Include(b => b.Piso).ThenInclude(p => p.Bloque)
                    .FirstOrDefault(b => b.Id == modelo.contrato.BovedaId);
                if (boveda != null)
                {
                    modelo.contrato.Boveda = _mapper.Map<BovedaModel>(boveda);
                }

                var documento = new ContratoPDF(modelo, cementerio);
                var pdfBytes = PdfErrorHandler.GeneratePdfSafely(() => documento.GeneratePdf(), "Vista previa de contrato");

                var fileName = $"CONTRATO_{modelo.contrato.NumeroSecuencial ?? "Arrendamiento"}.pdf";
                ViewBag.NombreArchivo = fileName;
                Response.Headers["Content-Disposition"] = $"inline; filename={fileName}";
                return new FileContentResult(pdfBytes, "application/pdf");
            }, _logger, this, "Index", "Generación de vista previa de contrato");
        }
        // CREAR DIFUNTO
        [HttpGet]
        public IActionResult CreateDifunto()
        {
            var contrato = GetContratoFromSession();
            var difunto = contrato.difunto ?? new DifuntoModel();

            // Solo establecer fechas por defecto si no existen datos previos
            if (contrato.difunto == null)
            {
                difunto.FechaNacimiento = DateTime.Now.AddYears(-70); // Fecha de nacimiento más realista (70 años atrás)
                difunto.FechaFallecimiento = DateTime.Now.AddDays(-30); // Fallecimiento hace 30 días (más realista)

                // Actualizar el contrato con el difunto y guardarlo en sesión
                contrato.difunto = difunto;
                SaveContratoToSession(contrato);
            }

            var descuentos = _context.Descuento.ToList();
            ViewData["DescuentoId"] = new SelectList(descuentos, "Id", "Descripcion");
            return PartialView("_CreateDifunto", difunto);
        }
        [HttpPost]
        public IActionResult CreateDifunto(DifuntoModel difunto)
        {
            // Validaciones adicionales para las fechas
            var erroresCustom = new List<string>();

            // Validar que la fecha de nacimiento no sea futura
            if (difunto.FechaNacimiento.HasValue && difunto.FechaNacimiento.Value > DateTime.Now)
            {
                erroresCustom.Add("La fecha de nacimiento no puede ser una fecha futura.");
            }

            // Validar que la fecha de fallecimiento no sea futura
            if (difunto.FechaFallecimiento.HasValue && difunto.FechaFallecimiento.Value > DateTime.Now)
            {
                erroresCustom.Add("La fecha de fallecimiento no puede ser una fecha futura.");
            }

            // Validar que la fecha de fallecimiento sea posterior a la fecha de nacimiento
            if (difunto.FechaNacimiento.HasValue && difunto.FechaFallecimiento.HasValue &&
                difunto.FechaFallecimiento.Value <= difunto.FechaNacimiento.Value)
            {
                erroresCustom.Add("La fecha de fallecimiento debe ser posterior a la fecha de nacimiento.");
            }

            // Validar edad mínima realista (por ejemplo, no menor a 0 años)
            if (difunto.FechaNacimiento.HasValue && difunto.FechaFallecimiento.HasValue)
            {
                var edad = difunto.FechaFallecimiento.Value.Year - difunto.FechaNacimiento.Value.Year;
                if (difunto.FechaFallecimiento.Value < difunto.FechaNacimiento.Value.AddYears(edad))
                    edad--;

                if (edad < 0)
                {
                    erroresCustom.Add("Las fechas no son coherentes. Verifique las fechas de nacimiento y fallecimiento.");
                }

                // Validar edad máxima realista (por ejemplo, no mayor a 150 años)
                if (edad > 150)
                {
                    erroresCustom.Add("La edad calculada parece poco realista. Verifique las fechas.");
                }
            }

            // Validar que la fecha de fallecimiento no sea muy antigua (por ejemplo, máximo 100 años atrás)
            if (difunto.FechaFallecimiento.HasValue && difunto.FechaFallecimiento.Value < DateTime.Now.AddYears(-100))
            {
                erroresCustom.Add("La fecha de fallecimiento no puede ser anterior a 100 años.");
            }

            // Si hay errores personalizados, agregarlos al ModelState
            if (erroresCustom.Any())
            {
                foreach (var error in erroresCustom)
                {
                    ModelState.AddModelError("", error);
                }
            }

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
            NormalizarFechasResponsables(contrato, responsables);
            SaveContratoToSession(contrato);
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
                    NormalizarFechasResponsables(contrato, responsables);
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
        public IActionResult ActualizarFechasResponsables([FromBody] List<ResponsableFechasRequest> responsables)
        {
            try
            {
                var contrato = GetContratoFromSession();
                foreach (var responsable in responsables ?? new List<ResponsableFechasRequest>())
                {
                    var responsableSession = contrato.responsables.FirstOrDefault(r => r.Id == responsable.Id);
                    if (responsableSession == null) continue;

                    responsableSession.FechaInicio = responsable.FechaInicio == default
                        ? contrato.contrato.FechaInicio
                        : responsable.FechaInicio;
                    responsableSession.FechaFin = responsable.FechaFin ?? contrato.contrato.FechaFin;
                }

                NormalizarFechasResponsables(contrato, contrato.responsables);
                SaveContratoToSession(contrato);
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar fechas de responsables");
                return Json(new { success = false, errors = new List<string> { ex.Message } });
            }
        }

        private static void NormalizarFechasResponsables(CreateContratoModel contrato, List<ResponsableModel> responsables)
        {
            foreach (var responsable in responsables)
            {
                if (responsable.FechaInicio == default || responsable.FechaInicio.Date < contrato.contrato.FechaInicio.Date)
                {
                    responsable.FechaInicio = contrato.contrato.FechaInicio;
                }

                var fechaFinContrato = contrato.contrato.FechaFin;
                if (!responsable.FechaFin.HasValue || (fechaFinContrato.HasValue && responsable.FechaFin.Value.Date > fechaFinContrato.Value.Date))
                {
                    responsable.FechaFin = fechaFinContrato;
                }
            }
        }

        public class ResponsableFechasRequest
        {
            public int Id { get; set; }
            public DateTime FechaInicio { get; set; }
            public DateTime? FechaFin { get; set; }
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
                contrato.pago.PersonaPagoId = responsable.Id;
                NormalizarFechasResponsables(contrato, contrato.responsables);
                SaveContratoToSession(contrato);
                return Json(new { success = true, contrato.responsables });
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
                FechaInicio = contrato.contrato.FechaInicio,
                FechaFin = contrato.contrato.FechaFin
            };

            contrato.responsables.Add(responsableModel);
            contrato.pago.PersonaPagoId = responsableModel.Id;
            NormalizarFechasResponsables(contrato, contrato.responsables);
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
                    if (contrato.pago.PersonaPagoId == id)
                    {
                        contrato.pago.PersonaPagoId = contrato.responsables.LastOrDefault()?.Id ?? 0;
                    }
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
            NormalizarFechasResponsables(contrato, contrato.responsables);

            // Validar que haya al menos un responsable asignado
            if (contrato.responsables == null || !contrato.responsables.Any())
            {
                return Json(new
                {
                    success = false,
                    errors = new List<string> { "Debe asignar al menos un responsable antes de proceder con el pago." }
                });
            }

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

            ViewBag.ResponsablesContrato = contrato.responsables.Select(r => new SelectListItem
            {
                Value = r.Id.ToString(),
                Text = r.NombresCompletos
            }).ToList();

            var responsableSeleccionado = contrato.pago.PersonaPagoId > 0
                ? contrato.responsables.FirstOrDefault(r => r.Id == contrato.pago.PersonaPagoId)
                : contrato.responsables.LastOrDefault();
            if (responsableSeleccionado != null)
            {
                contrato.pago.PersonaPagoId = responsableSeleccionado.Id;
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
            var esRenovacion = contrato_model.contrato.EsRenovacion && contrato_model.contrato.ContratoOrigenId.HasValue;
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

            if (!esRenovacion)
            {
                contrato_model.contrato.FechaInicio = DateTime.Now;
                NormalizarDuracionContrato(contrato_model.contrato);
            }
            else
            {
                var contratoOriginal = _context.Contrato
                    .AsNoTracking()
                    .FirstOrDefault(c => c.Id == contrato_model.contrato.ContratoOrigenId);

                if (contratoOriginal != null)
                {
                    contrato_model.contrato.EsRenovacion = true;
                    contrato_model.contrato.ContratoOrigenId = contratoOriginal.Id;
                    contrato_model.contrato.BovedaId = contratoOriginal.BovedaId;

                    if (string.IsNullOrWhiteSpace(contrato_model.contrato.NumeroSecuencial) ||
                        !contrato_model.contrato.NumeroSecuencial.StartsWith("RNV-"))
                    {
                        contrato_model.contrato.NumeroSecuencial = _contratoService.getNumeroContrato(contratoOriginal.BovedaId, isRenovacion: true);
                    }

                    if (contrato_model.contrato.FechaInicio == default || contrato_model.contrato.FechaInicio.Date == DateTime.Today)
                    {
                        contrato_model.contrato.FechaInicio = contratoOriginal.FechaFin.AddDays(1);
                    }

                    NormalizarDuracionContrato(contrato_model.contrato);
                    contrato_model.contrato.Observaciones ??= $"Renovación del contrato {contratoOriginal.NumeroSecuencial} de fecha {contratoOriginal.FechaInicio:dd/MM/yyyy} al {contratoOriginal.FechaFin:dd/MM/yyyy}";
                }
            }
            //contrato_model.contrato.Difunto = new DifuntoModel();
            contrato_model.contrato.MontoTotal = tarifa;

            // Asegurarse de que la propiedad EsRenovacion se mantenga
            // Esto es especialmente importante si estamos renovando un contrato existente

            // Si tenemos información de renovación en la sesión, mantenerla
            if (esRenovacion)
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
            SaveContratoToSession(contrato_model);
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

                if (sessionContrato.contrato.EsRenovacion || contrato.EsRenovacion)
                {
                    contrato.EsRenovacion = true;
                    contrato.ContratoOrigenId = contrato.ContratoOrigenId ?? sessionContrato.contrato.ContratoOrigenId;
                    NormalizarDuracionContrato(contrato);
                }

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
                var numeroAnios = contrato.NumeroDeMeses > 0 ? contrato.NumeroDeMeses : DuracionContratoAniosPorDefecto;
                var montoCuota = contrato.MontoTotal / numeroAnios;
                var fechaActual = contrato.FechaInicio;

                for (int i = 0; i < numeroAnios; i++)
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
        public IActionResult BuscarBovedas(string filtro = "", string tipo = "", int? bloqueId = null, int pagina = 1)
        {
            var hoy = DateTime.Today;

            // Solo se listan los bloques que tienen al menos una bóveda disponible,
            // con el conteo para que la secretaría sepa dónde hay cupo sin tener que probar uno por uno.
            var bloques = _context.Bloque
                .Where(b => b.Estado)
                .Select(b => new
                {
                    b.Id,
                    b.Descripcion,
                    Disponibles = _context.Boveda.Count(bo => bo.Estado
                        && bo.Piso != null
                        && bo.Piso.BloqueId == b.Id
                        && !bo.Contratos.Any(c => c.Estado == true && (c.FechaFin == null || c.FechaFin >= hoy)))
                })
                .Where(b => b.Disponibles > 0)
                .OrderBy(b => b.Descripcion)
                .ToList()
                .Select(b => new SelectListItem
                {
                    Value = b.Id.ToString(),
                    Text = $"{b.Descripcion} ({b.Disponibles} disponibles)",
                    Selected = bloqueId.HasValue && b.Id == bloqueId.Value
                })
                .ToList();

            var viewModel = new BovedaPaginadaViewModel
            {
                Bovedas = new List<BovedaModel>(),
                PaginaActual = pagina,
                TotalPaginas = 0,
                Filtro = filtro,
                Tipo = tipo,
                BloqueId = bloqueId,
                Bloques = bloques
            };

            return PartialView("_SelectBoveda", viewModel);
        }
        public IActionResult BuscarBovedasJson(string filtro = "", string tipo = "", int? bloqueId = null, int pagina = 1)
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
                        || b.Numero.ToString().Contains(filtro)
                        || (b.Piso != null && b.Piso.Bloque != null && b.Piso.Bloque.Descripcion.Contains(filtro)));
                }

                if (!string.IsNullOrEmpty(tipo))
                {
                    query = query.Where(b => b.Piso != null && b.Piso.Bloque != null && b.Piso.Bloque.Tipo == tipo);
                }

                if (bloqueId.HasValue)
                {
                    query = query.Where(b => b.Piso != null && b.Piso.BloqueId == bloqueId.Value);
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
                    .OrderBy(b => b.Piso != null && b.Piso.Bloque != null ? b.Piso.Bloque.Descripcion : "")
                    .ThenBy(b => b.Piso != null ? b.Piso.NumeroPiso : 0)
                    .ThenBy(b => b.Numero)
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
                        bloque = b.Piso?.Bloque?.Descripcion ?? "Sin bloque",
                        piso = b.Piso?.NumeroPiso,
                        tipo = b.Piso?.Bloque?.Tipo ?? "No especificado",
                        estado = b.Estado ? "Activa" : "Inactiva",
                        propietario = b.Propietario != null ? ($"{b.Propietario.Nombres} {b.Propietario.Apellidos}") : "Sin propietario"
                    }),
                    paginaActual = pagina,
                    totalPaginas = (int)Math.Ceiling(total / (double)pageSize),
                    totalResultados = total,
                    filtro = filtro,
                    bloqueId = bloqueId
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

            try
            {
                if (!Directory.Exists(carpetaDestino))
                {
                    _logger.LogInformation("Creando directorio de documentos: {Directorio}", carpetaDestino);
                    Directory.CreateDirectory(carpetaDestino);

                    // En sistemas Unix/Linux, intentar establecer permisos más permisivos
                    if (OperatingSystem.IsLinux() || OperatingSystem.IsMacOS())
                    {
                        try
                        {
                            var info = new DirectoryInfo(carpetaDestino);
                            // Establecer permisos rwxrwxr-x (775)
                            info.UnixFileMode = UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute |
                                               UnixFileMode.GroupRead | UnixFileMode.GroupWrite | UnixFileMode.GroupExecute |
                                               UnixFileMode.OtherRead | UnixFileMode.OtherExecute;
                            _logger.LogInformation("Permisos Unix establecidos exitosamente para: {Directorio}", carpetaDestino);
                        }
                        catch (Exception permissionEx)
                        {
                            _logger.LogWarning("No se pudieron establecer permisos Unix en el directorio {Directorio}: {Error}",
                                carpetaDestino, permissionEx.Message);
                            // Continuar sin permisos personalizados
                        }
                    }
                }
                else
                {
                    _logger.LogDebug("El directorio de documentos ya existe: {Directorio}", carpetaDestino);
                }

                // Verificar que tenemos permisos de escritura en el directorio
                var testFile = Path.Combine(carpetaDestino, ".write_test");
                try
                {
                    System.IO.File.WriteAllText(testFile, "test");
                    System.IO.File.Delete(testFile);
                    _logger.LogDebug("Verificación de permisos de escritura exitosa en: {Directorio}", carpetaDestino);
                }
                catch (Exception writeTestEx)
                {
                    _logger.LogError(writeTestEx, "No hay permisos de escritura en el directorio: {Directorio}", carpetaDestino);
                    throw new UnauthorizedAccessException($"Sin permisos de escritura en {carpetaDestino}", writeTestEx);
                }
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "Error de permisos al crear/acceder directorio de documentos: {Directorio}", carpetaDestino);
                TempData["Error"] = $"Error de permisos al acceder al directorio de documentos. " +
                    $"El administrador debe verificar que el proceso tenga permisos de escritura en {carpetaDestino}";
                return RedirectToAction("SubirDocumento", new { idContrato });
            }
            catch (DirectoryNotFoundException ex)
            {
                _logger.LogError(ex, "No se pudo encontrar el directorio padre: {DirectorioRaiz}", _env.WebRootPath);
                TempData["Error"] = "El directorio raíz de la aplicación no es accesible. Contacte al administrador.";
                return RedirectToAction("SubirDocumento", new { idContrato });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al crear directorio de documentos: {Directorio}", carpetaDestino);
                TempData["Error"] = "Error al preparar el directorio de documentos. Contacte al administrador.";
                return RedirectToAction("SubirDocumento", new { idContrato });
            }

            var nombreArchivo = Guid.NewGuid() + Path.GetExtension(modelo.Archivo.FileName);
            var rutaCompleta = Path.Combine(carpetaDestino, nombreArchivo);

            try
            {
                using (var stream = new FileStream(rutaCompleta, FileMode.Create))
                {
                    await modelo.Archivo.CopyToAsync(stream);
                }
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "Error de permisos al guardar archivo");
                TempData["Error"] = "Error de permisos al guardar el archivo. Contacte al administrador.";
                return RedirectToAction("SubirDocumento", new { idContrato });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar archivo");
                TempData["Error"] = "Error al guardar el archivo. Intentelo nuevamente.";
                return RedirectToAction("SubirDocumento", new { idContrato });
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
                            nuevoResponsable = responsableExistente;
                        }
                        else
                        {
                            nuevoResponsable = _mapper.Map<Responsable>(responsable);
                            nuevoResponsable.Id = 0;
                            nuevoResponsable.FechaCreacion = DateTime.Now;
                            nuevoResponsable.UsuarioCreadorId = identityUser1.Id;
                            nuevoResponsable.FechaInicio = DateTime.Now;
                            _context.Responsable.Add(nuevoResponsable);
                            await _context.SaveChangesAsync();
                        }
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
                    }
                    contrato.pago.PersonaPagoId = nuevoResponsable.Id;
                    SaveContratoToSession(contrato);

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

        private static string NormalizarTipoEspacio(string? tipo)
        {
            if (string.IsNullOrWhiteSpace(tipo))
            {
                return string.Empty;
            }

            var normalized = tipo.Trim().Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder(normalized.Length);

            foreach (var character in normalized)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(character);
                }
            }

            return builder.ToString().Normalize(NormalizationForm.FormC).ToUpperInvariant();
        }

        private static bool EsNicho(string? tipo)
        {
            var normalizado = NormalizarTipoEspacio(tipo);
            return normalizado == "NICHO" || normalizado == "NICHOS";
        }

        private static bool EsTumulo(string? tipo)
        {
            var normalizado = NormalizarTipoEspacio(tipo);
            return normalizado == "TUMULO" || normalizado == "TUMULOS";
        }

        private static bool EsBoveda(string? tipo)
        {
            var normalizado = NormalizarTipoEspacio(tipo);
            return normalizado == "BOVEDA" || normalizado == "BOVEDAS" || string.IsNullOrEmpty(normalizado);
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
            if (contrato != null)
            {
                NormalizarFechasResponsables(contrato, responsables);
                SaveContratoToSession(contrato);
            }

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

        // Método para obtener contratos existentes en una bóveda
        [HttpGet]
        public IActionResult GetContratosEnBoveda(int bovedaId)
        {
            var contratos = _context.Contrato
                .Include(c => c.Difunto)
                .Where(c => c.BovedaId == bovedaId && c.Estado == true && c.FechaFin >= DateTime.Today)
                .Select(c => new
                {
                    id = c.Id,
                    numeroSecuencial = c.NumeroSecuencial,
                    difunto = new
                    {
                        nombres = c.Difunto.Nombres,
                        apellidos = c.Difunto.Apellidos
                    },
                    fechaFin = c.FechaFin.ToString("yyyy-MM-dd"),
                    tieneContratoRelacionado = c.ContratoRelacionadoId != null
                })
                .ToList();

            return Json(new
            {
                success = true,
                contratos = contratos,
                puedeAgregarOtro = contratos.Count < 2
            });
        }

        // Método para verificar si una bóveda está disponible para un segundo contrato
        [HttpGet]
        public IActionResult VerificarDisponibilidadBoveda(int bovedaId)
        {
            var contratosActivos = _context.Contrato
                .Where(c => c.BovedaId == bovedaId && c.Estado == true && c.FechaFin >= DateTime.Today)
                .Count();

            return Json(new
            {
                success = true,
                disponible = contratosActivos < 2,
                contratosActivos = contratosActivos,
                espaciosDisponibles = 2 - contratosActivos
            });
        }

        // Método para buscar contratos disponibles para relacionar
        [HttpGet]
        public IActionResult BuscarContratosParaRelacionar(string numero = "", string difunto = "", int? bovedaId = null, int contratoActualId = 0)
        {
            var query = _context.Contrato
                .Include(c => c.Difunto)
                .Include(c => c.Boveda)
                    .ThenInclude(b => b.Piso)
                        .ThenInclude(p => p.Bloque)
                .Where(c => c.Estado == true &&
                           c.Id != contratoActualId && // Excluir el contrato actual
                           c.ContratoRelacionadoId == null); // Solo contratos sin relación

            // Aplicar filtros
            if (!string.IsNullOrEmpty(numero))
            {
                query = query.Where(c => c.NumeroSecuencial.Contains(numero));
            }

            if (!string.IsNullOrEmpty(difunto))
            {
                query = query.Where(c => c.Difunto.Nombres.Contains(difunto) ||
                                        c.Difunto.Apellidos.Contains(difunto));
            }

            if (bovedaId.HasValue)
            {
                query = query.Where(c => c.BovedaId == bovedaId.Value);
            }

            var contratos = query
                .OrderByDescending(c => c.FechaCreacion)
                .Take(50) // Limitar resultados
                .Select(c => new
                {
                    id = c.Id,
                    numeroSecuencial = c.NumeroSecuencial,
                    difunto = new
                    {
                        nombres = c.Difunto.Nombres,
                        apellidos = c.Difunto.Apellidos
                    },
                    boveda = $"{c.Boveda.Piso.Bloque.Descripcion} - Piso {c.Boveda.Piso.NumeroPiso} - Bóveda {c.Boveda.Numero}",
                    fechaFin = c.FechaFin.ToString("dd/MM/yyyy")
                })
                .ToList();

            return Json(new
            {
                success = true,
                contratos = contratos
            });
        }

        // Método para relacionar dos contratos existentes
        [HttpPost]
        public async Task<IActionResult> RelacionarContratos([FromBody] RelacionarContratosRequest request)
        {
            try
            {
                var contrato1 = await _context.Contrato.FindAsync(request.ContratoId);
                var contrato2 = await _context.Contrato.FindAsync(request.ContratoRelacionadoId);

                if (contrato1 == null || contrato2 == null)
                {
                    return Json(new { success = false, message = "Uno o ambos contratos no fueron encontrados." });
                }

                // Verificar que ninguno ya tenga una relación
                if (contrato1.ContratoRelacionadoId != null || contrato2.ContratoRelacionadoId != null)
                {
                    return Json(new { success = false, message = "Uno de los contratos ya tiene una relación establecida." });
                }

                // Verificar que ambos contratos estén activos
                if (!contrato1.Estado || !contrato2.Estado)
                {
                    return Json(new { success = false, message = "Ambos contratos deben estar activos para poder relacionarlos." });
                }

                // Establecer la relación bidireccional
                contrato1.ContratoRelacionadoId = contrato2.Id;
                contrato2.ContratoRelacionadoId = contrato1.Id;

                await _context.SaveChangesAsync();

                return Json(new
                {
                    success = true,
                    message = $"Contratos {contrato1.NumeroSecuencial} y {contrato2.NumeroSecuencial} relacionados exitosamente."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al relacionar contratos");
                return Json(new { success = false, message = "Error interno del servidor." });
            }
        }

        // Método para remover la relación entre contratos (POST con form data)
        [HttpPost]
        public async Task<IActionResult> RemoverRelacionContratos(int contratoId)
        {
            try
            {
                _logger.LogInformation($"Intentando remover relación para contrato ID: {contratoId}");

                var contrato = await _context.Contrato.FindAsync(contratoId);
                if (contrato == null)
                {
                    _logger.LogWarning($"Contrato con ID {contratoId} no encontrado");
                    return Json(new { success = false, message = $"Contrato con ID {contratoId} no encontrado." });
                }

                _logger.LogInformation($"Contrato encontrado: {contrato.NumeroSecuencial}, ContratoRelacionadoId: {contrato.ContratoRelacionadoId}");

                if (contrato.ContratoRelacionadoId.HasValue)
                {
                    // Encontrar el contrato relacionado y remover la relación bidireccional
                    var contratoRelacionado = await _context.Contrato.FindAsync(contrato.ContratoRelacionadoId.Value);
                    if (contratoRelacionado != null)
                    {
                        contratoRelacionado.ContratoRelacionadoId = null;
                    }

                    contrato.ContratoRelacionadoId = null;
                    await _context.SaveChangesAsync();

                    return Json(new { success = true, message = "Relación removida exitosamente." });
                }

                return Json(new { success = false, message = "Este contrato no tiene ninguna relación establecida." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al remover relación entre contratos");
                return Json(new { success = false, message = "Error interno del servidor." });
            }
        }

        // Método alternativo para remover relación usando query parameters
        [HttpGet]
        public async Task<IActionResult> RemoverRelacion(int id)
        {
            return await RemoverRelacionContratos(id);
        }

        // Clase para el request de relacionar contratos
        public class RelacionarContratosRequest
        {
            public int ContratoId { get; set; }
            public int ContratoRelacionadoId { get; set; }
        }
    }
}
