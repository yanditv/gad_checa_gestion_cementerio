using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using gad_checa_gestion_cementerio.Data;

namespace gad_checa_gestion_cementerio.Models
{
    public class PagoModel
    {
        public PagoModel()
        {
            Cuotas = new List<CuotaModel>();
        }
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime FechaPago { get; set; }

        [Required]
        public string TipoPago { get; set; }

        [Required(ErrorMessage="El número de comprobante es obligatorio")]
        public string NumeroComprobante { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Monto { get; set; }

        [Required]
        public int PersonaPagoId { get; set; }

        public List<CuotaModel> Cuotas { get; set; }
    }
}
