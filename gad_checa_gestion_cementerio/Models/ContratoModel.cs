using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace gad_checa_gestion_cementerio.Models;

public class ContratoModel
{
        public ContratoModel()
        {
            this.Responsables = new List<ResponsableModel>();
            this.Pagos = new List<PagoModel>();
        }

        [Key]
        public int Id { get; set; }


        [Required]
        public DateTime FechaInicio { get; set; }

        [Required]
        public DateTime FechaFin { get; set; }

        [Required]
        public int NumeroDeMeses { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal MontoTotal { get; set; }

        public bool Estado { get; set; }

        public string Observaciones { get; set; }




        public int BovedaId { get; set; }
        public BovedaModel Boveda { get; set; }

        public int DifuntoId { get; set; }
        public DifuntoModel Difunto { get; set; }

        public List<ResponsableModel> Responsables { get; set; }
        public List<PagoModel> Pagos { get; set; }
}
