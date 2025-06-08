using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace gad_checa_gestion_cementerio.Models
{
    public class CementerioModel
    {
        public CementerioModel()
        {
            this.Bloques = new List<BloqueModel>();
        }

        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nombre { get; set; }

        [Required]
        [StringLength(200)]
        public string Direccion { get; set; }


        public string? Email { get; set; }
        public string? Telefono { get; set; }
        public string? AbreviaturaTituloPresidente { get; set; } // Abreviatura del título del presidente (ej. Sr., Sra., Dr., etc.)
        public string? Presidente { get; set; }

        public int VecesRenovacionNicho { get; set; }
        public int VecesRenovacionBovedas { get; set; } // cantidad de veces que se puede renovar el arriendo de bovedas
        public int AniosArriendoNicho { get; set; } // año de inicio del arriendo 
        public int AniosArriendoBovedas { get; set; } // año de inicio del arriendo

        public string? EntidadFinanciera { get; set; } // Abreviatura del título del presidente (ej. Sr., Sra., Dr., etc.)
        public string? NombreEntidadFinanciera { get; set; } // Entidad financiera donde se depositan los pagos
        public string? NumeroCuenta { get; set; } // Número de cuenta bancaria para pagos

        [Required]
        public DateTime FechaCreacion { get; set; }

        [Display(Name = "Tarifa de Arriendo")]
        public decimal? tarifa_arriendo { get; set; }
        public decimal? tarifa_arriendo_nicho { get; set; }

        [Required]
        public bool Estado { get; set; }

        // Auditoría
        public DateTime FechaActualizacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }


        // Relaciones
        public ICollection<BloqueModel> Bloques { get; set; }
    }
}
