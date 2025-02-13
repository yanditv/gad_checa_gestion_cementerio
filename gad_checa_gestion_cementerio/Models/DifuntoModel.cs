using gad_checa_gestion_cementerio.Data;
using Microsoft.AspNetCore.Identity;
using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace gad_checa_gestion_cementerio.Models{
    public class DifuntoModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nombre { get; set; }

        [Required]
        public DateTime FechaFallecimiento { get; set; }

        [Required]
        public bool Estado { get; set; }

        // Auditoría
        public DateTime FechaCreacion { get; set; }

        public Contrato? Contrato { get; set; }

        [Required]
        [ForeignKey("Descuento")]
        public int DescuentoId { get; set; }

        public Descuento Descuento { get; set; }
    }

}
