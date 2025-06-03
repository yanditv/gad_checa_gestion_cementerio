using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace gad_checa_gestion_cementerio.Models;

public class ContratoModel
{
    public ContratoModel()
    {
        this.Responsables = new List<ResponsableModel>();
        this.Cuotas = new List<CuotaModel>();
        this.FechaInicio = DateTime.Now;
        this.FechaFin = DateTime.Now;
        this.Observaciones = "";
        this.Estado = true;
    }

    [Key]
    public int Id { get; set; }

    [Required(ErrorMessage = "El campo {0} es requerido")]
    public DateTime FechaInicio { get; set; }

    [Required(ErrorMessage = "El campo {0} es requerido")]
    public DateTime FechaFin { get; set; }

    [Required(ErrorMessage = "El campo {0} es requerido")]
    public int NumeroDeMeses { get; set; }

    [Required(ErrorMessage = "El campo {0} es requerido")]
    [Column(TypeName = "decimal(18,2)")]
    public decimal MontoTotal { get; set; }

    [Required(ErrorMessage = "El campo {0} es requerido")]
    public bool Estado { get; set; }

    public string? Observaciones { get; set; }



    // Relaciones
    [Required]
    public int BovedaId { get; set; }

    [Required]
    public int DifuntoId { get; set; }
    public DifuntoModel? Difunto { get; set; }

    public List<ResponsableModel> Responsables { get; set; }
    public List<CuotaModel> Cuotas { get; set; }

    // Nuevo campo para el número secuencial
    [Required]
    [StringLength(50)]
    public string NumeroSecuencial { get; set; }

    // Campo para indicar si es renovación
    [Required]
    public bool EsRenovacion { get; set; }

    public TipoContrato TipoContrato { get; set; } = TipoContrato.Nuevo;


    //Datos para reportes

    public decimal MontoPagado
    {
        get
        {
            return Cuotas.Any() ? Cuotas.Sum(x => x.Pagada ? x.Monto : 0) : 0;
        }
    }
    public decimal MontoPendiente
    {
        get
        {
            return Cuotas.Any() ? Cuotas.Sum(x => !x.Pagada ? x.Monto : 0) : 0;
        }
    }
}
