using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Utils;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using gad_checa_gestion_cementerio.Areas.Identity.Data;
using gad_checa_gestion_cementerio.Models.Views;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.Extensions.Logging;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Models.Listas;

namespace gad_checa_gestion_cementerio.Controllers
{
    [Authorize]
    public class BloquesController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<BloquesController> _logger;

        public BloquesController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<BloquesController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        // GET: Bloques
        public async Task<IActionResult> Index(string filtro, int pagina = 1, int registrosPorPagina = 10)
        {
            var query = _context.Bloque
                .Include(b => b.Cementerio)
                .Where(b => b.FechaEliminacion == null)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filtro))
            {
                query = query.Where(b =>
                    b.Descripcion.Contains(filtro) ||
                    b.Tipo.Contains(filtro) ||
                    b.CalleA.Contains(filtro) ||
                    b.CalleB.Contains(filtro));
            }

            var total = await query.CountAsync();
            var bloques = await query
                .Skip((pagina - 1) * registrosPorPagina)
                .Take(registrosPorPagina)
                .Select(b => new BloqueModel
                {
                    Id = b.Id,
                    Descripcion = b.Descripcion,
                    Tipo = b.Tipo,
                    CalleA = b.CalleA,
                    CalleB = b.CalleB,
                    NumeroDePisos = b.NumeroDePisos,
                    BovedasPorPiso = b.BovedasPorPiso,
                    TarifaBase = b.TarifaBase
                })
                .ToListAsync();

            var viewModel = new BloquePaginadaViewModel
            {
                Bloque = bloques,
                PaginaActual = pagina,
                TotalPaginas = (int)Math.Ceiling(total / (double)registrosPorPagina),
                Filtro = filtro,
                TotalResultados = total
            };

            if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            {
                return PartialView("_ListaBloques", viewModel);
            }

            return View(viewModel);
        }

        // GET: Bloques/Create
        public IActionResult Create()
        {
            ViewBag.Cementerios = _context.Cementerio.Where(c => c.FechaEliminacion == null).ToList();
            var model = new BloqueViewModel();

            // Establecer tarifa base por defecto desde el cementerio
            var cementerio = _context.Cementerio.FirstOrDefault(c => c.FechaEliminacion == null);
            if (cementerio != null && cementerio.tarifa_arriendo.HasValue)
            {
                model.TarifaBase = cementerio.tarifa_arriendo.Value;
            }

            return View(model);
        }

        // POST: Bloques/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(BloqueViewModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = string.Join("; ", ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage));
                    TempData["Error"] = $"Errores de validación: {errors}";
                    ViewBag.Cementerios = _context.Cementerio.Where(c => c.FechaEliminacion == null).ToList();
                    return View(model);
                }

                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                {
                    TempData["Error"] = "No se pudo obtener el usuario actual";
                    ViewBag.Cementerios = _context.Cementerio.Where(c => c.FechaEliminacion == null).ToList();
                    return View(model);
                }

                var bloque = new Bloque
                {
                    Descripcion = model.Descripcion,
                    CalleA = model.CalleA,
                    CalleB = model.CalleB,
                    Tipo = model.Tipo,
                    NumeroDePisos = model.NumeroDePisos,
                    BovedasPorPiso = model.BovedasPorPiso,
                    TarifaBase = model.TarifaBase,
                    CementerioId = model.CementerioId,
                    Estado = true,
                    FechaCreacion = DateTime.Now,
                    UsuarioCreadorId = user.Id
                };

                _context.Bloque.Add(bloque);
                await _context.SaveChangesAsync();

                // Crear pisos y bóvedas
                for (int piso = 1; piso <= model.NumeroDePisos; piso++)
                {
                    var precioPiso = model.PreciosPorPiso
                        .FirstOrDefault(p => p.NumeroPiso == piso)?.PrecioPersonalizado
                        ?? model.TarifaBase;

                    var pisoEntity = new Piso
                    {
                        NumeroPiso = piso,
                        Precio = precioPiso,
                        BloqueId = bloque.Id
                    };
                    _context.Piso.Add(pisoEntity);
                    await _context.SaveChangesAsync();

                    // Crear bóvedas para este piso
                    for (int boveda = 1; boveda <= model.BovedasPorPiso; boveda++)
                    {
                        var bovedaEntity = new Boveda
                        {
                            Numero = boveda,
                            PisoId = pisoEntity.Id,
                            Estado = true,
                            FechaCreacion = DateTime.Now,
                            UsuarioCreadorId = user.Id
                        };
                        _context.Boveda.Add(bovedaEntity);
                    }
                    await _context.SaveChangesAsync();
                }

                TempData["Success"] = "Bloque creado exitosamente";
                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                TempData["Error"] = $"Error al crear el bloque: {ex.Message}";
                if (ex.InnerException != null)
                {
                    TempData["Error"] += $" Detalles: {ex.InnerException.Message}";
                }
                ViewBag.Cementerios = _context.Cementerio.Where(c => c.FechaEliminacion == null).ToList();
                return View(model);
            }
        }

        // GET: Bloques/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var bloque = await _context.Bloque
                .Include(b => b.Pisos)
                    .ThenInclude(p => p.Bovedas)
                .FirstOrDefaultAsync(b => b.Id == id && b.FechaEliminacion == null);

            if (bloque == null)
            {
                return NotFound();
            }

            var model = new BloqueViewModel
            {
                Id = bloque.Id,
                Descripcion = bloque.Descripcion,
                CalleA = bloque.CalleA,
                CalleB = bloque.CalleB,
                Tipo = bloque.Tipo,
                NumeroDePisos = bloque.NumeroDePisos,
                BovedasPorPiso = bloque.BovedasPorPiso,
                TarifaBase = bloque.TarifaBase,
                CementerioId = bloque.CementerioId,
                PreciosPorPiso = bloque.Pisos.Select(p => new PisoPrecioViewModel
                {
                    NumeroPiso = p.NumeroPiso,
                    PrecioPersonalizado = p.Precio,
                    UsarTarifaBase = p.Precio == bloque.TarifaBase
                }).ToList()
            };

            ViewBag.Cementerios = _context.Cementerio.Where(c => c.FechaEliminacion == null).ToList();
            return View(model);
        }

        // POST: Bloques/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, BloqueViewModel model)
        {
            if (id != model.Id)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    var user = await _userManager.GetUserAsync(User);
                    var bloque = await _context.Bloque
                        .Include(b => b.Pisos)
                            .ThenInclude(p => p.Bovedas)
                        .FirstOrDefaultAsync(b => b.Id == id && b.FechaEliminacion == null);

                    if (bloque == null)
                    {
                        return NotFound();
                    }

                    // Verificar si se está reduciendo el número de pisos
                    if (model.NumeroDePisos < bloque.NumeroDePisos)
                    {
                        // Obtener los pisos que se eliminarían
                        var pisosAEliminar = bloque.Pisos
                            .Where(p => p.NumeroPiso > model.NumeroDePisos)
                            .ToList();

                        // Verificar si alguno de estos pisos tiene bóvedas con contratos
                        foreach (var piso in pisosAEliminar)
                        {
                            var tieneContratos = await _context.Contrato
                                .AnyAsync(c => c.BovedaId != 0 &&
                                             c.Boveda.PisoId == piso.Id &&
                                             c.FechaEliminacion == null);

                            if (tieneContratos)
                            {
                                ModelState.AddModelError("", $"No se puede reducir el número de pisos porque el piso {piso.NumeroPiso} tiene bóvedas con contratos asociados.");
                                ViewBag.Cementerios = _context.Cementerio.Where(c => c.FechaEliminacion == null).ToList();
                                return View(model);
                            }
                        }
                    }

                    // Actualizar datos básicos del bloque
                    bloque.Descripcion = model.Descripcion;
                    bloque.CalleA = model.CalleA;
                    bloque.CalleB = model.CalleB;
                    bloque.Tipo = model.Tipo;
                    bloque.TarifaBase = model.TarifaBase;
                    bloque.CementerioId = model.CementerioId;
                    bloque.FechaActualizacion = DateTime.Now;
                    bloque.UsuarioActualizadorId = user.Id;

                    // Manejar cambios en el número de pisos
                    if (model.NumeroDePisos > bloque.NumeroDePisos)
                    {
                        // Agregar nuevos pisos
                        for (int piso = bloque.NumeroDePisos + 1; piso <= model.NumeroDePisos; piso++)
                        {
                            var precioPiso = model.PreciosPorPiso
                                .FirstOrDefault(p => p.NumeroPiso == piso)?.PrecioPersonalizado
                                ?? model.TarifaBase;

                            var pisoEntity = new Piso
                            {
                                NumeroPiso = piso,
                                Precio = precioPiso,
                                BloqueId = bloque.Id
                            };
                            _context.Piso.Add(pisoEntity);
                            await _context.SaveChangesAsync();

                            // Crear bóvedas para el nuevo piso
                            for (int boveda = 1; boveda <= model.BovedasPorPiso; boveda++)
                            {
                                var bovedaEntity = new Boveda
                                {
                                    Numero = boveda,
                                    PisoId = pisoEntity.Id,
                                    Estado = true,
                                    FechaCreacion = DateTime.Now,
                                    UsuarioCreadorId = user.Id
                                };
                                _context.Boveda.Add(bovedaEntity);
                            }
                        }
                    }
                    else if (model.NumeroDePisos < bloque.NumeroDePisos)
                    {
                        // Eliminar pisos excedentes
                        var pisosAEliminar = bloque.Pisos
                            .Where(p => p.NumeroPiso > model.NumeroDePisos)
                            .ToList();

                        foreach (var piso in pisosAEliminar)
                        {
                            // Marcar bóvedas como eliminadas
                            foreach (var boveda in piso.Bovedas)
                            {
                                boveda.FechaEliminacion = DateTime.Now;
                                boveda.UsuarioEliminador = user;
                                boveda.Estado = false;
                            }
                        }
                    }

                    // Actualizar precios de pisos existentes
                    foreach (var pisoPrecio in model.PreciosPorPiso.Where(p => p.NumeroPiso <= bloque.NumeroDePisos))
                    {
                        var piso = bloque.Pisos.FirstOrDefault(p => p.NumeroPiso == pisoPrecio.NumeroPiso);
                        if (piso != null)
                        {
                            piso.Precio = pisoPrecio.UsarTarifaBase ? model.TarifaBase : pisoPrecio.PrecioPersonalizado.Value;
                        }
                    }

                    await _context.SaveChangesAsync();
                    TempData["Success"] = "Bloque actualizado exitosamente";
                    return RedirectToAction(nameof(Index));
                }
                catch (Exception ex)
                {
                    ModelState.AddModelError("", $"Error al actualizar el bloque: {ex.Message}");
                    if (ex.InnerException != null)
                    {
                        ModelState.AddModelError("", $"Detalles: {ex.InnerException.Message}");
                    }
                }
            }

            ViewBag.Cementerios = _context.Cementerio.Where(c => c.FechaEliminacion == null).ToList();
            return View(model);
        }

        // GET: Bloque/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var bloque = await _context.Bloque
                .Include(b => b.Cementerio)
                .Include(b => b.Pisos)
                    .ThenInclude(p => p.Bovedas)
                        .ThenInclude(b => b.Contratos)
                .Include(b => b.Pisos)
                    .ThenInclude(p => p.Bovedas)
                        .ThenInclude(b => b.Propietario)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (bloque == null)
            {
                return NotFound();
            }

            var viewModel = new BloqueViewModel
            {
                Id = bloque.Id,
                Descripcion = bloque.Descripcion,
                CalleA = bloque.CalleA,
                CalleB = bloque.CalleB,
                Tipo = bloque.Tipo,
                NumeroDePisos = bloque.NumeroDePisos,
                BovedasPorPiso = bloque.BovedasPorPiso,
                TarifaBase = bloque.TarifaBase,
                CementerioId = bloque.CementerioId,
                PreciosPorPiso = bloque.Pisos.Select(p => new PisoPrecioViewModel
                {
                    NumeroPiso = p.NumeroPiso,
                    PrecioPersonalizado = p.Precio,
                    UsarTarifaBase = p.Precio == bloque.TarifaBase
                }).ToList(),
                Bovedas = bloque.Pisos
                    .SelectMany(p => p.Bovedas.Select(b => new BovedaInfo
                    {
                        Numero = b.Numero,
                        NumeroSecuencial = b.NumeroSecuecial,
                        NumeroPiso = p.NumeroPiso,
                        TieneContratoActivo = b.Contratos.Any(c =>
                            c.FechaInicio <= DateTime.Now &&
                            (c.FechaFin == null || c.FechaFin >= DateTime.Now)),
                        TienePropietario = b.Propietario != null,
                        FechaFinContrato = b.Contratos
                            .Where(c => c.FechaInicio <= DateTime.Now &&
                                      (c.FechaFin == null || c.FechaFin >= DateTime.Now))
                            .Select(c => c.FechaFin)
                            .FirstOrDefault()
                    })).ToList()
            };

            ViewBag.CementerioNombre = bloque.Cementerio?.Nombre;
            return View(viewModel);
        }

        // GET: Bloque/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var bloque = await _context.Bloque
                .Include(b => b.Cementerio)
                .Include(b => b.Pisos)
                    .ThenInclude(p => p.Bovedas)
                        .ThenInclude(b => b.Contratos)
                .Include(b => b.Pisos)
                    .ThenInclude(p => p.Bovedas)
                        .ThenInclude(b => b.Propietario)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (bloque == null)
            {
                return NotFound();
            }

            var viewModel = new BloqueViewModel
            {
                Id = bloque.Id,
                Descripcion = bloque.Descripcion,
                CalleA = bloque.CalleA,
                CalleB = bloque.CalleB,
                Tipo = bloque.Tipo,
                NumeroDePisos = bloque.NumeroDePisos,
                BovedasPorPiso = bloque.BovedasPorPiso,
                TarifaBase = bloque.TarifaBase,
                CementerioId = bloque.CementerioId,
                Cementerio = bloque.Cementerio,
                Bovedas = bloque.Pisos
                    .SelectMany(p => p.Bovedas.Select(b => new BovedaInfo
                    {
                        Numero = b.Numero,
                        NumeroPiso = p.NumeroPiso,
                        TieneContratoActivo = b.Contratos.Any(c =>
                            c.FechaInicio <= DateTime.Now &&
                            (c.FechaFin == null || c.FechaFin >= DateTime.Now)),
                        TienePropietario = b.Propietario != null,
                        Propietario = b.Propietario != null ? new PersonaModel
                        {
                            Id = b.Propietario.Id,
                            Nombres = b.Propietario.Nombres,
                            Apellidos = b.Propietario.Apellidos
                        } : null
                    })).ToList()
            };

            return View(viewModel);
        }

        // POST: Bloque/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var bloque = await _context.Bloque
                .Include(b => b.Pisos)
                    .ThenInclude(p => p.Bovedas)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bloque != null)
            {
                // Eliminar bóvedas
                foreach (var piso in bloque.Pisos)
                {
                    _context.Boveda.RemoveRange(piso.Bovedas);
                }

                // Eliminar pisos
                _context.Piso.RemoveRange(bloque.Pisos);

                // Eliminar bloque
                _context.Bloque.Remove(bloque);
                await _context.SaveChangesAsync();
            }

            return RedirectToAction(nameof(Index));
        }

        private bool BloqueExists(int id)
        {
            return _context.Bloque.Any(e => e.Id == id);
        }
    }
}
