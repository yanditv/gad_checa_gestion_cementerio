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
using AutoMapper;

namespace WebApp.Controllers
{
    [Authorize]
    public class BovedasController : BaseController
    {
        public BovedasController(ApplicationDbContext context, IMapper mapper, UserManager<ApplicationUser> userManager, ILogger<BovedasController> logger) : base(context, userManager, mapper, logger)
        {
        }

        // GET: Bovedas
        public async Task<IActionResult> Index(string filtro, int? bloqueId, string tipo, bool? estado, bool? tienePropietario, int pagina = 1, int registrosPorPagina = 10)
        {
            // 1. Cargar select lists para los filtros
            ViewBag.Bloques = new SelectList(await _context.Bloque
                .Select(b => new { b.Id, b.Descripcion })
                .ToListAsync(), "Id", "Descripcion");

            ViewBag.Tipos = new SelectList(new[] { "Boveda", "Nicho" });

            ViewBag.Estados = new SelectList(new[] {
        new { Value = "true", Text = "Disponible" },
        new { Value = "false", Text = "Ocupada" }
    }, "Value", "Text");

            // 2. Query base con los Includes necesarios
            var query = _context.Boveda
                .Include(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
                .Include(b => b.Propietario)
                .Include(b => b.Contratos)
                .AsQueryable();

            // 3. Aplicar filtros
            if (!string.IsNullOrEmpty(filtro))
            {
                query = query.Where(b =>
                    b.Numero.ToString().Contains(filtro) ||
                    b.NumeroSecuencial.Contains(filtro) ||
                    b.Piso.Bloque.Descripcion.Contains(filtro) ||
                    (b.Propietario != null &&
                        ((b.Propietario.Nombres + " " + b.Propietario.Apellidos).Contains(filtro) ||
                        b.Propietario.NumeroIdentificacion.Contains(filtro)))
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

            // FILTRO DE ESTADO: 
            // En la migración: Estado = true (Disponible), Estado = false (Ocupada)
            if (estado.HasValue)
            {
                query = query.Where(b => b.Estado == estado.Value);
            }

            if (tienePropietario.HasValue)
            {
                if (tienePropietario.Value)
                    query = query.Where(b => b.PropietarioId != null);
                else
                    query = query.Where(b => b.PropietarioId == null);
            }

            // 4. Conteo y Paginación
            var totalResultados = await query.CountAsync();

            var bovedas = await query
                .OrderBy(b => b.Piso.Bloque.Descripcion)
                .ThenBy(b => b.Piso.NumeroPiso)
                .ThenBy(b => b.Numero)
                .Skip((pagina - 1) * registrosPorPagina)
                .Take(registrosPorPagina)
                .Select(b => new BovedaModel
                {
                    Id = b.Id,
                    Numero = b.Numero,
                    NumeroSecuencial = b.NumeroSecuencial,
                    // IMPORTANTE: Mantenemos el valor de la base de datos
                    // true = Disponible, false = Ocupada
                    Estado = b.Estado,
                    Piso = _mapper.Map<PisoModel>(b.Piso),
                    Propietario = b.Propietario,
                    Contratos = b.Contratos
                })
                .ToListAsync();

            // 5. Preparar ViewModel
            var viewModel = new BovedaPaginadaViewModel
            {
                Bovedas = bovedas,
                PaginaActual = pagina,
                TotalPaginas = (int)Math.Ceiling(totalResultados / (double)registrosPorPagina),
                Filtro = filtro,
                TotalResultados = totalResultados
            };

            // Soporte para carga AJAX
            if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            {
                return PartialView("_ListaBovedas", viewModel);
            }

            return View(viewModel);
        }
        // GET: Bovedas/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null) return NotFound();

            var boveda = await _context.Boveda
                .Include(b => b.Piso).ThenInclude(p => p.Bloque)
                .Include(b => b.Propietario) // Aquí viene el genérico 9999999999
                .Include(b => b.Contratos).ThenInclude(c => c.Difunto)
                .Include(b => b.Contratos).ThenInclude(c => c.Responsables)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (boveda == null) return NotFound();

            // Mapeamos al modelo asegurando que el Estado se mantenga
            var viewModel = _mapper.Map<BovedaModel>(boveda);

            // Forzamos la lógica: Si tiene contratos, el estado en el modelo debe ser "Ocupado"
            if (boveda.Contratos != null && boveda.Contratos.Any())
            {
                viewModel.Estado = false; // false = Ocupada para la vista
            }

            return View(viewModel);
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

            var boveda = await _context.Boveda
            .Include(b => b.Propietario)
                .Include(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (boveda == null)
            {
                return NotFound();
            }

            ViewBag.BloqueNombre = boveda.Piso.Bloque.Descripcion;
            ViewBag.PisoNumero = boveda.Piso.NumeroPiso;
            ViewBag.Precio = boveda.Piso.Precio.ToString("N2");

            return View(boveda);
        }

        // POST: Bovedas/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,NumeroSecuecial,PropietarioId")] Boveda boveda)
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

                    var bovedaParaView = await _context.Boveda
                    .Include(b => b.Propietario)
                        .Include(b => b.Piso)
                            .ThenInclude(p => p.Bloque)
                        .FirstOrDefaultAsync(b => b.Id == id);

                    ViewBag.BloqueNombre = bovedaParaView.Piso.Bloque.Descripcion;
                    ViewBag.PisoNumero = bovedaParaView.Piso.NumeroPiso;
                    ViewBag.Precio = bovedaParaView.Piso.Precio.ToString("N2");

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

                var bovedaParaView = await _context.Boveda
                    .Include(b => b.Piso)
                        .ThenInclude(p => p.Bloque)
                    .FirstOrDefaultAsync(b => b.Id == id);

                ViewBag.BloqueNombre = bovedaParaView.Piso.Bloque.Descripcion;
                ViewBag.PisoNumero = bovedaParaView.Piso.NumeroPiso;
                ViewBag.Precio = bovedaParaView.Piso.Precio.ToString("N2");

                return View(boveda);
            }
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
    }
}