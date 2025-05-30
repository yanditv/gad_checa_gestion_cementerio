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

        // Bloque
        public string NombreBloque { get; set; }
        public string TipoBloque { get; set; }

        // Cementerio (opcional si lo necesitas)
        public string? NombreCementerio { get; set; }

        // Contrato
        public string? NumeroSecuencialContrato { get; set; }
        public DateTime? FechaInicioContrato { get; set; }
        public DateTime? FechaFinContrato { get; set; }
        public int? NumeroDeMeses { get; set; }
        public decimal? MontoTotalContrato { get; set; }
        public bool? ContratoActivo { get; set; }

        // Difunto
        public string? NombresDifunto { get; set; }
        public string? ApellidosDifunto { get; set; }
        public DateTime? FechaFallecimiento { get; set; }
        public string? NumeroIdentificacionDifunto { get; set; }

        // Responsable
        public string? NombreResponsable { get; set; }
        public string? CedulaResponsable { get; set; }
        public string? TelefonoResponsable { get; set; }
    }
}
