using Microsoft.AspNetCore.Identity;

namespace gad_checa_gestion_cementerio.Areas.Identity.Data
{
    public class ApplicationUser : IdentityUser
    {
        public string Nombres { get; set; } = string.Empty;
        public string Apellidos { get; set; } = string.Empty;
        public string Cedula { get; set; } = string.Empty;
    }
}