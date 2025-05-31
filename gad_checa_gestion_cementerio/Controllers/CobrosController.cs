using AutoMapper;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Utils;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
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
            var contratos = _context.Contrato
                .Include(c => c.Boveda)
                .Include(c => c.Difunto)
                .Include(c => c.Responsables)
                .Include(c => c.Cuotas)
                .ToList();

            var contratosModel = _mapper.Map<List<Models.ContratoModel>>(contratos);
            return View(contratosModel);
        }

        // GET  : COBRAR
        public ActionResult Cobrar(int id)
        {
            var contrato = _context.Contrato
                .Include(c => c.Boveda)
                .Include(c => c.Difunto)
                .Include(c => c.Responsables)
                .Include(c => c.Cuotas)
                .FirstOrDefault(c => c.Id == id);

            if (contrato == null)
            {
                return NotFound();
            }
            var pago = new PagoModel
            {
                FechaPago = DateTime.Now,
                TipoPago = "Efectivo", // O puedes permitir que el usuario seleccione el tipo de pago
                NumeroComprobante = "", // Puedes dejarlo vacío o permitir que el usuario lo ingrese
                Monto = contrato.MontoTotal,
                PersonaPagoId = 0, // Aquí deberías asignar el ID de la persona que realiza el pago
                Cuotas = new List<CuotaModel>()
            };

            var contratoModel = _mapper.Map<Models.ContratoModel>(contrato);
            ViewData["TiposPago"] = new SelectList(new List<string> { "Efectivo", "Transferencia", "Banco" });
            // asignamos al pago, las cuotas pendientes del contrato
            pago.Cuotas = contratoModel.Cuotas.Where(c => !c.Pagada).ToList();
            return View(pago);
        }
        [HttpPost]
        public ActionResult Cobrar(PagoModel pago, List<Guid> CuotasSeleccionadas)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    // Aquí deberías guardar el pago en la base de datos

                    pago.Cuotas = pago.Cuotas.Where(c => CuotasSeleccionadas.Contains(c.TempId)).ToList();

                    // y actualizar el estado de las cuotas pagadas
                    foreach (var cuota in pago.Cuotas)
                    {
                        cuota.Pagada = true; // Marcar la cuota como pagada
                    }

                    // Guardar el pago y las cuotas actualizadas en la base de datos
                    var pagoEntity = _mapper.Map<Pago>(pago);
                    pagoEntity.Id = 0;
                    _context.Pago.Add(pagoEntity);
                    _context.SaveChanges();

                    TempData["SuccessMessage"] = "Pago registrado exitosamente.";
                    return RedirectToAction("Index");
                }

                ViewData["TiposPago"] = new SelectList(new List<string> { "Efectivo", "Transferencia", "Banco" });
                return View(pago);
            }
            catch (Exception ex)
            {

                // Manejo de errores, puedes registrar el error o mostrar un mensaje al usuario
                ModelState.AddModelError("", "Ocurrió un error al procesar el pago: " + ex.Message);
                throw ex;
            }
        }

    }
}

