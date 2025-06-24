using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using gad_checa_gestion_cementerio.Areas.Identity.Data;
using System.Threading.Tasks;

namespace gad_checa_gestion_cementerio.Controllers
{
    public class AccountController : Controller
    {
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;

        public AccountController(
            SignInManager<ApplicationUser> signInManager,
            UserManager<ApplicationUser> userManager)
        {
            _signInManager = signInManager;
            _userManager = userManager;
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout(string? returnUrl = null)
        {
            try
            {
                if (_signInManager.IsSignedIn(User))
                {
                    await _signInManager.SignOutAsync();
                }

                // Limpiar cualquier información de sesión adicional
                HttpContext.Session?.Clear();

                if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                {
                    return LocalRedirect(returnUrl);
                }

                return RedirectToAction("Index", "Home");
            }
            catch (Exception)
            {
                // Si hay cualquier error, simplemente redirigir al inicio
                return RedirectToAction("Index", "Home");
            }
        }

        [HttpGet]
        public async Task<IActionResult> Logout()
        {
            try
            {
                if (_signInManager.IsSignedIn(User))
                {
                    await _signInManager.SignOutAsync();
                }

                // Limpiar cualquier información de sesión adicional
                HttpContext.Session?.Clear();

                return RedirectToAction("Index", "Home");
            }
            catch (Exception)
            {
                // Si hay cualquier error, simplemente redirigir al inicio
                return RedirectToAction("Index", "Home");
            }
        }
    }
}
