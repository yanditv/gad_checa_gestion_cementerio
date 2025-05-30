using System.Collections.Generic;

namespace gad_checa_gestion_cementerio.Models.Views
{
    public class ReportesIndexViewModel
    {
        public List<ReporteCuentasPorCobrarViewModel> CuentasPorCobrar { get; set; } = new();
        public List<ReporteBovedasViewModel> Bovedas { get; set; }
        public List<ReporteIngresoPorFechaViewModel> Ingresos { get; set; }
    }
}
