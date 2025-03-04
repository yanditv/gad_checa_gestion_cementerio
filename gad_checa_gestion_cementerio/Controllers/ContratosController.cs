using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Utils;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using gad_checa_gestion_cementerio.Models;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
namespace gad_checa_gestion_cementerio.Controllers
{
    public class ContratosController : BaseController
    {
        public ContratosController(ApplicationDbContext context, IMapper mapper, UserManager<IdentityUser> userManager) : base(context, userManager, mapper)
        {
        }
        // GET: Contratos
        public async Task<IActionResult> Index()
        {
            var applicationDbContext = _context.Contrato.Include(c => c.Boveda);
            return View(await applicationDbContext.ToListAsync());
        }

        // GET: Contratos/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var contrato = await _context.Contrato
                .Include(c => c.Boveda)
                .FirstOrDefaultAsync(m => m.Id == id);
            if (contrato == null)
            {
                return NotFound();
            }

            return View(contrato);
        }

        // GET: Contratos/Create
        public IActionResult Create()
        {
            ViewData["BovedaId"] = new SelectList(_context.Boveda, "Id", "Estado");

            var contrato = new CreateContratoModel();
             var year = DateTime.Now.Year;
                var lastContrato = _context.Contrato.OrderByDescending(c => c.Id).FirstOrDefault();
                var nextNumber = lastContrato != null ? lastContrato.Id + 1 : 1;
                var prefix = contrato.contrato.EsRenovacion ? "RNV" : "CTR";
                var numeroSecuencial = $"{prefix}-GADCHECA-{year}-{nextNumber:D3}";
                contrato.contrato.NumeroSecuencial = numeroSecuencial;
            return View(contrato);
        }

        // POST: Contratos/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken] 
        public IActionResult Create(CreateContratoModel viewModel)
        {
            if (ModelState.IsValid)
            {
                var contrato = new Contrato
                {
                    FechaInicio = viewModel.contrato.FechaInicio,
                    FechaFin = viewModel.contrato.FechaFin,
                    NumeroDeMeses = viewModel.contrato.NumeroDeMeses,
                    MontoTotal = viewModel.contrato.MontoTotal,
                    Estado = viewModel.contrato.Estado,
                    Observaciones = viewModel.contrato.Observaciones,
                    DifuntoId = viewModel.difunto.Id,
                    Responsables = viewModel.responsables,
                    NumeroSecuencial = viewModel.contrato.NumeroSecuencial,
                    EsRenovacion = viewModel.contrato.EsRenovacion
                };


                _context.Contrato.Add(contrato);
                _context.SaveChanges();
                return RedirectToAction("Index");
            }
            return View(viewModel);
        }

        // GET: Contratos/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var contrato = await _context.Contrato.FindAsync(id);
            if (contrato == null)
            {
                return NotFound();
            }
            ViewData["BovedaId"] = new SelectList(_context.Boveda, "Id", "Estado", contrato.BovedaId);
            return View(contrato);
        }

        // POST: Contratos/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to.
        // For more details, see http://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("Id,BovedaId,FechaInicio,FechaFin,MontoTotal,Estado,Observaciones")] Contrato contrato)
        {
            if (id != contrato.Id)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(contrato);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!ContratoExists(contrato.Id))
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
            ViewData["BovedaId"] = new SelectList(_context.Boveda, "Id", "Estado", contrato.BovedaId);
            return View(contrato);
        }

        // GET: Contratos/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var contrato = await _context.Contrato
                .Include(c => c.Boveda)
                .FirstOrDefaultAsync(m => m.Id == id);
            if (contrato == null)
            {
                return NotFound();
            }

            return View(contrato);
        }

        // POST: Contratos/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            var contrato = await _context.Contrato.FindAsync(id);
            if (contrato != null)
            {
                _context.Contrato.Remove(contrato);
            }

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private bool ContratoExists(int id)
        {
            return _context.Contrato.Any(e => e.Id == id);
        }
            public IActionResult GenerarContratoPDF(CreateContratoModel model)
    {
        // Crear un MemoryStream para almacenar el PDF
        using (var memoryStream = new MemoryStream())
        {
            // Crear el escritor de PDF
            var writer = new PdfWriter(memoryStream);
            var pdf = new PdfDocument(writer);
            var document = new Document(pdf);

            // Agregar contenido al PDF
            document.Add(new Paragraph("CONTRATO DE RENOVACIÓN DE ARRIENDO DE BOVEDA DEL CEMENTERIO"));
            document.Add(new Paragraph("DE LA PARROQUIA CHECA"));
            document.Add(new Paragraph($"En la Parroquia de Checa, a los {model.contrato.FechaInicio:dd} días del mes de {model.contrato.FechaInicio:MMMM} del {model.contrato.FechaInicio:yyyy}; comparecen a celebrar el presente contrato de arrendamiento..."));

            // Agregar detalles del contrato
            document.Add(new Paragraph($"Contrato ID: {model.contrato.Id}"));
            document.Add(new Paragraph($"Fecha: {model.contrato.FechaInicio}"));
            document.Add(new Paragraph($"Tipo: {model.contrato.Estado}"));

            // Agregar detalles del difunto
            document.Add(new Paragraph($"Nombre del difunto: {model.difunto.Nombres}"));
            document.Add(new Paragraph($"Fecha de Nacimiento: {model.difunto.FechaCreacion}"));
            document.Add(new Paragraph($"Fecha de Defunción: {model.difunto.FechaFallecimiento}"));

            // Agregar detalles de los responsables
            foreach (var responsable in model.responsables)
            {
                document.Add(new Paragraph($"Nombre: {responsable.Nombres}"));
                document.Add(new Paragraph($"Teléfono: {responsable.Telefono}"));
            }

            // Agregar detalles del pago
            document.Add(new Paragraph($"Monto: {model.pago.Monto}"));
            document.Add(new Paragraph($"Fecha de Pago: {model.pago.FechaPago}"));

            // Cerrar el documento
            document.Close();

            // Devolver el PDF como un archivo descargable
            return File(memoryStream.ToArray(), "application/pdf", "ContratoArrendamiento.pdf");
        }
    }
    }
}
