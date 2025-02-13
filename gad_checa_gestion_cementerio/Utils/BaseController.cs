using AutoMapper;
using gad_checa_gestion_cementerio.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace gad_checa_gestion_cementerio.Utils
{
    public class BaseController : Controller
    {
        protected readonly ApplicationDbContext _context;
        protected readonly IMapper _mapper;
        protected readonly UserManager<IdentityUser> _userManager;

        public BaseController(ApplicationDbContext context, UserManager<IdentityUser>  userManager, IMapper mapper)
        {
            _context = context;
            _userManager = userManager;
            _mapper = mapper;
        }
    }
}
