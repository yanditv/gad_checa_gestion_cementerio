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

        [Required]
        [StringLength(100)]
        public string Nombres { get; set; }
        [Required]
        [StringLength(100)]
        public string Apellidos { get; set; }

        [Required]
        [StringLength(20)]
        public string TipoIdentificacion { get; set; }

        [Required]
        [StringLength(20)]
        public string NumeroIdentificacion { get; set; }

        [StringLength(20)]
        public  string Telefono { get; set; }

        [StringLength(200)]
        public  string Direccion { get; set; }

        [StringLength(100)]
        public  string Email { get; set; }

        [Required]
        public bool Estado { get; set; }

        // Auditoría
        public DateTime FechaCreacion { get; set; }
        public DateTime FechaActualizacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }


        [ForeignKey("UsuarioCreador")]
        public string UsuarioCreadorId { get; set; }
        public IdentityUser UsuarioCreador { get; set; }

        [ForeignKey("UsuarioActualizador")]
        public string? UsuarioActualizadorId { get; set; }
        public IdentityUser UsuarioActualizador { get; set; }

        [ForeignKey("UsuarioEliminador")]
        public string? UsuarioEliminadorId { get; set; }
        public IdentityUser UsuarioEliminador { get; set; }

        // Relaciones
        public ICollection<Pago> Pagos { get; set; }
    }
}
