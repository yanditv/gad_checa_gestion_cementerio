using AutoMapper;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace gad_checa_gestion_cementerio.Controllers
{
    public class NotifyController : BaseController
    {
        public NotifyController(ApplicationDbContext context, UserManager<IdentityUser> userManager, IMapper mapper) : base(context, userManager, mapper)
        {
        }

        // GET: NotifyController
        public ActionResult Index()
        {
            var ListNotify = new List<NotifyModel>();
            ListNotify.Add(new NotifyModel
            {
                title = "Bienvenido",
                description = "Bienvenido al sistema de gestión de cementerio."
            });
            ListNotify.Add(new NotifyModel
            {
                title = "Sistema en mantenimiento",
                description = "El sistema estará en mantenimiento desde el 1 de enero hasta el 5 de enero."
            });
            // var contratosPorVencer = _context.Contrato.Where(c => c.FechaFin < DateTime.Now.AddDays(30)).ToList();

            // foreach (var contrato in contratosPorVencer)
            // {
            //     var notify = new NotifyModel
            //     {
            //         title = "Contrato por vencer",
            //         description = $"El contrato con ID {contrato.Id} está por vencer el {contrato.FechaFin.ToShortDateString()}."
            //     };
            //     ListNotify.Add(notify);
            // }
            return View(ListNotify);
        }

    }
}
