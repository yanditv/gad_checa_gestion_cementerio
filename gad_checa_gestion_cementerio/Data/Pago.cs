using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace gad_checa_gestion_cementerio.Data
{
    public class Pago
    {
        public Pago()
        {
            this.Cuotas = new List<Cuota>();
        }
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime FechaPago { get; set; }

        [Required]
        public string TipoPago { get; set; }

        [Required]
        public string NumeroComprobante { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Monto { get; set; }

        [Required]
        [ForeignKey("Persona")]
        public int PersonaPagoId { get; set; }

        public List<Cuota> Cuotas { get; set; }
    }
}