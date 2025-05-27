namespace gad_checa_gestion_cementerio.Models.Views
{
    public class ReporteBovedasViewModel
    {
        // Bóveda
        public int BovedaId { get; set; }
        public int NumeroBoveda { get; set; }
        public string EstadoBoveda { get; set; } // "Ocupada" o "Libre"
        public DateTime FechaCreacionBoveda { get; set; }

        // Piso
        public int NumeroPiso { get; set; }
        public decimal PrecioPiso { get; set; }

        // Bloque
        public string NombreBloque { get; set; }
        public string CalleA { get; set; }
        public string CalleB { get; set; }
        public string TipoBloque { get; set; }

        // Cementerio
        public string NombreCementerio { get; set; }
        public string DireccionCementerio { get; set; }

        // Difunto (si está ocupada)
        public string NombresDifunto { get; set; }
        public string ApellidosDifunto { get; set; }
        public DateTime? FechaFallecimiento { get; set; }
        public string NumeroIdentificacionDifunto { get; set; }

        // Contrato
        public DateTime? FechaInicioContrato { get; set; }
        public DateTime? FechaFinContrato { get; set; }
        public decimal? MontoTotalContrato { get; set; }
        public string NumeroSecuencialContrato { get; set; }
        public bool? EsRenovacion { get; set; }

        // Información útil adicional
        public decimal? TarifaBaseBloque { get; set; }
        public string EstadoContrato { get; set; } // Activo o Inactivo
    }
}
