using System;
using System.Collections.Generic;

namespace gad_checa_gestion_cementerio.Models.Views
{
    public class ReporteIngresoPorFechaViewModel
    {
        public DateTime Fecha { get; set; }
        public string Boveda { get; set; }
        public string TipoIngreso { get; set; }
        public decimal Total { get; set; }

        // Para el PDF:
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public List<IngresoPorFechaDto> Ingresos { get; set; }
    }

    public class IngresoPorFechaDto
    {
        public DateTime Fecha { get; set; }
        public decimal MontoTotal { get; set; }
    }
}
