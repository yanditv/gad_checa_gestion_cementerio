using gad_checa_gestion_cementerio.Data;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Collections.ObjectModel;

namespace gad_checa_gestion_cementerio.Models
{
    public class BloqueModel
    {
        public BloqueModel()
        {
            this.Pisos = new List<PisoModel>();
        }
        [Key]
        public readonly int Id;

        [Required(ErrorMessage = "La descripción es obligatoria.")]
        [StringLength(100, ErrorMessage = "La descripción no puede exceder los 100 caracteres.")]
        public string Descripcion { get; set; }

        [Required(ErrorMessage = "La Calle A es obligatoria.")]
        [StringLength(100, ErrorMessage = "La Calle A no puede exceder los 100 caracteres.")]
        public string CalleA { get; set; }

        [Required(ErrorMessage = "La Calle B es obligatoria.")]
        [StringLength(100, ErrorMessage = "La Calle B no puede exceder los 100 caracteres.")]
        public string CalleB { get; set; }

        [Required(ErrorMessage = "El tipo es obligatorio.")]
        [StringLength(50, ErrorMessage = "El tipo no puede exceder los 50 caracteres.")]
        public string Tipo { get; set; }

        [Required(ErrorMessage = "El número de pisos es obligatorio.")]
        public int NumeroDePisos { get; set; }

        [Required(ErrorMessage = "La tarifa base es obligatoria.")]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TarifaBase { get; set; }

        [Required(ErrorMessage = "El estado es obligatorio.")]
        public bool Estado { get; set; }

        [Required]
        public int BovedasPorPiso { get; set; }

        // Auditoría
        public  DateTime FechaCreacion { get; set; }

        public readonly string UsuarioCreadorId;
        public readonly IdentityUser UsuarioCreador;

        [ScaffoldColumn(false)]
        public List<PisoModel> Pisos { get; set; }

        override public string ToString()
        {
            return Descripcion;
        }
    }
}
