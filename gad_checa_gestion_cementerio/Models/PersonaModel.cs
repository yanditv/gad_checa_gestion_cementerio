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



        [StringLength(100)]
        [Display(Name = "Nombres")]
        [Required(ErrorMessage = "Los nombres son obligatorios.")]
        public string Nombres { get; set; }
        [StringLength(100)]
        [Display(Name = "Apellidos")]
        [Required(ErrorMessage = "Los apellidos son obligatorios.")]
        public string Apellidos { get; set; }

        [StringLength(20)]
        [Display(Name = "Tipo de Identificación")]
        [Required(ErrorMessage = "El tipo de identificación es obligatorio.")]
        public string TipoIdentificacion { get; set; }

        [StringLength(20)]
        [Display(Name = "Número de Identificación")]
        [Required(ErrorMessage = "El número de identificación es obligatorio.")]
        [CustomValidation(typeof(PersonaModel), nameof(ValidateCedula))]
        public string NumeroIdentificacion { get; set; }

        [StringLength(20)]
        [Display(Name = "Teléfono")]
        [Required(ErrorMessage = "El teléfono es obligatorio.")]
        public string Telefono { get; set; }

        [StringLength(200)]
        [Display(Name = "Dirección")]
        [Required(ErrorMessage = "La dirección es obligatoria.")]
        public string Direccion { get; set; }

        [StringLength(100)]
        [Display(Name = "Correo Electrónico")]
        [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
        [EmailAddress(ErrorMessage = "El correo electrónico no es válido.")]
        public string Email { get; set; }


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

        public string NombresCompletos
        {
            get
            {
                return $"{Apellidos} {Nombres}";
            }
        }
    }
}
