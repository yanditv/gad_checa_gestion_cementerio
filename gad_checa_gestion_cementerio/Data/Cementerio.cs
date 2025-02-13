using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace gad_checa_gestion_cementerio.Data
{
    public class Cementerio
    {
        public Cementerio()
        {
            this.Bloques = new List<Bloque>();
        }

        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nombre { get; set; }

        [Required]
        [StringLength(200)]
        public string Direccion { get; set; }

        [Required]
        public DateTime FechaCreacion { get; set; }

        [Required]
        public bool Estado { get; set; }

        // Auditoría
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
        public ICollection<Bloque> Bloques { get; set; }
    }
}
