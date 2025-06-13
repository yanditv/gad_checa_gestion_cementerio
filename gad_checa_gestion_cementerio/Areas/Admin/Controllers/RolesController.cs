using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Areas.Identity.Data;
using Microsoft.Extensions.Logging;

namespace gad_checa_gestion_cementerio.Areas.Admin.Controllers
{
    [Area("Admin")]
    [Authorize(Roles = "Admin,Administrador")]
    public class RolesController : Controller
    {
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<RolesController> _logger;

        public RolesController(
            RoleManager<IdentityRole> roleManager,
            UserManager<ApplicationUser> userManager,
            ILogger<RolesController> logger)
        {
            _roleManager = roleManager;
            _userManager = userManager;
            _logger = logger;
        }

        public IActionResult Index()
        {
            var roles = _roleManager.Roles.Where(r => r.Name != "Administrador").ToList();
            return View(roles);
        }

        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(IdentityRole role)
        {
            if (ModelState.IsValid)
            {
                if (role.Name == "Administrador")
                {
                    ModelState.AddModelError("", "No se puede crear el rol Administrador.");
                    return View(role);
                }

                var result = await _roleManager.CreateAsync(role);
                if (result.Succeeded)
                {
                    TempData["SuccessMessage"] = "Rol creado exitosamente";
                    return RedirectToAction(nameof(Index));
                }

                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError("", error.Description);
                }
            }
            return View(role);
        }

        public async Task<IActionResult> Edit(string id)
        {
            var role = await _roleManager.FindByIdAsync(id);
            if (role == null)
            {
                return NotFound();
            }

            if (role.Name == "Administrador")
            {
                return RedirectToAction(nameof(Index));
            }

            return View(role);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(IdentityRole role)
        {
            if (ModelState.IsValid)
            {
                var existingRole = await _roleManager.FindByIdAsync(role.Id);
                if (existingRole == null)
                {
                    return NotFound();
                }

                if (existingRole.Name == "Administrador")
                {
                    return RedirectToAction(nameof(Index));
                }

                existingRole.Name = role.Name;
                var result = await _roleManager.UpdateAsync(existingRole);
                if (result.Succeeded)
                {
                    TempData["SuccessMessage"] = "Rol actualizado exitosamente";
                    return RedirectToAction(nameof(Index));
                }

                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError("", error.Description);
                }
            }
            return View(role);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(string id)
        {
            var role = await _roleManager.FindByIdAsync(id);
            if (role == null)
            {
                return NotFound();
            }

            if (role.Name == "Administrador")
            {
                TempData["ErrorMessage"] = "No se puede eliminar el rol Administrador";
                return RedirectToAction(nameof(Index));
            }

            var result = await _roleManager.DeleteAsync(role);
            if (result.Succeeded)
            {
                TempData["SuccessMessage"] = "Rol eliminado exitosamente";
            }
            else
            {
                TempData["ErrorMessage"] = "Error al eliminar el rol";
            }

            return RedirectToAction(nameof(Index));
        }

        public async Task<IActionResult> UsersInRole(string id)
        {
            var role = await _roleManager.FindByIdAsync(id);
            if (role == null)
            {
                return NotFound();
            }

            var users = new List<ApplicationUser>();
            foreach (var user in _userManager.Users.ToList())
            {
                if (await _userManager.IsInRoleAsync(user, role.Name))
                {
                    users.Add(user);
                }
            }

            ViewBag.RoleName = role.Name;
            return View(users);
        }
    }
}
