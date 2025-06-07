
using gad_checa_gestion_cementerio.Utils;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Data;
using Microsoft.AspNetCore.Mvc;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
namespace gad_checa_gestion_cementerio.Controllers;

public class PropietarioController : BaseController
{
    public PropietarioController(ApplicationDbContext context, IMapper mapper, UserManager<IdentityUser> userManager) : base(context, userManager, mapper)
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
            return PartialView("_CrearPropietarioModal", propietario);
        }

        IdentityUser? identityUser = await _context.Users.FirstOrDefaultAsync(u => u.UserName == User.Identity.Name);
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
}
