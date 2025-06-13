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

namespace WebApp.Controllers
{
    [Authorize]
    public class BovedasController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public BovedasController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: Bovedas
        public async Task<IActionResult> Index(int? bloqueId, string tipo, bool? estado)
        {
            var query = _context.Boveda
            .Include(b => b.Propietario)
                .Include(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
                        .ThenInclude(b => b.Cementerio)
                .Where(b => b.FechaEliminacion == null);

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
                query = query.Where(b => b.Estado == estado.Value);
            }

            var bovedas = await query.ToListAsync();

            ViewBag.Bloques = await _context.Bloque
                .Where(b => b.FechaEliminacion == null)
                .Select(b => new SelectListItem
                {
                    Value = b.Id.ToString(),
                    Text = b.Descripcion
                })
                .ToListAsync();

            ViewBag.Tipos = new List<SelectListItem>
            {
                new SelectListItem { Value = "Boveda", Text = "Bóveda" },
                new SelectListItem { Value = "Nicho", Text = "Nicho" }
            };

            ViewBag.Estados = new List<SelectListItem>
            {
                new SelectListItem { Value = "true", Text = "Disponible" },
                new SelectListItem { Value = "false", Text = "Ocupado" }
            };

            return View(bovedas);
        }

        // GET: Bovedas/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var boveda = await _context.Boveda
            .Include(b => b.Propietario)
                .Include(b => b.Piso)
                    .ThenInclude(p => p.Bloque)
                        .ThenInclude(b => b.Cementerio)
                .Include(b => b.Contratos)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (boveda == null)
            {
                return NotFound();
            }

            return View(boveda);
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
                bovedaOriginal.NumeroSecuecial = boveda.NumeroSecuecial;
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
                        .ThenInclude(b => b.Cementerio)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (boveda == null)
            {
                return NotFound();
            }

            // Verificar si la bóveda tiene contratos asociados
            var tieneContratos = await _context.Contrato
                .AnyAsync(c => c.BovedaId == boveda.Id && c.FechaEliminacion == null);

            ViewBag.TieneContratos = tieneContratos;
            return View(boveda);
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
    }
}