using gad_checa_gestion_cementerio.Areas.Identity.Data;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace gad_checa_gestion_cementerio.Data
{
    public class Bloque
    {
        public Bloque()
        {
            this.Pisos = new List<Piso>();
        }
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Descripcion { get; set; }
        [Required]
        [StringLength(100)]
        public string CalleA { get; set; }
        [Required]
        [StringLength(100)]
        public string CalleB { get; set; }
        [Required]
        [StringLength(50)]
        public string Tipo { get; set; }

        [Required]
        public int NumeroDePisos { get; set; }

        [Required]
        public int BovedasPorPiso { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TarifaBase { get; set; }

        [Required]
        public bool Estado { get; set; }

        // Auditoría
        public DateTime FechaCreacion { get; set; }
        public DateTime FechaActualizacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }


        [ForeignKey("UsuarioCreador")]
        public string UsuarioCreadorId { get; set; }
        public ApplicationUser UsuarioCreador { get; set; }

        [ForeignKey("UsuarioActualizador")]
        public string? UsuarioActualizadorId { get; set; }
        public ApplicationUser UsuarioActualizador { get; set; }

        [ForeignKey("UsuarioEliminador")]
        public string? UsuarioEliminadorId { get; set; }
        public ApplicationUser UsuarioEliminador { get; set; }

        [ForeignKey("Cementerio")]
        public int CementerioId { get; set; }
        public Cementerio Cementerio { get; set; }

        public List<Piso> Pisos { get; set; }

        override public string ToString()
        {
            return Descripcion;
        }
    }

}
