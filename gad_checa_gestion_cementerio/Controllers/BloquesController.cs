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

namespace gad_checa_gestion_cementerio.Controllers
{
    public class BloquesController : BaseController
    {

        public BloquesController(ApplicationDbContext context, IMapper mapper, UserManager<IdentityUser> userManager) : base(context, userManager, mapper)
        {
        }

        // GET: Bloque
        public async Task<IActionResult> Index()
        {
            return View(await _context.Bloque.ToListAsync());
        }

        // GET: Bloque/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var bloque = await _context.Bloque
                .FirstOrDefaultAsync(m => m.Id == id);
            if (bloque == null)
            {
                return NotFound();
            }

            return View(bloque);
        }

        // GET: Bloque/Create
        public IActionResult Create()
        {
            var numero_piso = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
            var tipos = new List<string> { "Capilla", "Normal", "Otros" };
            ViewData["NumeroDePisos"] = new SelectList(numero_piso);
            ViewData["Tipos"] = new SelectList(tipos);
            ViewData["Cementerios"] = new SelectList(_context.Cementerio,"Id", "Nombre");
            return View();
        }

        // POST: Bloque/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Bloque bloque)
        {

            if (ModelState.IsValid)
            {
                _context.Add(bloque);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(bloque);
        }

        // GET: Bloque/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var bloque = await _context.Bloque.FindAsync(id);
            if (bloque == null)
            {
                return NotFound();
            }
            return View(bloque);
        }

        // POST: Bloque/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,Tipo,NumeroDePisos,BovedasPorPiso,TarifaBase,Estado,FechaCreacion,FechaActualizacion,FechaEliminacion")] Bloque bloque)
        {
            if (id != bloque.Id)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(bloque);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!BloqueExists(bloque.Id))
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
            return View(bloque);
        }

        // GET: Bloque/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var bloque = await _context.Bloque
                .FirstOrDefaultAsync(m => m.Id == id);
            if (bloque == null)
            {
                return NotFound();
            }

            return View(bloque);
        }

        // POST: Bloque/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var bloque = await _context.Bloque.FindAsync(id);
            if (bloque != null)
            {
                _context.Bloque.Remove(bloque);
            }

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private bool BloqueExists(int id)
        {
            return _context.Bloque.Any(e => e.Id == id);
        }
    }
}
