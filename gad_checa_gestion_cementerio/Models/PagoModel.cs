using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace gad_checa_gestion_cementerio.Models
{
    public class PagoModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Monto { get; set; }

        [Required]
        public DateTime FechaPago { get; set; }

        public int CuotaId { get; set; }
        public CuotaModel Cuota { get; set; }
        public int PersonaQueRealizaPagoId { get; set; }
    }
}
