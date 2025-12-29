namespace gad_checa_gestion_cementerio.Models.Views
{
    public class FiltroBovedasViewModel
    {
        public string? TipoBloque { get; set; }
        public string? NombreBloque { get; set; }

        public List<string> TiposDisponibles { get; set; } = new();
        public List<string> BloquesDisponibles { get; set; } = new();

        public List<ReporteBovedasViewModel> Bovedas { get; set; } = new();

        // Estadísticas exactamente como el dashboard
        public int TotalGeneral { get; set; }
        public int TotalBovedas { get; set; }
        public int TotalNichos { get; set; }

        // Separados por tipo como en dashboard
        public int BovedasDisponibles { get; set; }
        public int BovedasOcupadas { get; set; }
        public int NichosDisponibles { get; set; }
        public int NichosOcupados { get; set; }
        public int BovedasPorCaducar { get; set; }
    }



}
