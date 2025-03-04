using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace gad_checa_gestion_cementerio.Data
{
    public class Difunto
    {
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
        public string NumeroIdentificacion { get; set; }

        [Required]
        public DateTime FechaNacimiento { get; set; }
        [Required]
        public DateTime FechaFallecimiento { get; set; }

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


        public Contrato? Contrato { get; set; }

        [Required]
        [ForeignKey("Descuento")]
        public int DescuentoId { get; set; }

        public Descuento Descuento { get; set; }
    }

}
