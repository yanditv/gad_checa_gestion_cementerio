using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using gad_checa_gestion_cementerio.Areas.Identity.Data;

namespace gad_checa_gestion_cementerio.Data
{
    public class Contrato
    {
        public Contrato()
        {
            this.Responsables = new List<Responsable>();
            this.Cuotas = new List<Cuota>();
            this.FechaCreacion = DateTime.Now;
            this.FechaActualizacion = DateTime.Now;
            this.FechaInicio = DateTime.Now;
            this.FechaFin = DateTime.Now;
        }

        [Key]
        public int Id { get; set; }

        [Required]
        public DateTime FechaInicio { get; set; }

        [Required]
        public DateTime FechaFin { get; set; }

        [Required]
        // Nota: A pesar del nombre, este campo almacena años, no meses (ej: 5 = 5 años)
        public int NumeroDeMeses { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal MontoTotal { get; set; }

        [Required]
        public bool Estado { get; set; }

        public string Observaciones { get; set; }

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

        // Relaciones
        [ForeignKey("Boveda")]
        [Required]
        public int BovedaId { get; set; }
        public Boveda Boveda { get; set; }

        [ForeignKey("Difunto")]
        [Required]
        public int DifuntoId { get; set; }
        public Difunto Difunto { get; set; }

        public List<Responsable> Responsables { get; set; }
        public List<Cuota> Cuotas { get; set; }

        // Nuevo campo para el número secuencial
        [Required]
        [StringLength(50)]
        public string NumeroSecuencial { get; set; }

        // Campo para indicar si es renovación
        [Required]
        public bool EsRenovacion { get; set; }

        // Contador de veces renovado
        public int VecesRenovado { get; set; }

        // ID del contrato original del que se deriva esta renovación
        public int? ContratoOrigenId { get; set; }

        // Referencia de navegación al contrato original
        [ForeignKey("ContratoOrigenId")]
        public Contrato? ContratoOrigen { get; set; }

        // Referencia a otro contrato que comparte la misma bóveda física
        public int? ContratoRelacionadoId { get; set; }
        
        [ForeignKey("ContratoRelacionadoId")]
        public Contrato? ContratoRelacionado { get; set; }

        public string? PathDocumentoFirmado { get; set; } // Nuevo campo para el tipo de contrato
    }
}