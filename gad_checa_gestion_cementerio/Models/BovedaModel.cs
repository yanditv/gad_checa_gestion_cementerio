using gad_checa_gestion_cementerio.Data;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace gad_checa_gestion_cementerio.Models
{
    public class BovedaModel
    {
        public BovedaModel()
        {
        }

        [Key]
        public int Id { get; set; }

        [Required]
        public int Numero { get; set; }
        public string? NumeroSecuecial { get; set; }

        [Required]
        public bool Estado { get; set; }

        // Auditoría
        public DateTime FechaCreacion { get; set; }
        public DateTime FechaActualizacion { get; set; }

        public IdentityUser? UsuarioCreador { get; set; }

        [ForeignKey("UsuarioActualizadorId")]
        public IdentityUser? UsuarioActualizador { get; set; }

        // Relaciones
        [ForeignKey("Piso")]
        [Required]
        public int PisoId { get; set; }
        public PisoModel? Piso { get; set; } // Relación con el piso

        public int? PropietarioId { get; set; }

        [ForeignKey("PropietarioId")]
        public Propietario? Propietario { get; set; }

        public ICollection<Contrato>? Contratos { get; set; }

        public bool TienePropietario => Propietario != null;

        public bool TieneContratoActivo => Contratos?.Any(c =>
            c.FechaInicio <= DateTime.Now &&
            (c.FechaFin == null || c.FechaFin >= DateTime.Now)) ?? false;
    }
}
