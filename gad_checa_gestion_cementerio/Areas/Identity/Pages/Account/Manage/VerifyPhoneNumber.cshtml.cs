using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using gad_checa_gestion_cementerio.Areas.Identity.Data;

namespace gad_checa_gestion_cementerio.Areas.Identity.Pages.Account.Manage
{
    public class VerifyPhoneNumberModel : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;

        public VerifyPhoneNumberModel(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
        }

        [BindProperty]
        public InputModel Input { get; set; }

        public class InputModel
        {
            [Required(ErrorMessage = "El código es requerido")]
            [Display(Name = "Código de verificación")]
            public string Code { get; set; }
        }

        public string PhoneNumber { get; set; }

        public async Task<IActionResult> OnGetAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound($"No se puede cargar el usuario con ID '{_userManager.GetUserId(User)}'.");
            }

            PhoneNumber = await _userManager.GetPhoneNumberAsync(user);
            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound($"No se puede cargar el usuario con ID '{_userManager.GetUserId(User)}'.");
            }

            var code = Input.Code.Replace(" ", string.Empty);
            var result = await _userManager.ChangePhoneNumberAsync(user, PhoneNumber, code);
            if (result.Succeeded)
            {
                var userId = await _userManager.GetUserIdAsync(user);
                await _signInManager.RefreshSignInAsync(user);
                return RedirectToPage("./Index");
            }

            // If we got this far, something failed, redisplay form
            ModelState.AddModelError(string.Empty, "Código de verificación inválido");
            return Page();
        }
    }
}