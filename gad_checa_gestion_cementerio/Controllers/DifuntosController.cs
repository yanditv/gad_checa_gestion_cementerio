using AutoMapper;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace gad_checa_gestion_cementerio.Controllers
{
    public class DifuntosController : BaseController
    {
        public DifuntosController(ApplicationDbContext context, IMapper mapper, UserManager<IdentityUser> userManager) : base(context, userManager, mapper)
        {
        }

        // GET: DifuntosController
        public ActionResult Index()
        {
            var difuntos = _context.Difunto
            .Include(d => d.Contrato.Responsables)
            .ToList();
            return View(difuntos);
        }

    }
}
