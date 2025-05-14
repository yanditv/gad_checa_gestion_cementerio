using gad_checa_gestion_cementerio.Data;

namespace gad_checa_gestion_cementerio.Models.Views
{
    public class ReporteCuentasPorCobrarViewModel
    {
        public List<Cuota> CuotasPendientes { get; set; }
        public decimal MontoTotalPendiente { get; set; }

        // Para el PDF:
        public List<Cuota> Cuotas { get; set; }
        public decimal Monto { get; set; }
    }
}
