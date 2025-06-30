using AutoMapper;
using gad_checa_gestion_cementerio.Areas.Identity.Data;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Models.Listas;
using gad_checa_gestion_cementerio.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace gad_checa_gestion_cementerio.Controllers
{
    public class DifuntosController : BaseController
    {
        public DifuntosController(ApplicationDbContext context, IMapper mapper, UserManager<ApplicationUser> userManager, ILogger<DifuntosController> logger) : base(context, userManager, mapper, logger)
        {
        }

        // GET: Difuntos
        public async Task<IActionResult> Index(string filtro, int pagina = 1, int registrosPorPagina = 10)
        {
            var query = _context.Difunto
                .Include(d => d.Contrato)
                    .ThenInclude(c => c!.Boveda)
                        .ThenInclude(b => b!.Piso)
                            .ThenInclude(p => p!.Bloque)
                .Where(d => d.FechaEliminacion == null)
                .AsQueryable();

            // Aplicar filtros
            if (!string.IsNullOrEmpty(filtro))
            {
                // Limpiar el filtro removiendo espacios al inicio y final
                filtro = filtro.Trim();
                Console.WriteLine($"[DEBUG] Buscando con filtro: '{filtro}'");

                // Debug: verificar si existen contratos con este número
                var contratosConNumero = await _context.Contrato
                    .Where(c => c.NumeroSecuencial != null && c.NumeroSecuencial.Contains(filtro))
                    .Select(c => new { c.Id, c.NumeroSecuencial })
                    .ToListAsync();

                Console.WriteLine($"[DEBUG] Contratos encontrados con número secuencial que contiene '{filtro}': {contratosConNumero.Count}");
                foreach (var contrato in contratosConNumero)
                {
                    Console.WriteLine($"[DEBUG] - Contrato ID: {contrato.Id}, NumeroSecuencial: {contrato.NumeroSecuencial}");
                }

                query = query.Where(d =>
                    d.Nombres.Contains(filtro) ||
                    d.Apellidos.Contains(filtro) ||
                    d.NumeroIdentificacion.Contains(filtro) ||
                    (d.Contrato != null && d.Contrato.NumeroSecuencial != null && d.Contrato.NumeroSecuencial.Contains(filtro)) ||
                    (d.Contrato != null && d.Contrato.Boveda != null && d.Contrato.Boveda.Piso != null &&
                     d.Contrato.Boveda.Piso.Bloque != null && d.Contrato.Boveda.Piso.Bloque.Descripcion.Contains(filtro))
                );
            }

            // Obtener el total de resultados después de aplicar los filtros
            var totalResultados = await query.CountAsync();
            Console.WriteLine($"[DEBUG] Total resultados encontrados: {totalResultados}");

            // Aplicar paginación
            var difuntos = await query
                .Skip((pagina - 1) * registrosPorPagina)
                .Take(registrosPorPagina)
                .Select(d => new DifuntoModel
                {
                    Id = d.Id,
                    NumeroIdentificacion = d.NumeroIdentificacion,
                    Nombres = d.Nombres,
                    Apellidos = d.Apellidos,
                    FechaFallecimiento = d.FechaFallecimiento,
                    Boveda = d.Contrato != null && d.Contrato.Boveda != null ? new BovedaModel
                    {
                        Id = d.Contrato.Boveda.Id,
                        Numero = d.Contrato.Boveda.Numero,
                        Piso = d.Contrato.Boveda.Piso != null ? new PisoModel
                        {
                            Id = d.Contrato.Boveda.Piso.Id,
                            NumeroPiso = d.Contrato.Boveda.Piso.NumeroPiso,
                            Bloque = d.Contrato.Boveda.Piso.Bloque != null ? new BloqueModel
                            {
                                Id = d.Contrato.Boveda.Piso.Bloque.Id,
                                Descripcion = d.Contrato.Boveda.Piso.Bloque.Descripcion
                            } : null
                        } : null
                    } : null,
                    Contrato = d.Contrato != null ? new ContratoModel
                    {
                        Id = d.Contrato.Id,
                        NumeroSecuencial = d.Contrato.NumeroSecuencial,
                        FechaFin = d.Contrato.FechaFin
                    } : null
                })
                .ToListAsync();

            var viewModel = new DifuntoPaginadaViewModel
            {
                Difuntos = difuntos,
                PaginaActual = pagina,
                TotalPaginas = (int)Math.Ceiling(totalResultados / (double)registrosPorPagina),
                Filtro = filtro,
                TotalResultados = totalResultados,
            };

            if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
            {
                return PartialView("_DifuntosConPaginacion", viewModel);
            }

            return View(viewModel);
        }

        // GET: Difuntos/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
                return NotFound();

            var difunto = await _context.Difunto.Include(d => d.Descuento).FirstOrDefaultAsync(d => d.Id == id && d.FechaEliminacion == null);
            if (difunto == null)
                return NotFound();

            var model = new DifuntoModel
            {
                Id = difunto.Id,
                NumeroIdentificacion = difunto.NumeroIdentificacion,
                Nombres = difunto.Nombres,
                Apellidos = difunto.Apellidos,
                FechaNacimiento = difunto.FechaNacimiento,
                FechaFallecimiento = difunto.FechaFallecimiento,
                DescuentoId = difunto.DescuentoId
            };
            ViewData["DescuentoId"] = new SelectList(_context.Descuento.Where(d => d.Estado), "Id", "Descripcion", model.DescuentoId);
            ViewBag.DescuentoNombre = difunto.Descuento?.Descripcion;
            return View(model);
        }

        // POST: Difuntos/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, DifuntoModel model)
        {
            if (id != model.Id)
                return NotFound();

            if (!ModelState.IsValid)
            {
                ViewData["DescuentoId"] = new SelectList(_context.Descuento.Where(d => d.Estado), "Id", "Descripcion", model.DescuentoId);
                return View(model);
            }

            var difunto = await _context.Difunto.FirstOrDefaultAsync(d => d.Id == id && d.FechaEliminacion == null);
            if (difunto == null)
                return NotFound();

            difunto.NumeroIdentificacion = model.NumeroIdentificacion;
            difunto.Nombres = model.Nombres;
            difunto.Apellidos = model.Apellidos;
            difunto.FechaNacimiento = model.FechaNacimiento ?? DateTime.Now.AddYears(-70); // Usar fecha por defecto si es null
            difunto.FechaFallecimiento = model.FechaFallecimiento;
            difunto.DescuentoId = model.DescuentoId;
            difunto.FechaActualizacion = DateTime.Now;
            difunto.UsuarioActualizadorId = (await _userManager.GetUserAsync(User)).Id;

            _context.Update(difunto);
            await _context.SaveChangesAsync();
            TempData["Success"] = "Difunto actualizado correctamente.";
            return RedirectToAction(nameof(Index));
        }

        // GET: Difuntos/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
                return NotFound();

            var difunto = await _context.Difunto.Include(d => d.Descuento).FirstOrDefaultAsync(d => d.Id == id && d.FechaEliminacion == null);
            if (difunto == null)
                return NotFound();

            var model = new DifuntoModel
            {
                Id = difunto.Id,
                NumeroIdentificacion = difunto.NumeroIdentificacion,
                Nombres = difunto.Nombres,
                Apellidos = difunto.Apellidos,
                FechaNacimiento = difunto.FechaNacimiento,
                FechaFallecimiento = difunto.FechaFallecimiento,
                DescuentoId = difunto.DescuentoId
            };
            ViewData["Descuento"] = difunto.Descuento?.Descripcion;
            return View(model);
        }

        // POST: Difuntos/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var difunto = await _context.Difunto.FirstOrDefaultAsync(d => d.Id == id && d.FechaEliminacion == null);
            if (difunto == null)
                return NotFound();

            difunto.FechaEliminacion = DateTime.Now;
            difunto.UsuarioEliminadorId = (await _userManager.GetUserAsync(User)).Id;
            _context.Update(difunto);
            await _context.SaveChangesAsync();
            TempData["Success"] = "Difunto eliminado correctamente.";
            return RedirectToAction(nameof(Index));
        }

        // GET: Difuntos/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
                return NotFound();

            var difunto = await _context.Difunto
                .Include(d => d.Descuento)
                .Include(d => d.Contrato)
                    .ThenInclude(c => c.Boveda)
                        .ThenInclude(b => b.Piso)
                            .ThenInclude(p => p.Bloque)
                .Include(d => d.Contrato)
                    .ThenInclude(c => c.Boveda)
                        .ThenInclude(b => b.Propietario)
                .Include(d => d.Contrato)
                    .ThenInclude(c => c.Responsables)
                .Include(d => d.Contrato)
                    .ThenInclude(c => c.Cuotas)
                .FirstOrDefaultAsync(d => d.Id == id && d.FechaEliminacion == null);
            if (difunto == null)
                return NotFound();

            var model = new DifuntoModel
            {
                Id = difunto.Id,
                NumeroIdentificacion = difunto.NumeroIdentificacion,
                Nombres = difunto.Nombres,
                Apellidos = difunto.Apellidos,
                FechaNacimiento = difunto.FechaNacimiento,
                FechaFallecimiento = difunto.FechaFallecimiento,
                DescuentoId = difunto.DescuentoId,
                Boveda = difunto.Contrato?.Boveda != null ? new BovedaModel
                {
                    Id = difunto.Contrato.Boveda.Id,
                    Numero = difunto.Contrato.Boveda.Numero,
                    Piso = new PisoModel
                    {
                        Id = difunto.Contrato.Boveda.Piso.Id,
                        NumeroPiso = difunto.Contrato.Boveda.Piso.NumeroPiso,
                        Bloque = new BloqueModel
                        {
                            Id = difunto.Contrato.Boveda.Piso.Bloque.Id,
                            Descripcion = difunto.Contrato.Boveda.Piso.Bloque.Descripcion
                        }
                    },
                    Propietario = difunto.Contrato.Boveda.Propietario != null ? new Propietario
                    {
                        Id = difunto.Contrato.Boveda.Propietario.Id,
                        Nombres = difunto.Contrato.Boveda.Propietario.Nombres,
                        Apellidos = difunto.Contrato.Boveda.Propietario.Apellidos,
                        NumeroIdentificacion = difunto.Contrato.Boveda.Propietario.NumeroIdentificacion,
                        TipoIdentificacion = difunto.Contrato.Boveda.Propietario.TipoIdentificacion
                    } : null
                } : null,
                Contrato = difunto.Contrato != null ? new ContratoModel
                {
                    Id = difunto.Contrato.Id,
                    NumeroSecuencial = difunto.Contrato.NumeroSecuencial,
                    FechaInicio = difunto.Contrato.FechaInicio,
                    FechaFin = difunto.Contrato.FechaFin,
                    MontoTotal = difunto.Contrato.MontoTotal,
                    Observaciones = difunto.Contrato.Observaciones,
                    PathDocumentoFirmado = difunto.Contrato.PathDocumentoFirmado,
                    Responsables = difunto.Contrato.Responsables?.Select(r => new ResponsableModel
                    {
                        Id = r.Id,
                        Nombres = r.Nombres,
                        Apellidos = r.Apellidos,
                        NumeroIdentificacion = r.NumeroIdentificacion,
                        TipoIdentificacion = r.TipoIdentificacion,
                        Telefono = r.Telefono,
                        Email = r.Email
                    }).ToList(),
                    Cuotas = difunto.Contrato.Cuotas?.Select(c => new CuotaModel
                    {
                        Id = c.Id,
                        FechaVencimiento = c.FechaVencimiento,
                        Monto = c.Monto,
                        Pagada = c.Pagada
                    }).ToList()
                } : null
            };
            ViewData["Descuento"] = difunto.Descuento?.Descripcion;
            return View(model);
        }
    }
}
