using AutoMapper;
using gad_checa_gestion_cementerio.Areas.Identity.Data;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Models.Listas;
using gad_checa_gestion_cementerio.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace gad_checa_gestion_cementerio.Controllers
{
    public class DifuntosController : BaseController
    {
        public DifuntosController(ApplicationDbContext context, IMapper mapper, UserManager<ApplicationUser> userManager) : base(context, userManager, mapper)
        {
        }

        // GET: Difuntos
        public async Task<IActionResult> Index(string filtro, int pagina = 1, int registrosPorPagina = 10)
        {
            var query = _context.Difunto
                .Include(d => d.Contrato.Boveda)
                    .ThenInclude(b => b.Piso)
                        .ThenInclude(p => p.Bloque)
                .Include(d => d.Contrato)
                .Where(d => d.FechaEliminacion == null)
                .AsQueryable();

            // Aplicar filtros
            if (!string.IsNullOrEmpty(filtro))
            {
                query = query.Where(d =>
                    d.Nombres.Contains(filtro) ||
                    d.Apellidos.Contains(filtro) ||
                    d.NumeroIdentificacion.Contains(filtro) ||
                    d.Contrato.Boveda.Piso.Bloque.Descripcion.Contains(filtro) ||
                    d.Contrato.NumeroSecuencial.Contains(filtro)
                );
            }

            // Obtener el total de resultados después de aplicar los filtros
            var totalResultados = await query.CountAsync();

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
                    Boveda = new BovedaModel
                    {
                        Id = d.Contrato.Boveda.Id,
                        Numero = d.Contrato.Boveda.Numero,
                        Piso = new PisoModel
                        {
                            Id = d.Contrato.Boveda.Piso.Id,
                            NumeroPiso = d.Contrato.Boveda.Piso.NumeroPiso,
                            Bloque = new BloqueModel
                            {
                                Id = d.Contrato.Boveda.Piso.Bloque.Id,
                                Descripcion = d.Contrato.Boveda.Piso.Bloque.Descripcion
                            }
                        }
                    },
                    Contrato = new ContratoModel
                    {
                        Id = d.Contrato.Id,
                        NumeroSecuencial = d.Contrato.NumeroSecuencial,
                        FechaFin = d.Contrato.FechaFin
                    }
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
                return PartialView("_ListaDifuntos", viewModel);
            }

            return View(viewModel);
        }

    }
}
