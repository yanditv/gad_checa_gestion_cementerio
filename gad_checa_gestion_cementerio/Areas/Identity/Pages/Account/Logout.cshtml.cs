using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using gad_checa_gestion_cementerio.Areas.Identity.Data;

namespace gad_checa_gestion_cementerio.Areas.Identity.Pages.Account
{
    [AllowAnonymous]
    public class LogoutModel : PageModel
    {
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ILogger<LogoutModel> _logger;

        public LogoutModel(SignInManager<ApplicationUser> signInManager, ILogger<LogoutModel> logger)
        {
            _signInManager = signInManager;
            _logger = logger;
        }

        public async Task<IActionResult> OnPost(string? returnUrl = null)
        {
            try
            {
                if (_signInManager.IsSignedIn(User))
                {
                    await _signInManager.SignOutAsync();
                    _logger.LogInformation("Usuario ha cerrado sesión.");
                }
                else
                {
                    _logger.LogInformation("Se intentó cerrar sesión pero no había usuario autenticado.");
                }

                // Limpiar cualquier información de sesión adicional
                HttpContext.Session?.Clear();

                if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                {
                    return LocalRedirect(returnUrl);
                }

                // Redirigir al inicio en lugar de a la misma página
                return Redirect("~/");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error durante el cierre de sesión");
                // Si hay cualquier error, simplemente redirigir al inicio
                return Redirect("~/");
            }
        }

        public async Task<IActionResult> OnGet(string? returnUrl = null)
        {
            try
            {
                if (_signInManager.IsSignedIn(User))
                {
                    await _signInManager.SignOutAsync();
                    _logger.LogInformation("Usuario ha cerrado sesión.");
                }

                // Limpiar cualquier información de sesión adicional
                HttpContext.Session?.Clear();

                if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                {
                    return LocalRedirect(returnUrl);
                }

                return Redirect("~/");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error durante el cierre de sesión");
                return Redirect("~/");
            }
        }
    }
}