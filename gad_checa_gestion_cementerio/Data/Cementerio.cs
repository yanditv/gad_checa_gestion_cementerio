using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace gad_checa_gestion_cementerio.Data
{
    public class Cementerio
    {
        public Cementerio()
        {
            this.Bloques = new List<Bloque>();
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
        public string? Presidente { get; set; }
        public string? AbreviaturaTituloPresidente { get; set; }

        public int VecesRenovacionNicho { get; set; }
        public int VecesRenovacionBovedas { get; set; } // cantidad de veces que se puede renovar el arriendo de bovedas
        public int AniosArriendoNicho { get; set; } // año de inicio del arriendo 
        public int AniosArriendoBovedas { get; set; } // año de inicio del arriendo

        public string? EntidadFinanciera { get; set; } // Abreviatura del título del presidente (ej. Sr., Sra., Dr., etc.)
        public string? NombreEntidadFinanciera { get; set; } // Entidad financiera donde se depositan los pagos
        public string? NumeroCuenta { get; set; } // Número de cuenta bancaria para pagos



        [Required]
        public DateTime FechaCreacion { get; set; }

        [Required]
        public bool Estado { get; set; }

        [Precision(18, 2)]
        public decimal? tarifa_arriendo { get; set; }
        [Precision(18, 2)]
        public decimal? tarifa_arriendo_nicho { get; set; }

        // Auditoría
        public DateTime FechaActualizacion { get; set; }
        public DateTime? FechaEliminacion { get; set; }


        [ForeignKey("UsuarioCreador")]
        public string UsuarioCreadorId { get; set; }
        public IdentityUser UsuarioCreador { get; set; }

        [ForeignKey("UsuarioActualizador")]
        public string? UsuarioActualizadorId { get; set; }
        public IdentityUser UsuarioActualizador { get; set; }

        [ForeignKey("UsuarioEliminador")]
        public string? UsuarioEliminadorId { get; set; }
        public IdentityUser UsuarioEliminador { get; set; }

        // Relaciones
        public ICollection<Bloque> Bloques { get; set; }
    }
}
