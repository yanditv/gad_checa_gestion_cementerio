using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace gad_checa_gestion_cementerio.Models
{
    public class PisoModel
    {
        public PisoModel()
        {
        }

        [Key]
        public int Id { get; set; }

        [Required]
        public int NumeroPiso { get; set; } // Número del piso

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Precio { get; set; } // Precio personalizado por piso

        [Required]
        public int BloqueId { get; set; }
        public BloqueModel? Bloque { get; set; } // Relación con el bloque


    }
}
