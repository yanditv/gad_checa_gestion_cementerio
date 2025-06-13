using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using gad_checa_gestion_cementerio.Data;
using Microsoft.AspNetCore.Identity;
using AutoMapper;
using gad_checa_gestion_cementerio.Areas.Identity.Data;

namespace gad_checa_gestion_cementerio.Controllers
{
    public class BaseController : Controller
    {
        protected readonly ApplicationDbContext _context;
        protected readonly UserManager<ApplicationUser> _userManager;
        protected readonly IMapper _mapper;

        public BaseController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, IMapper mapper)
        {
            _context = context;
            _userManager = userManager;
            _mapper = mapper;
        }
    }
}