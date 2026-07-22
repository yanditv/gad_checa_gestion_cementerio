using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace gad_checa_gestion_cementerio.ViewComponents
{
    public class NotifyDropdownViewComponent : ViewComponent
    {
        private readonly ApplicationDbContext _context;

        public NotifyDropdownViewComponent(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IViewComponentResult> InvokeAsync()
        {
            var notificaciones = new List<NotifyModel>();

            var contratos = await _context.Contrato
                .Where(c => c.FechaFin >= DateTime.Now && c.FechaFin <= DateTime.Now.AddDays(30) && c.Estado)
                .OrderBy(c => c.FechaFin)
                .ToListAsync();

            notificaciones.AddRange(contratos.Select(c => new NotifyModel
            {
                title = "Contrato por vencer",
                description = $"Contrato #{c.NumeroSecuencial} vence el {c.FechaFin:dd/MM/yyyy}",
                url = $"/Contratos/Details/{c.Id}",
                icon = "ti ti-file-alert",
                level = "warning"
            }));

            var cuotas = await _context.Cuota
                .Include(c => c.Contrato)
                .Where(c => !c.Pagada && c.FechaVencimiento >= DateTime.Now && c.FechaVencimiento <= DateTime.Now.AddDays(15))
                .OrderBy(c => c.FechaVencimiento)
                .ToListAsync();

            notificaciones.AddRange(cuotas.Select(q => new NotifyModel
            {
                title = "Cuota próxima a vencer",
                description = $"Cuota de contrato #{q.Contrato.NumeroSecuencial} vence el {q.FechaVencimiento:dd/MM/yyyy}",
                url = $"/Cobros/Cobrar/{q.ContratoId}",
                icon = "ti ti-cash",
                level = "danger"
            }));

            ViewBag.TotalNotificaciones = notificaciones.Count;
            return View("~/Views/Shared/_NotifyDropdownPartial.cshtml", notificaciones.Take(5));
        }
    }
}
