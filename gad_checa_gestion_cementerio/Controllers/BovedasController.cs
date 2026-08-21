using gad_checa_gestion_cementerio.Areas.Identity.Data;
using gad_checa_gestion_cementerio.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Collections.Generic;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Models.Listas;
using gad_checa_gestion_cementerio.Controllers;
using gad_checa_gestion_cementerio.services;
using AutoMapper;

namespace WebApp.Controllers
{
    [Authorize]
    public class BovedasController : BaseController
    {
        private readonly ContratoService _contratoService;

        // Máximo de difuntos que puede alojar una bóveda (por contrato o asignados directamente)
        private const int MaximoDifuntosPorBoveda = 2;

        public BovedasController(ApplicationDbContext context, IMapper mapper, UserManager<ApplicationUser> userManager, ILogger<BovedasController> logger, ContratoService contratoService) : base(context, userManager, mapper, logger)
        {
            _contratoService = contratoService;
        }

        // GET: Bovedas
        public async Task<IActionResult> Index(string filtro, int? bloqueId, string tipo, bool? estado, bool? tienePropietario, int pagina = 1, int registrosPorPagina = 10)
        {
            ViewBag.Bloques = new SelectList(await _context.Bloque
                .Select(b => new { b.Id, b.Descripcion })
                .ToListAsync(), "Id", "Descripcion");
            ViewBag.Tipos = new SelectList(new[] { "Boveda", "Nicho" });
            ViewBag.Estados = new SelectList(new[] {
                new { Value = "true", Text = "Disponible" },
                new { Value = "false", Text = "Ocupada" }
            }, "Value", "Text");

            var query = _context.Boveda
                .Include(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
                .Include(b => b.Propietario)
                .Include(b => b.Contratos)
                .AsQueryable();

            // Aplicar filtros
            if (!string.IsNullOrEmpty(filtro))
            {
                query = query.Where(b =>
                    b.Numero.ToString().Contains(filtro) ||
                    b.NumeroSecuencial.Contains(filtro) ||
                    b.Piso.Bloque.Descripcion.Contains(filtro) ||
                    (b.Propietario != null &&
                        (b.Propietario.Nombres + " " + b.Propietario.Apellidos).Contains(filtro) ||
                        b.Propietario.NumeroIdentificacion.Contains(filtro))
                );
            }

            if (bloqueId.HasValue)
            {
                query = query.Where(b => b.Piso.BloqueId == bloqueId.Value);
            }

            if (!string.IsNullOrEmpty(tipo))
            {
                query = query.Where(b => b.Piso.Bloque.Tipo == tipo);
            }

            if (estado.HasValue)
            {
                var fechaActual = DateTime.Now;
                if (estado.Value)
                {
                    // Disponible: No tiene contratos activos ni difuntos asignados sin contrato
                    query = query.Where(b => !b.Contratos.Any(c =>
                        c.FechaInicio <= fechaActual &&
                        (c.FechaFin == null || c.FechaFin >= fechaActual)) &&
                        !b.Difuntos.Any(d => d.FechaEliminacion == null));
                }
                else
                {
                    // Ocupada: Tiene al menos un contrato activo o un difunto asignado sin contrato
                    query = query.Where(b => b.Contratos.Any(c =>
                        c.FechaInicio <= fechaActual &&
                        (c.FechaFin == null || c.FechaFin >= fechaActual)) ||
                        b.Difuntos.Any(d => d.FechaEliminacion == null));
                }
            }

            if (tienePropietario.HasValue)
            {
                if (tienePropietario.Value)
                {
                    query = query.Where(b => b.Propietario != null);
                }
                else
                {
                    query = query.Where(b => b.Propietario == null);
                }
            }

            // Obtener el total de resultados después de aplicar los filtros
            var totalResultados = await query.CountAsync();

            // Aplicar paginación
            var bovedas = await query
                .Skip((pagina - 1) * registrosPorPagina)
                .Take(registrosPorPagina)
                .Select(b => new BovedaModel
                {
                    Id = b.Id,
                    Numero = b.Numero,
                    NumeroSecuencial = b.NumeroSecuencial,
                    Estado = b.Contratos.Any(c =>
                        c.FechaInicio <= DateTime.Now &&
                        (c.FechaFin == null || c.FechaFin >= DateTime.Now)) ||
                        b.Difuntos.Any(d => d.FechaEliminacion == null),
                    Piso = _mapper.Map<PisoModel>(b.Piso),
                    Propietario = b.Propietario,
                    Contratos = b.Contratos,
                    Difuntos = b.Difuntos
                })
                .ToListAsync();

            var viewModel = new BovedaPaginadaViewModel
            {
                Bovedas = bovedas,
                PaginaActual = pagina,
                TotalPaginas = (int)Math.Ceiling(totalResultados / (double)registrosPorPagina),
                Filtro = filtro,
                TotalResultados = totalResultados
            };

            if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            {
                return PartialView("_ListaBovedas", viewModel);
            }

            return View(viewModel);
        }

        // GET: Bovedas/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var boveda = await _context.Boveda
                .Include(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
                .Include(b => b.Propietario)
                .Include(b => b.Contratos)
                    .ThenInclude(c => c.Difunto)
                        .ThenInclude(d => d.Descuento)
                .Include(b => b.Contratos)
                    .ThenInclude(c => c.Responsables)
                .Include(b => b.Contratos)
                    .ThenInclude(c => c.Cuotas)
                .Include(b => b.Difuntos)
                    .ThenInclude(d => d.Descuento)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (boveda == null)
            {
                return NotFound();
            }

            var bovedaModel = _mapper.Map<BovedaModel>(boveda);
            return View(bovedaModel);
        }

        // GET: Bovedas/Create
        public IActionResult Create()
        {
            return View();
        }

        // POST: Bovedas/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Id,Nombre,PisoId,Estado")] Boveda boveda)
        {
            if (ModelState.IsValid)
            {
                _context.Add(boveda);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(boveda);
        }

        // GET: Bovedas/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var boveda = await CargarBovedaParaEdicionAsync(id.Value);

            if (boveda == null)
            {
                return NotFound();
            }

            await CargarViewBagEdicionAsync(boveda);

            return View(boveda);
        }

        private Task<Boveda?> CargarBovedaParaEdicionAsync(int id)
        {
            return _context.Boveda
                .Include(b => b.Propietario)
                .Include(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
                .Include(b => b.Contratos)
                    .ThenInclude(c => c.Difunto)
                .Include(b => b.Difuntos)
                .FirstOrDefaultAsync(b => b.Id == id);
        }

        private async Task CargarViewBagEdicionAsync(Boveda boveda)
        {
            ViewBag.BloqueNombre = boveda.Piso?.Bloque?.Descripcion;
            ViewBag.PisoNumero = boveda.Piso?.NumeroPiso;
            ViewBag.Precio = boveda.Piso?.Precio.ToString("N2");
            ViewBag.DescuentoId = new SelectList(await _context.Descuento.Where(d => d.Estado).ToListAsync(), "Id", "Descripcion");
            ViewBag.ContratosBoveda = boveda.Contratos?
                .Where(c => c.FechaEliminacion == null)
                .OrderByDescending(c => c.FechaInicio)
                .ToList() ?? new List<Contrato>();
            ViewBag.DifuntosBoveda = boveda.Difuntos?
                .Where(d => d.FechaEliminacion == null)
                .OrderBy(d => d.Apellidos)
                .ThenBy(d => d.Nombres)
                .ToList() ?? new List<Difunto>();
        }

        // POST: Bovedas/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,NumeroSecuencial,PropietarioId")] Boveda boveda)
        {
            if (id != boveda.Id)
            {
                return NotFound();
            }

            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = string.Join("; ", ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage));
                    TempData["Error"] = $"Errores de validación: {errors}";

                    var bovedaParaView = await CargarBovedaParaEdicionAsync(id);
                    if (bovedaParaView == null)
                    {
                        return NotFound();
                    }

                    await CargarViewBagEdicionAsync(bovedaParaView);

                    return View(boveda);
                }

                var bovedaOriginal = await _context.Boveda
                    .Include(b => b.Piso)
                        .ThenInclude(p => p.Bloque)
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (bovedaOriginal == null)
                {
                    TempData["Error"] = "No se encontró la bóveda a actualizar";
                    return NotFound();
                }

                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                {
                    TempData["Error"] = "No se pudo obtener el usuario actual";
                    return View(boveda);
                }

                // Actualizar solo los campos necesarios
                bovedaOriginal.NumeroSecuencial = boveda.NumeroSecuencial;
                bovedaOriginal.PropietarioId = boveda.PropietarioId;
                bovedaOriginal.FechaActualizacion = DateTime.Now;
                bovedaOriginal.UsuarioActualizador = user;

                _context.Update(bovedaOriginal);
                await _context.SaveChangesAsync();

                TempData["Success"] = "Bóveda actualizada exitosamente";
                return RedirectToAction(nameof(Index));
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BovedaExists(boveda.Id))
                {
                    TempData["Error"] = "La bóveda ya no existe en la base de datos";
                    return NotFound();
                }
                else
                {
                    TempData["Error"] = "Error de concurrencia al actualizar la bóveda";
                    throw;
                }
            }
            catch (Exception ex)
            {
                TempData["Error"] = $"Error al actualizar la bóveda: {ex.Message}";
                if (ex.InnerException != null)
                {
                    TempData["Error"] += $" Detalles: {ex.InnerException.Message}";
                }

                var bovedaParaView = await CargarBovedaParaEdicionAsync(id);
                if (bovedaParaView == null)
                {
                    return NotFound();
                }

                await CargarViewBagEdicionAsync(bovedaParaView);

                return View(boveda);
            }
        }

        [HttpGet]
        public async Task<IActionResult> BuscarDifuntos(string searchTerm, bool soloLibres = false)
        {
            if (string.IsNullOrWhiteSpace(searchTerm) || searchTerm.Trim().Length < 3)
            {
                return Json(new List<object>());
            }

            var termino = searchTerm.Trim();
            var query = _context.Difunto.AsQueryable();

            if (soloLibres)
            {
                // Solo difuntos que no están en una bóveda ni en un contrato vigente
                query = query.Where(d => d.BovedaId == null &&
                    !_context.Contrato.Any(c => c.DifuntoId == d.Id && c.FechaEliminacion == null));
            }

            var difuntos = await query
                .Where(d => d.FechaEliminacion == null &&
                    (d.NumeroIdentificacion.Contains(termino) ||
                     (d.Nombres + " " + d.Apellidos).Contains(termino)))
                .OrderBy(d => d.Apellidos)
                .ThenBy(d => d.Nombres)
                .Take(10)
                .Select(d => new
                {
                    d.Id,
                    d.Nombres,
                    d.Apellidos,
                    d.NumeroIdentificacion,
                    d.FechaFallecimiento
                })
                .ToListAsync();

            return Json(difuntos);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CambiarDifuntoContrato(int bovedaId, int contratoId, int difuntoId)
        {
            var contrato = await _context.Contrato
                .Include(c => c.Boveda)
                .FirstOrDefaultAsync(c => c.Id == contratoId && c.BovedaId == bovedaId && c.FechaEliminacion == null);

            if (contrato == null)
            {
                TempData["Error"] = "No se encontró el contrato asociado a esta bóveda.";
                return RedirectToAction(nameof(Edit), new { id = bovedaId });
            }

            var difunto = await _context.Difunto
                .FirstOrDefaultAsync(d => d.Id == difuntoId && d.FechaEliminacion == null);

            if (difunto == null)
            {
                TempData["Error"] = "No se encontró el difunto seleccionado.";
                return RedirectToAction(nameof(Edit), new { id = bovedaId });
            }

            var user = await _userManager.GetUserAsync(User);
            contrato.DifuntoId = difunto.Id;
            contrato.FechaActualizacion = DateTime.Now;
            contrato.UsuarioActualizador = user;

            await _context.SaveChangesAsync();

            TempData["Success"] = $"Difunto actualizado en el contrato {contrato.NumeroSecuencial}.";
            return RedirectToAction(nameof(Edit), new { id = bovedaId });
        }

        // Registra un difunto nuevo directamente en la bóveda, sin contrato.
        // Aplica a bóvedas con propietario, donde no se genera contrato.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AgregarDifuntoBoveda(int bovedaId, DifuntoModel difunto)
        {
            var boveda = await _context.Boveda
                .FirstOrDefaultAsync(b => b.Id == bovedaId && b.FechaEliminacion == null);

            if (boveda == null)
            {
                TempData["Error"] = "No se encontró la bóveda seleccionada.";
                return RedirectToAction(nameof(Index));
            }

            if (!boveda.PropietarioId.HasValue)
            {
                TempData["Error"] = "Solo se puede registrar un difunto sin contrato en bóvedas con propietario.";
                return RedirectToAction(nameof(Edit), new { id = bovedaId });
            }

            if (await ContarOcupacionBovedaAsync(bovedaId) >= MaximoDifuntosPorBoveda)
            {
                TempData["Error"] = $"Esta bóveda ya tiene el máximo de difuntos permitidos ({MaximoDifuntosPorBoveda}).";
                return RedirectToAction(nameof(Edit), new { id = bovedaId });
            }

            ValidarFechasDifunto(difunto);
            if (!ModelState.IsValid)
            {
                TempData["Error"] = string.Join(" ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return RedirectToAction(nameof(Edit), new { id = bovedaId });
            }

            // No se valida que la identificación sea única: el catastro migrado usa
            // una cédula de relleno (9999999999) para los difuntos sin documento
            // conocido, así que la repetición es lo normal y no un error.
            var identificacion = difunto.NumeroIdentificacion.Trim();

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                TempData["Error"] = "No se pudo obtener el usuario actual.";
                return RedirectToAction(nameof(Edit), new { id = bovedaId });
            }

            var ahora = DateTime.Now;
            var nuevoDifunto = new Difunto
            {
                NumeroIdentificacion = identificacion,
                Nombres = difunto.Nombres.Trim(),
                Apellidos = difunto.Apellidos.Trim(),
                FechaNacimiento = difunto.FechaNacimiento,
                FechaFallecimiento = difunto.FechaFallecimiento,
                DescuentoId = difunto.DescuentoId,
                BovedaId = bovedaId,
                Estado = true,
                UsuarioCreadorId = user.Id,
                UsuarioActualizadorId = user.Id,
                FechaCreacion = ahora,
                FechaActualizacion = ahora
            };

            _context.Difunto.Add(nuevoDifunto);
            await _context.SaveChangesAsync();

            TempData["Success"] = $"Difunto {nuevoDifunto.Nombres} {nuevoDifunto.Apellidos} registrado en la bóveda.";
            return RedirectToAction(nameof(Edit), new { id = bovedaId });
        }

        // Asigna un difunto ya registrado a la bóveda. Si se envía difuntoActualId,
        // reemplaza a ese difunto en lugar de ocupar un espacio nuevo.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AsignarDifuntoBoveda(int bovedaId, int difuntoId, int? difuntoActualId)
        {
            var boveda = await _context.Boveda
                .FirstOrDefaultAsync(b => b.Id == bovedaId && b.FechaEliminacion == null);

            if (boveda == null)
            {
                TempData["Error"] = "No se encontró la bóveda seleccionada.";
                return RedirectToAction(nameof(Index));
            }

            if (!boveda.PropietarioId.HasValue)
            {
                TempData["Error"] = "Solo se puede asignar un difunto sin contrato en bóvedas con propietario.";
                return RedirectToAction(nameof(Edit), new { id = bovedaId });
            }

            var difunto = await _context.Difunto
                .FirstOrDefaultAsync(d => d.Id == difuntoId && d.FechaEliminacion == null);

            if (difunto == null)
            {
                TempData["Error"] = "No se encontró el difunto seleccionado.";
                return RedirectToAction(nameof(Edit), new { id = bovedaId });
            }

            if (difunto.BovedaId == bovedaId)
            {
                TempData["Error"] = "El difunto seleccionado ya está asignado a esta bóveda.";
                return RedirectToAction(nameof(Edit), new { id = bovedaId });
            }

            if (difunto.BovedaId.HasValue)
            {
                TempData["Error"] = "El difunto seleccionado ya está asignado a otra bóveda.";
                return RedirectToAction(nameof(Edit), new { id = bovedaId });
            }

            var tieneContrato = await _context.Contrato
                .AnyAsync(c => c.DifuntoId == difuntoId && c.FechaEliminacion == null);

            if (tieneContrato)
            {
                TempData["Error"] = "El difunto seleccionado ya está registrado en un contrato.";
                return RedirectToAction(nameof(Edit), new { id = bovedaId });
            }

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                TempData["Error"] = "No se pudo obtener el usuario actual.";
                return RedirectToAction(nameof(Edit), new { id = bovedaId });
            }

            var ahora = DateTime.Now;

            if (difuntoActualId.HasValue)
            {
                var difuntoActual = await _context.Difunto
                    .FirstOrDefaultAsync(d => d.Id == difuntoActualId.Value && d.BovedaId == bovedaId && d.FechaEliminacion == null);

                if (difuntoActual == null)
                {
                    TempData["Error"] = "No se encontró el difunto que se desea reemplazar en esta bóveda.";
                    return RedirectToAction(nameof(Edit), new { id = bovedaId });
                }

                difuntoActual.BovedaId = null;
                difuntoActual.UsuarioActualizadorId = user.Id;
                difuntoActual.FechaActualizacion = ahora;
            }
            else if (await ContarOcupacionBovedaAsync(bovedaId) >= MaximoDifuntosPorBoveda)
            {
                TempData["Error"] = $"Esta bóveda ya tiene el máximo de difuntos permitidos ({MaximoDifuntosPorBoveda}).";
                return RedirectToAction(nameof(Edit), new { id = bovedaId });
            }

            difunto.BovedaId = bovedaId;
            difunto.UsuarioActualizadorId = user.Id;
            difunto.FechaActualizacion = ahora;

            await _context.SaveChangesAsync();

            TempData["Success"] = difuntoActualId.HasValue
                ? $"Difunto de la bóveda cambiado a {difunto.Nombres} {difunto.Apellidos}."
                : $"Difunto {difunto.Nombres} {difunto.Apellidos} asignado a la bóveda.";
            return RedirectToAction(nameof(Edit), new { id = bovedaId });
        }

        // Crea un difunto nuevo y lo pone en el lugar de otro en un solo paso.
        // Con contratoId reemplaza al difunto de ese contrato; con difuntoActualId
        // reemplaza a un difunto asignado sin contrato.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ReemplazarDifuntoConNuevo(int bovedaId, int? contratoId, int? difuntoActualId, DifuntoModel difunto)
        {
            var boveda = await _context.Boveda
                .FirstOrDefaultAsync(b => b.Id == bovedaId && b.FechaEliminacion == null);

            if (boveda == null)
            {
                TempData["Error"] = "No se encontró la bóveda seleccionada.";
                return RedirectToAction(nameof(Index));
            }

            if (!contratoId.HasValue && !difuntoActualId.HasValue)
            {
                TempData["Error"] = "No se indicó a qué difunto reemplazar.";
                return RedirectToAction(nameof(Edit), new { id = bovedaId });
            }

            Contrato? contrato = null;
            Difunto? difuntoActual = null;

            if (contratoId.HasValue)
            {
                contrato = await _context.Contrato
                    .FirstOrDefaultAsync(c => c.Id == contratoId.Value && c.BovedaId == bovedaId && c.FechaEliminacion == null);

                if (contrato == null)
                {
                    TempData["Error"] = "No se encontró el contrato asociado a esta bóveda.";
                    return RedirectToAction(nameof(Edit), new { id = bovedaId });
                }
            }
            else
            {
                difuntoActual = await _context.Difunto
                    .FirstOrDefaultAsync(d => d.Id == difuntoActualId!.Value && d.BovedaId == bovedaId && d.FechaEliminacion == null);

                if (difuntoActual == null)
                {
                    TempData["Error"] = "No se encontró el difunto que se desea reemplazar en esta bóveda.";
                    return RedirectToAction(nameof(Edit), new { id = bovedaId });
                }
            }

            ValidarFechasDifunto(difunto);
            if (!ModelState.IsValid)
            {
                TempData["Error"] = string.Join(" ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return RedirectToAction(nameof(Edit), new { id = bovedaId });
            }

            // Ver nota en AgregarDifuntoBoveda: la identificación puede repetirse
            var identificacion = difunto.NumeroIdentificacion.Trim();

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                TempData["Error"] = "No se pudo obtener el usuario actual.";
                return RedirectToAction(nameof(Edit), new { id = bovedaId });
            }

            var ahora = DateTime.Now;
            var nuevoDifunto = new Difunto
            {
                NumeroIdentificacion = identificacion,
                Nombres = difunto.Nombres.Trim(),
                Apellidos = difunto.Apellidos.Trim(),
                FechaNacimiento = difunto.FechaNacimiento,
                FechaFallecimiento = difunto.FechaFallecimiento,
                DescuentoId = difunto.DescuentoId,
                // Solo ocupa la bóveda directamente cuando reemplaza a un difunto sin contrato
                BovedaId = contrato == null ? bovedaId : null,
                Estado = true,
                UsuarioCreadorId = user.Id,
                UsuarioActualizadorId = user.Id,
                FechaCreacion = ahora,
                FechaActualizacion = ahora
            };

            _context.Difunto.Add(nuevoDifunto);
            await _context.SaveChangesAsync();

            if (contrato != null)
            {
                contrato.DifuntoId = nuevoDifunto.Id;
                contrato.UsuarioActualizadorId = user.Id;
                contrato.FechaActualizacion = ahora;
            }
            else
            {
                // El anterior queda libre, no se elimina
                difuntoActual!.BovedaId = null;
                difuntoActual.UsuarioActualizadorId = user.Id;
                difuntoActual.FechaActualizacion = ahora;
            }

            await _context.SaveChangesAsync();

            TempData["Success"] = $"Difunto {nuevoDifunto.Nombres} {nuevoDifunto.Apellidos} registrado y asignado en la bóveda.";
            return RedirectToAction(nameof(Edit), new { id = bovedaId });
        }

        // Quita el difunto de la bóveda sin eliminar su registro.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> QuitarDifuntoBoveda(int bovedaId, int difuntoId)
        {
            var difunto = await _context.Difunto
                .FirstOrDefaultAsync(d => d.Id == difuntoId && d.BovedaId == bovedaId && d.FechaEliminacion == null);

            if (difunto == null)
            {
                TempData["Error"] = "No se encontró el difunto asignado a esta bóveda.";
                return RedirectToAction(nameof(Edit), new { id = bovedaId });
            }

            var user = await _userManager.GetUserAsync(User);
            difunto.BovedaId = null;
            difunto.UsuarioActualizadorId = user?.Id;
            difunto.FechaActualizacion = DateTime.Now;

            await _context.SaveChangesAsync();

            TempData["Success"] = $"Difunto {difunto.Nombres} {difunto.Apellidos} retirado de la bóveda.";
            return RedirectToAction(nameof(Edit), new { id = bovedaId });
        }

        // Ocupación actual: contratos vigentes + difuntos asignados sin contrato
        private async Task<int> ContarOcupacionBovedaAsync(int bovedaId)
        {
            var contratosActivos = await _context.Contrato
                .CountAsync(c => c.BovedaId == bovedaId && c.Estado && c.FechaFin >= DateTime.Today && c.FechaEliminacion == null);

            var difuntosSinContrato = await _context.Difunto
                .CountAsync(d => d.BovedaId == bovedaId && d.FechaEliminacion == null);

            return contratosActivos + difuntosSinContrato;
        }

        // GET: Bovedas/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var boveda = await _context.Boveda
                .Include(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
                .Include(b => b.Propietario)
                .Include(b => b.Contratos)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (boveda == null)
            {
                return NotFound();
            }

            var bovedaModel = _mapper.Map<BovedaModel>(boveda);
            return View(bovedaModel);
        }

        // POST: Bovedas/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var boveda = await _context.Boveda
                .FirstOrDefaultAsync(b => b.Id == id);

            if (boveda == null)
            {
                return NotFound();
            }

            // Verificar si la bóveda tiene contratos asociados
            var tieneContratos = await _context.Contrato
                .AnyAsync(c => c.BovedaId == boveda.Id && c.FechaEliminacion == null);

            if (tieneContratos)
            {
                TempData["Error"] = "No se puede eliminar la bóveda porque tiene contratos asociados.";
                return RedirectToAction(nameof(Index));
            }

            var user = await _userManager.GetUserAsync(User);
            boveda.FechaEliminacion = DateTime.Now;
            boveda.UsuarioEliminador = user;
            boveda.Estado = false;

            await _context.SaveChangesAsync();
            TempData["Success"] = "Bóveda eliminada exitosamente";
            return RedirectToAction(nameof(Index));
        }

        private bool BovedaExists(int id)
        {
            return _context.Boveda.Any(e => e.Id == id);
        }

        // Método para obtener bóvedas para el modal de relacionar contratos
        [HttpGet]
        public IActionResult GetBovedas()
        {
            var bovedas = _context.Boveda
                .Include(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
                .Where(b => b.Estado == true)
                .Select(b => new
                {
                    id = b.Id,
                    numero = b.Numero,
                    bloque = b.Piso.Bloque.Descripcion,
                    piso = b.Piso.NumeroPiso
                })
                .OrderBy(b => b.bloque)
                .ThenBy(b => b.piso)
                .ThenBy(b => b.numero)
                .ToList();

            return Json(new
            {
                success = true,
                bovedas = bovedas
            });
        }

        private void ValidarFechasDifunto(DifuntoModel difunto)
        {
            if (difunto.FechaNacimiento.HasValue && difunto.FechaNacimiento.Value > DateTime.Now)
            {
                ModelState.AddModelError(nameof(difunto.FechaNacimiento), "La fecha de nacimiento no puede ser una fecha futura.");
            }

            if (difunto.FechaFallecimiento.HasValue && difunto.FechaFallecimiento.Value > DateTime.Now)
            {
                ModelState.AddModelError(nameof(difunto.FechaFallecimiento), "La fecha de fallecimiento no puede ser una fecha futura.");
            }

            if (difunto.FechaNacimiento.HasValue && difunto.FechaFallecimiento.HasValue &&
                difunto.FechaFallecimiento.Value <= difunto.FechaNacimiento.Value)
            {
                ModelState.AddModelError(nameof(difunto.FechaFallecimiento), "La fecha de fallecimiento debe ser posterior a la fecha de nacimiento.");
            }

            if (difunto.FechaFallecimiento.HasValue && difunto.FechaFallecimiento.Value < DateTime.Now.AddYears(-100))
            {
                ModelState.AddModelError(nameof(difunto.FechaFallecimiento), "La fecha de fallecimiento no puede ser anterior a 100 años.");
            }
        }
    }
}
