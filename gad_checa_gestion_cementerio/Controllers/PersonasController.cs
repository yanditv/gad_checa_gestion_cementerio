using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Utils;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using gad_checa_gestion_cementerio.Models.Listas;
using Microsoft.AspNetCore.Authorization;
using gad_checa_gestion_cementerio.Areas.Identity.Data;

namespace gad_checa_gestion_cementerio.Controllers
{
    [Authorize]
    public class PersonasController : BaseController
    {
        public PersonasController(ApplicationDbContext context, IMapper mapper, UserManager<ApplicationUser> userManager, ILogger<PersonasController> logger) : base(context, userManager, mapper, logger)
        {
        }

        // GET: Personas
        public async Task<IActionResult> Index(string filtro = "", int pagina = 1)
        {
            int pageSize = 10;
            var personasQuery = _context.Persona
            .AsQueryable();

            if (!string.IsNullOrEmpty(filtro))
            {
                personasQuery = personasQuery.Where(c =>
                    c.Nombres.Contains(filtro) ||
                    c.NumeroIdentificacion.Contains(filtro) ||
                    c.Apellidos.Contains(filtro));
            }

            int total = await personasQuery.CountAsync();
            var personas = await personasQuery
            .OrderBy(c => c.Apellidos)
            .Skip((pagina - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

            var viewModel = new PersonaPaginadaViewModel
            {
                Personas = _mapper.Map<List<PersonaModel>>(personas),
                PaginaActual = pagina,
                TotalPaginas = (int)Math.Ceiling(total / (double)pageSize),
                Filtro = filtro,
                TotalResultados = total
            };
            ViewBag.Filtro = filtro;

            return View(viewModel);
        }

        // GET: Personas/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var persona = await _context.Persona
                .FirstOrDefaultAsync(m => m.Id == id);
            if (persona == null)
            {
                return NotFound();
            }

            return View(persona);
        }

        // GET: Personas/Create
        public IActionResult Create()
        {
            var tipos = new List<string> { "Cedula", "RUC" };
            ViewData["TiposIdentificacion"] = new SelectList(tipos);
            return View();
        }

        // POST: Personas/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("Id,Nombres,Apellidos,TipoIdentificacion,NumeroIdentificacion,Telefono,Email,Direccion")] Models.PersonaModel persona)
        {
            bool existe = await _context.Persona
    .AnyAsync(p => p.NumeroIdentificacion == persona.NumeroIdentificacion);
            var tipos = new List<string> { "Cedula", "RUC" };
            if (existe)
            {

                ViewData["TiposIdentificacion"] = new SelectList(tipos);
                ModelState.AddModelError("NumeroIdentificacion", "Ya existe una persona con esta cédula.");
                return View(persona);
            }
            if (ModelState.IsValid)
            {
                ApplicationUser? identityUser = await _context.Users.FirstOrDefaultAsync(u => u.UserName == User.Identity.Name);
                Data.Persona p = new Data.Persona
                {
                    Id = persona.Id,
                    NumeroIdentificacion = persona.NumeroIdentificacion,
                    TipoIdentificacion = persona.TipoIdentificacion,
                    Direccion = persona.Direccion,
                    Email = persona.Email,
                    Nombres = persona.Nombres,
                    Telefono = persona.Telefono,
                    FechaCreacion = DateTime.Now,
                    Apellidos = persona.Apellidos,
                    UsuarioCreador = identityUser
                };
                _context.Add(p);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            ViewData["TiposIdentificacion"] = new SelectList(tipos);
            return View(persona);
        }

        // GET: Personas/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var persona = await _context.Persona.FindAsync(id);
            Models.PersonaModel p = new Models.PersonaModel
            {
                Id = persona.Id,
                Nombres = persona.Nombres,
                Apellidos = persona.Apellidos,
                TipoIdentificacion = persona.TipoIdentificacion,
                NumeroIdentificacion = persona.NumeroIdentificacion,
                Telefono = persona.Telefono,
                Email = persona.Email,
                Direccion = persona.Direccion,

            };

            if (persona == null)
            {
                return NotFound();
            }
            var tipos = new List<string> { "Cedula", "RUC" };
            ViewData["TiposIdentificacion"] = new SelectList(tipos);
            return View(p);
        }

        // POST: Personas/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,Nombres,Apellidos,TipoIdentificacion,NumeroIdentificacion,Telefono,Email,Direccion")] Models.PersonaModel persona)
        {
            if (id != persona.Id)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    var existente = _context.Persona.Find(persona.Id);
                    if (existente != null)
                    {
                        existente.Direccion = persona.Direccion;
                        existente.TipoIdentificacion = persona.Direccion;

                        existente.NumeroIdentificacion = persona.NumeroIdentificacion;
                        existente.Telefono = persona.Telefono;
                        existente.Email = persona.Email;
                        existente.Nombres = persona.Nombres;
                        existente.Apellidos = persona.Apellidos;
                        _context.Update(existente);
                        await _context.SaveChangesAsync();
                    }

                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!PersonaExists(persona.Id))
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
            var tipos = new List<string> { "Cedula", "RUC" };
            ViewData["TiposIdentificacion"] = new SelectList(tipos);
            return View(persona);
        }

