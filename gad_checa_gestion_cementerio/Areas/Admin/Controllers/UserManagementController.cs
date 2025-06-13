using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using gad_checa_gestion_cementerio.Areas.Identity.Data;
using System.Threading.Tasks;
using System.Linq;
using System.Collections.Generic;
using gad_checa_gestion_cementerio.Models;
using Microsoft.Extensions.Logging;

namespace gad_checa_gestion_cementerio.Areas.Admin.Controllers
{
    [Area("Admin")]
    [Authorize(Roles = "Admin,Administrador")]
    public class UserManagementController : Controller
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ILogger<UserManagementController> _logger;

        public UserManagementController(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ILogger<UserManagementController> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
        }

        public async Task<IActionResult> Index()
        {
            try
            {
                var users = _userManager.Users.ToList();
                var userRoles = new List<UserRoleViewModel>();

                foreach (var user in users)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    userRoles.Add(new UserRoleViewModel
                    {
                        User = user,
                        Roles = roles.ToList()
                    });
                }

                return View(userRoles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar la lista de usuarios");
                TempData["ErrorMessage"] = "Error al cargar la lista de usuarios";
                return View(new List<UserRoleViewModel>());
            }
        }

        public IActionResult Create()
        {
            try
            {
                ViewBag.Roles = _roleManager.Roles
                    .Where(r => r.Name != "Administrador")
                    .Select(r => new SelectListItem
                    {
                        Value = r.Name,
                        Text = r.Name
                    })
                    .ToList();
                return View();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar la vista de creación");
                TempData["ErrorMessage"] = "Error al cargar la vista de creación";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(CreateUserViewModel model)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    if (model.Role == "Administrador")
                    {
                        ModelState.AddModelError("", "No se puede asignar el rol Administrador.");
                        ViewBag.Roles = _roleManager.Roles
                            .Where(r => r.Name != "Administrador")
                            .Select(r => new SelectListItem
                            {
                                Value = r.Name,
                                Text = r.Name
                            })
                            .ToList();
                        return View(model);
                    }

                    var user = new ApplicationUser
                    {
                        UserName = model.Email,
                        Email = model.Email,
                        Nombres = model.Nombre,
                        Apellidos = model.Apellido,
                        Cedula = model.Cedula
                    };

                    var result = await _userManager.CreateAsync(user, model.Password);
                    if (result.Succeeded)
                    {
                        if (!string.IsNullOrEmpty(model.Role))
                        {
                            await _userManager.AddToRoleAsync(user, model.Role);
                        }

                        TempData["SuccessMessage"] = "Usuario creado exitosamente";
                        return RedirectToAction(nameof(Index));
                    }

                    foreach (var error in result.Errors)
                    {
                        ModelState.AddModelError("", error.Description);
                    }
                }

                ViewBag.Roles = _roleManager.Roles
                    .Where(r => r.Name != "Administrador")
                    .Select(r => new SelectListItem
                    {
                        Value = r.Name,
                        Text = r.Name
                    })
                    .ToList();
                return View(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear el usuario");
                TempData["ErrorMessage"] = "Error al crear el usuario";
                ViewBag.Roles = _roleManager.Roles
                    .Where(r => r.Name != "Administrador")
                    .Select(r => new SelectListItem
                    {
                        Value = r.Name,
                        Text = r.Name
                    })
                    .ToList();
                return View(model);
            }
        }

