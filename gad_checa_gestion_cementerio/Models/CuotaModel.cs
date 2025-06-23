using System.ComponentModel.DataAnnotations;

namespace gad_checa_gestion_cementerio.Models
{
    public class CuotaModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime FechaVencimiento { get; set; }

        [Required]
        public decimal Monto { get; set; }

        [Required]
        public bool Pagada { get; set; }

        public string Estado => Pagada ? "Pagado" : "Pendiente";
        public DateTime? FechaPago { get; set; }
        public Guid TempId { get; set; } = Guid.NewGuid();
        public int? PagoId { get; set; }
    }
}
