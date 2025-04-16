using AutoMapper;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace gad_checa_gestion_cementerio.Controllers
{
    public class CobrosController : BaseController
    {
        public CobrosController(ApplicationDbContext context, IMapper mapper, UserManager<IdentityUser> userManager) : base(context, userManager, mapper)
        {
        }
        // GET: CobrosController
        public ActionResult Index()
        {
            var cobros = _context.Cuota
            .Include(c => c.Contrato.Difunto)
            .Where(c => !c.Pagada).ToList();
            return View(cobros);
        }

    }
}
