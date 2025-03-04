using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace gad_checa_gestion_cementerio.Data
{
    public class Cuota
    {
        public Cuota()
        {
            this.Pagos = new List<Pago>();
        
        }

        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime FechaVencimiento { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Monto { get; set; }

        [Required]
        public bool Pagada { get; set; }

        [ForeignKey("Contrato")]
        public int ContratoId { get; set; }
        public Contrato Contrato { get; set; }

        public List<Pago> Pagos { get; set; }
    }
}