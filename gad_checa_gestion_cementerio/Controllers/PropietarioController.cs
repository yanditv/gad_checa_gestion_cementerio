using gad_checa_gestion_cementerio.Utils;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Data;
using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using gad_checa_gestion_cementerio.Areas.Identity.Data;
namespace gad_checa_gestion_cementerio.Controllers;

public class PropietarioController : BaseController
{
    public PropietarioController(ApplicationDbContext context, IMapper mapper, UserManager<ApplicationUser> userManager) : base(context, userManager, mapper)
    {
    }
    public IActionResult CrearDesdeModal()
    {
        var tipos = new List<string> { "Cédula", "RUC" };
        ViewData["TiposIdentificacion"] = new SelectList(tipos);
        return PartialView("_CrearPropietarioModal", new PropietarioModel());
    }

    [HttpPost]
    public async Task<IActionResult> GuardarDesdeModal([Bind("Nombres,Apellidos,TipoIdentificacion,NumeroIdentificacion,Telefono,Email,Direccion,Catastro")] Models.PropietarioModel propietario)
    {
        if (!ModelState.IsValid)
        {
            var tipos = new List<string> { "Cédula", "RUC" };
            ViewBag.TiposIdentificacion = new SelectList(tipos);

            // Devuelve la vista parcial con los errores
            return PartialView("_CrearPropietarioModal", propietario);
        }

        // Verificar si ya existe un propietario con el mismo número de identificación
        var propietarioExistente = await _context.Persona
            .OfType<Propietario>()
            .FirstOrDefaultAsync(p => p.NumeroIdentificacion == propietario.NumeroIdentificacion);

        if (propietarioExistente != null)
        {
            return Json(new
            {
                success = true,
                id = propietarioExistente.Id,
                nombreCompleto = $"{propietarioExistente.Nombres} {propietarioExistente.Apellidos}"
            });
        }

        ApplicationUser? identityUser = await _context.Users.FirstOrDefaultAsync(u => u.UserName == User.Identity.Name);
        Data.Propietario p = new Data.Propietario
        {
            NumeroIdentificacion = propietario.NumeroIdentificacion,
            TipoIdentificacion = propietario.TipoIdentificacion,
            Direccion = propietario.Direccion,
            Email = propietario.Email,
            Nombres = propietario.Nombres,
            Telefono = propietario.Telefono,
            FechaCreacion = DateTime.Now,
            Apellidos = propietario.Apellidos,
            Catastro = propietario.Catastro,
            FechaInicio = DateTime.Now,
            FechaFin = null,
            UsuarioCreador = identityUser
        };

        _context.Propietario.Add(p);
        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            id = p.Id,
            nombreCompleto = $"{p.Nombres} {p.Apellidos}"
        });
    }

    [HttpGet]
    /*public async Task<IActionResult> Buscar(string numeroIdentificacion)
    {
        var propietarios = await _context.Persona
            .OfType<Propietario>()
            .Where(p => p.NumeroIdentificacion.Contains(numeroIdentificacion))
            .Select(p => new
            {
                p.Id,
                p.Nombres,
                p.Apellidos,
                p.TipoIdentificacion,
                p.NumeroIdentificacion,
                p.Telefono
            })
            .ToListAsync();

        return Json(propietarios);
    }*/
    public IActionResult Buscar(string searchTerm)
    {
        var propietarios = _context.Propietario
            .Where(p => p.NumeroIdentificacion.Contains(searchTerm) ||
                        (p.Nombres + " " + p.Apellidos).Contains(searchTerm))
            .Take(10)
            .ToList();
        return Json(propietarios);
    }
}
