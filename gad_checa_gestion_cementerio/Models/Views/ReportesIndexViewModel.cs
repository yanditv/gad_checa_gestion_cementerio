using System.Collections.Generic;

namespace gad_checa_gestion_cementerio.Models.Views
{
    public class ReportesIndexViewModel
    {
        public ReporteCuentasPorCobrarViewModel CuentasPorCobrar { get; set; }
        public List<ReporteBovedasViewModel> Bovedas { get; set; }
        public List<ReporteIngresoPorFechaViewModel> Ingresos { get; set; }
    }
}
