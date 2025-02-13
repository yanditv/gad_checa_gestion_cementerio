using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace gad_checa_gestion_cementerio.Data
{
    public class Cuota
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int NumeroCuota { get; set; } // Número de la cuota (1, 2, 3, ...)

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Monto { get; set; } // Monto de la cuota

        [Required]
        public DateTime FechaVencimiento { get; set; } // Fecha de vencimiento de la cuota

        public DateTime? FechaPago { get; set; } // Fecha en que se pagó la cuota (null si no se ha pagado)

        [Required]
        public bool Estado { get; set; } // Estado de la cuota (pagada o pendiente)

        // Relaciones
        [ForeignKey("Contrato")]
        [Required]
        public int ContratoId { get; set; }
        public Contrato Contrato { get; set; }
    }
}
