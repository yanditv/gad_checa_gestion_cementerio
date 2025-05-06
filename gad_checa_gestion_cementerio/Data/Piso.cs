using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace gad_checa_gestion_cementerio.Data
{
    public class Piso
    {
        public Piso()
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

        [ForeignKey("BloqueId")]
        public Bloque Bloque { get; set; } // Relación con el bloque

    }
}
