namespace gad_checa_gestion_cementerio.Models.Views
{
    public class DashboardViewModel
    {
        public int NumeroDifuntos { get; set; }
        public int BovedasDisponibles { get; set; }
        public int NichosDisponibles { get; set; }
        public int NichosOcupados { get; set; }
        public int BovedasOcupadas { get; set; }
        public int BovedasPorCaducar { get; set; }
        public int ContratosActivos { get; set; }
        public int ContratosPorVencer { get; set; }
        public int ContratosVencidos { get; set; }


        public List<ContratoResumenViewModel> UltimosContratos { get; set; } = new();

        public List<IngresoMensualViewModel> IngresosMensuales { get; set; } = new();

        public List<TransaccionRecienteViewModel> TransaccionesRecientes { get; set; } = new();

    }

    public class ContratoResumenViewModel
    {
        public string NumeroSecuencial { get; set; }
        public DateTime FechaFin { get; set; }
        public string EstadoContrato { get; set; }
        public decimal MontoTotal { get; set; }
        public int CuotasPendientes { get; set; }
    }

    public class IngresoMensualViewModel
    {
        public int Mes { get; set; }
        public int Anio { get; set; }
        public decimal TotalIngresado { get; set; }
        public decimal TotalDeuda { get; set; }
    }

    public class TransaccionRecienteViewModel
    {
        public string NombrePersona { get; set; }
        public string NumeroComprobante { get; set; }
        public decimal Monto { get; set; }
        public DateTime FechaPago { get; set; }
    }

}
