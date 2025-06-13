using AutoMapper;
using gad_checa_gestion_cementerio.Areas.Identity.Data;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace gad_checa_gestion_cementerio.Controllers
{
    public class NotifyController : BaseController
    {
        public NotifyController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, IMapper mapper)
            : base(context, userManager, mapper)
        {
        }

        // GET: Notify
        public IActionResult Index()
        {
            var ListNotify = new List<NotifyModel>();

            // Contratos que vencen en los próximos 30 días
            var contratosPorVencer = _context.Contrato
                .Where(c => c.FechaFin >= DateTime.Now && c.FechaFin <= DateTime.Now.AddDays(30) && c.Estado)
                .ToList();

            foreach (var contrato in contratosPorVencer)
            {
                ListNotify.Add(new NotifyModel
                {
                    title = "Contrato por vencer",
                    description = $"El contrato #{contrato.NumeroSecuencial} vence el {contrato.FechaFin:dd/MM/yyyy}."
                });
            }

            // Cuotas no pagadas que vencen en los próximos 15 días
            var cuotasPorVencer = _context.Cuota
                .Include(q => q.Contrato)
                .Where(q => !q.Pagada && q.FechaVencimiento >= DateTime.Now && q.FechaVencimiento <= DateTime.Now.AddDays(15))
                .ToList();

            foreach (var cuota in cuotasPorVencer)
            {
                var contrato = cuota.Contrato;
                if (contrato != null)
                {
                    ListNotify.Add(new NotifyModel
                    {
                        title = "Cuota próxima a vencer",
                        description = $"Cuota del contrato #{contrato.NumeroSecuencial} vence el {cuota.FechaVencimiento:dd/MM/yyyy} por un monto de ${cuota.Monto:F2}."
                    });
                }
            }

            return View(ListNotify);
        }
    }
}
