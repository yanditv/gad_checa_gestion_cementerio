using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics.Contracts;

namespace gad_checa_gestion_cementerio.Data
{
    public class Boveda
    {
        public Boveda()
        {
        }

        [Key]
        public int Id { get; set; }

        [Required]
        public int Numero { get; set; }

        [Required]
        public bool Estado { get; set; }

        // Auditoría
        public DateTime FechaCreacion { get; set; }
        public DateTime FechaActualizacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }


        [ForeignKey("UsuarioCreadorId")]
        public IdentityUser UsuarioCreador { get; set; }

        [ForeignKey("UsuarioActualizadorId")]
        public IdentityUser? UsuarioActualizador { get; set; }

        [ForeignKey("UsuarioEliminadorId")]
        public IdentityUser? UsuarioEliminador { get; set; }

        [Required]
        public int PisoId { get; set; }

        [ForeignKey("PisoId")]
        public Piso Piso { get; set; } // Relación con el piso
    }

}