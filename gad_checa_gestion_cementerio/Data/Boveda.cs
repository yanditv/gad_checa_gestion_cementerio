using gad_checa_gestion_cementerio.Areas.Identity.Data;
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
        public string? NumeroSecuecial { get; set; } = "S/N";

        [Required]
        public bool Estado { get; set; }

        // Auditoría
        public DateTime FechaCreacion { get; set; }
        public DateTime FechaActualizacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }

        public string? UsuarioCreadorId { get; set; }

        [ForeignKey("UsuarioCreadorId")]
        public ApplicationUser? UsuarioCreador { get; set; }

        [ForeignKey("UsuarioActualizadorId")]
        public ApplicationUser? UsuarioActualizador { get; set; }

        [ForeignKey("UsuarioEliminadorId")]
        public ApplicationUser? UsuarioEliminador { get; set; }

        public int? PisoId { get; set; }

        [ForeignKey("PisoId")]
        public Piso? Piso { get; set; } // Relación con el piso

        public int? PropietarioId { get; set; }

        [ForeignKey("PropietarioId")]
        public Propietario? Propietario { get; set; }

        public ICollection<Contrato>? Contratos { get; set; } // Relación con los contratos
    }
}