        // GET: Personas/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var persona = await _context.Persona
                .FirstOrDefaultAsync(m => m.Id == id);
            if (persona == null)
            {
                return NotFound();
            }

            return View(persona);
        }

        // POST: Personas/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var persona = await _context.Persona.FindAsync(id);
            if (persona != null)
            {
                _context.Persona.Remove(persona);
            }

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private bool PersonaExists(int id)
        {
            return _context.Persona.Any(e => e.Id == id);
        }

        [HttpGet]
        public IActionResult CrearDesdeModal()
        {
            var tipos = new List<string> { "Cédula", "RUC" };
            ViewData["TiposIdentificacion"] = new SelectList(tipos);
            return PartialView("_CrearPersonaModal", new PersonaModel());
        }


        [HttpPost]
        public async Task<IActionResult> GuardarDesdeModal([Bind("Nombres,Apellidos,TipoIdentificacion,NumeroIdentificacion,Telefono,Email,Direccion")] Models.PersonaModel persona)
        {
            if (!ModelState.IsValid)
            {
                var tipos = new List<string> { "Cédula", "RUC" };
                ViewBag.TiposIdentificacion = new SelectList(tipos);
                return PartialView("_CrearPersonaModal", persona);
            }

            ApplicationUser? identityUser = await _context.Users.FirstOrDefaultAsync(u => u.UserName == User.Identity.Name);
            Data.Persona p = new Data.Persona
            {
                NumeroIdentificacion = persona.NumeroIdentificacion,
                TipoIdentificacion = persona.TipoIdentificacion,
                Direccion = persona.Direccion,
                Email = persona.Email,
                Nombres = persona.Nombres,
                Telefono = persona.Telefono,
                FechaCreacion = DateTime.Now,
                Apellidos = persona.Apellidos,
                UsuarioCreador = identityUser
            };

            _context.Add(p);
            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                id = p.Id,
                nombreCompleto = $"{p.Nombres} {p.Apellidos}"
            });
        }

        [HttpGet]
        public async Task<IActionResult> BuscarPorCedula(string cedula)
        {
            var persona = await _context.Persona
                .FirstOrDefaultAsync(p => p.NumeroIdentificacion == cedula);

            if (persona == null)
                return Json(new { existe = false });

            return Json(new
            {
                existe = true,
                persona = new
                {
                    persona.Nombres,
                    persona.Apellidos,
                    persona.Telefono,
                    persona.Email,
                    persona.Direccion,
                    persona.TipoIdentificacion,
                    persona.NumeroIdentificacion,

                }
            });
        }

    }
}
