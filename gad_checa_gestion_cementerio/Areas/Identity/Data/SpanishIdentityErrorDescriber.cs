using Microsoft.AspNetCore.Identity;

namespace gad_checa_gestion_cementerio.Areas.Identity.Data
{
    public class SpanishIdentityErrorDescriber : IdentityErrorDescriber
    {
        public override IdentityError PasswordRequiresLower()
        {
            return new IdentityError
            {
                Code = nameof(PasswordRequiresLower),
                Description = "Las contraseñas deben tener al menos una letra minúscula ('a'-'z')."
            };
        }

        public override IdentityError PasswordRequiresUpper()
        {
            return new IdentityError
            {
                Code = nameof(PasswordRequiresUpper),
                Description = "Las contraseñas deben tener al menos una letra mayúscula ('A'-'Z')."
            };
        }

        public override IdentityError PasswordRequiresDigit()
        {
            return new IdentityError
            {
                Code = nameof(PasswordRequiresDigit),
                Description = "Las contraseñas deben tener al menos un dígito ('0'-'9')."
            };
        }

        public override IdentityError PasswordRequiresNonAlphanumeric()
        {
            return new IdentityError
            {
                Code = nameof(PasswordRequiresNonAlphanumeric),
                Description = "Las contraseñas deben tener al menos un carácter no alfanumérico."
            };
        }

        public override IdentityError PasswordTooShort(int length)
        {
            return new IdentityError
            {
                Code = nameof(PasswordTooShort),
                Description = $"Las contraseñas deben tener al menos {length} caracteres."
            };
        }
    }
}