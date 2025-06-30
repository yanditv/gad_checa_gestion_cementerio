namespace gad_checa_gestion_cementerio.Models.Views
{
    public class ReporteBovedasViewModel
    {
        // Bóveda
        public int BovedaId { get; set; }
        public required string NumeroBoveda { get; set; }
        public string EstadoBoveda { get; set; } = string.Empty; // Deprecated, usar GetEstadoCalculado()
        public DateTime FechaCreacionBoveda { get; set; }

        // Piso
        public int NumeroPiso { get; set; }

        // Bloque
        public required string NombreBloque { get; set; }
        public required string TipoBloque { get; set; }

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

        // PROPIETARIO DE LA BOVEDA
        public string? NombrePropietario { get; set; }
        public string? CedulaPropietario { get; set; }

        // Métodos para calcular el estado basado en contratos
        public bool TieneContratoActivo()
        {
            if (FechaInicioContrato == null || FechaFinContrato == null)
                return false;

            var fechaActual = DateTime.Now.Date;
            return fechaActual >= FechaInicioContrato.Value.Date &&
                   fechaActual <= FechaFinContrato.Value.Date;
        }

        public bool TieneContratoPorCaducar()
        {
            if (FechaFinContrato == null)
                return false;

            var fechaActual = DateTime.Now.Date;
            var fechaLimite = FechaFinContrato.Value.Date;
            var diasRestantes = (fechaLimite - fechaActual).Days;

            // Contrato por caducar si le quedan 30 días o menos pero aún no ha vencido
            return diasRestantes <= 30 && diasRestantes > 0;
        }

        public string GetEstadoCalculado()
        {
            if (TieneContratoActivo())
                return "Ocupada";
            else if (TieneContratoPorCaducar())
                return "Por Caducar";
            else
                return "Libre";
        }

        public string GetInfoAdicionalEstado()
        {
            if (TieneContratoPorCaducar() && FechaFinContrato != null)
            {
                var diasRestantes = (FechaFinContrato.Value.Date - DateTime.Now.Date).Days;
                return $"({diasRestantes} días restantes)";
            }
            return "";
        }

        public string GetCssClassEstado()
        {
            var estado = GetEstadoCalculado();
            return estado switch
            {
                "Ocupada" => "text-success fw-bold",
                "Por Caducar" => "text-warning fw-bold",
                "Libre" => "text-secondary",
                _ => "text-muted"
            };
        }

        public string GetDuracionFormateada()
        {
            if (NumeroDeMeses == null || NumeroDeMeses <= 0)
                return "";

            var años = NumeroDeMeses.Value / 12;
            var mesesRestantes = NumeroDeMeses.Value % 12;

            if (años > 0 && mesesRestantes > 0)
                return $"{años} año{(años > 1 ? "s" : "")} {mesesRestantes} mes{(mesesRestantes > 1 ? "es" : "")}";
            else if (años > 0)
                return $"{años} año{(años > 1 ? "s" : "")}";
            else
                return $"{mesesRestantes} año{(mesesRestantes > 1 ? "s" : "")}";
        }
    }
}
