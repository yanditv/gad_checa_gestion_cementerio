using gad_checa_gestion_cementerio.Data;
using System.ComponentModel.DataAnnotations;

namespace gad_checa_gestion_cementerio.Models
{
    public class PersonaModel
    {
        public PersonaModel()
        {
        }

        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Nombres { get; set; }
        [Required]
        [MaxLength(100)]
        public string Apellidos { get; set; }

        [Required]
        [StringLength(20)]
        public string TipoIdentificacion { get; set; }
        [MaxLength(20)]
        [CustomValidation(typeof(PersonaModel), nameof(ValidateCedula))]
        public string NumeroIdentificacion { get; set; } // Puede ser null si no es un responsable registrado

        [MaxLength(15)]
        [Phone(ErrorMessage = "El número de teléfono no es válido.")]
        public string Telefono { get; set; }

        [MaxLength(50)]
        [EmailAddress(ErrorMessage = "El correo electrónico no es válido.")]
        public string Email { get; set; }

        [MaxLength(200)]
        public string Direccion { get; set; }

        public static ValidationResult ValidateCedula(string cedula, ValidationContext context)
        {
            if (string.IsNullOrEmpty(cedula))
            {
                return ValidationResult.Success;
            }

            // Add custom validation logic for Cedula here
            if (cedula.Length != 10)
            {
                return new ValidationResult("La cédula debe tener 10 caracteres.");
            }

            return ValidationResult.Success;
        }
    }
}
