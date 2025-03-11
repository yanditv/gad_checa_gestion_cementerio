using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace gad_checa_gestion_cementerio.Data
{
    public class Persona
    {
        public Persona()
        {
            this.Pagos = new List<Pago>();
            this.Estado = true;
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

        [Required]
        [Display(Name = "Estado")]
        public bool Estado { get; set; }

        // Auditoría
        public DateTime FechaCreacion { get; set; }


        [ForeignKey("UsuarioCreadorId")]
        [Display(Name = "Usuario Creador")]
        [Required(ErrorMessage = "El usuario creador es obligatorio.")]
        public IdentityUser UsuarioCreador { get; set; }


        // Relaciones
        public ICollection<Pago> Pagos { get; set; }
    }
}
