using gad_checa_gestion_cementerio.Data;
using System;

namespace gad_checa_gestion_cementerio.Models.Views
{
    public class ReporteCuentasPorCobrarViewModel
    {
        public int CuotaId { get; set; }
        public DateTime FechaVencimiento { get; set; }
        public decimal Monto { get; set; }
        public bool Pagada { get; set; }

        // Contrato
        public int ContratoId { get; set; }
        public string NumeroSecuencialContrato { get; set; }
        public DateTime FechaInicioContrato { get; set; }
        public DateTime FechaFinContrato { get; set; }

        // Responsable
        public string NombreResponsable { get; set; }
        public string CedulaResponsable { get; set; }
        public string TelefonoResponsable { get; set; }

        // Difunto
        public string NombreDifunto { get; set; }
        public string CedulaDifunto { get; set; }
        public DateTime FechaFallecimiento { get; set; }

        // Ubicación
        public string Bloque { get; set; }
        public int Piso { get; set; }
        public int NumeroBoveda { get; set; }

        // Auditoría
        public DateTime FechaCreacionCuota { get; set; }

        // Totales
        public decimal MontoTotalPendiente { get; set; }
    }
}