        public async Task<IActionResult> Edit(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return NotFound();
                }

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound();
                }

                var roles = await _userManager.GetRolesAsync(user);
                var model = new EditUserViewModel
                {
                    Id = user.Id,
                    Email = user.Email,
                    Nombre = user.Nombres,
                    Apellido = user.Apellidos,
                    Cedula = user.Cedula,
                    CurrentRole = roles.FirstOrDefault()
                };

                ViewBag.Roles = _roleManager.Roles
                    .Where(r => r.Name != "Administrador")
                    .Select(r => new SelectListItem
                    {
                        Value = r.Name,
                        Text = r.Name
                    })
                    .ToList();
                return View(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar la vista de edición");
                TempData["ErrorMessage"] = "Error al cargar la vista de edición";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(EditUserViewModel model)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    if (model.CurrentRole == "Administrador")
                    {
                        ModelState.AddModelError("", "No se puede asignar el rol Administrador.");
                        ViewBag.Roles = _roleManager.Roles
                            .Where(r => r.Name != "Administrador")
                            .Select(r => new SelectListItem
                            {
                                Value = r.Name,
                                Text = r.Name
                            })
                            .ToList();
                        return View(model);
                    }

                    var user = await _userManager.FindByIdAsync(model.Id);
                    if (user == null)
                    {
                        return NotFound();
                    }

                    user.Email = model.Email;
                    user.UserName = model.Email;
                    user.Nombres = model.Nombre;
                    user.Apellidos = model.Apellido;
                    user.Cedula = model.Cedula;

                    var result = await _userManager.UpdateAsync(user);
                    if (result.Succeeded)
                    {
                        var currentRoles = await _userManager.GetRolesAsync(user);
                        await _userManager.RemoveFromRolesAsync(user, currentRoles);

                        if (!string.IsNullOrEmpty(model.CurrentRole))
                        {
                            await _userManager.AddToRoleAsync(user, model.CurrentRole);
                        }

                        TempData["SuccessMessage"] = "Usuario actualizado exitosamente";
                        return RedirectToAction(nameof(Index));
                    }

                    foreach (var error in result.Errors)
                    {
                        ModelState.AddModelError("", error.Description);
                    }
                }

                ViewBag.Roles = _roleManager.Roles
                    .Where(r => r.Name != "Administrador")
                    .Select(r => new SelectListItem
                    {
                        Value = r.Name,
                        Text = r.Name
                    })
                    .ToList();
                return View(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al actualizar el usuario");
                TempData["ErrorMessage"] = "Error al actualizar el usuario";
                ViewBag.Roles = _roleManager.Roles
                    .Where(r => r.Name != "Administrador")
                    .Select(r => new SelectListItem
                    {
                        Value = r.Name,
                        Text = r.Name
                    })
                    .ToList();
                return View(model);
            }
        }

        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return NotFound();
                }

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound();
                }

                var userRoles = await _userManager.GetRolesAsync(user);
                if (userRoles.Contains("Admin") || userRoles.Contains("Administrador"))
                {
                    ModelState.AddModelError("", "No se puede eliminar un usuario con rol principal");
                    return View(user);
                }

                return View(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar la vista de eliminación");
                TempData["ErrorMessage"] = "Error al cargar la vista de eliminación";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [ActionName("Delete")]
        public async Task<IActionResult> DeleteConfirmed(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return NotFound();
                }

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound();
                }

                var userRoles = await _userManager.GetRolesAsync(user);
                if (userRoles.Contains("Admin") || userRoles.Contains("Administrador"))
                {
                    TempData["ErrorMessage"] = "No se puede eliminar un usuario con rol principal";
                    return RedirectToAction(nameof(Index));
                }

                // Primero eliminar los roles del usuario
                if (userRoles.Any())
                {
                    await _userManager.RemoveFromRolesAsync(user, userRoles);
                }

                // Luego eliminar el usuario
                var result = await _userManager.DeleteAsync(user);
                if (result.Succeeded)
                {
                    TempData["SuccessMessage"] = "Usuario eliminado exitosamente";
                }
                else
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    TempData["ErrorMessage"] = $"Error al eliminar el usuario: {errors}";
                }

                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar el usuario");
                TempData["ErrorMessage"] = "Error al eliminar el usuario";
                return RedirectToAction(nameof(Index));
            }
        }

        public async Task<IActionResult> ResetPassword(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return NotFound();
                }

                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound();
                }

                var model = new ResetPasswordViewModel
                {
                    Id = user.Id,
                    Email = user.Email
                };

                return View(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cargar la vista de reset de contraseña");
                TempData["ErrorMessage"] = "Error al cargar la vista de reset de contraseña";
                return RedirectToAction(nameof(Index));
            }
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResetPassword(ResetPasswordViewModel model)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    var user = await _userManager.FindByIdAsync(model.Id);
                    if (user == null)
                    {
                        return NotFound();
                    }

                    var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                    var result = await _userManager.ResetPasswordAsync(user, token, model.NewPassword);

                    if (result.Succeeded)
                    {
                        TempData["SuccessMessage"] = "Contraseña actualizada exitosamente";
                        return RedirectToAction(nameof(Index));
                    }

                    foreach (var error in result.Errors)
                    {
                        ModelState.AddModelError("", error.Description);
                    }
                }

                return View(model);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al resetear la contraseña");
                TempData["ErrorMessage"] = "Error al resetear la contraseña";
                return View(model);
            }
        }
    }
}