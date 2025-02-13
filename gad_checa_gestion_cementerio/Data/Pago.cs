using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace gad_checa_gestion_cementerio.Data
{
    public class Pago
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Monto { get; set; }

        [Required]
        public DateTime FechaPago { get; set; }

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
        [ForeignKey("Cuota")]
        public int CuotaId { get; set; }
        public Cuota Cuota { get; set; }

        [ForeignKey("PersonaQueRealizaPago")]
        public int PersonaQueRealizaPagoId { get; set; }
        public Persona PersonaQueRealizaPago { get; set; }
    }
}
