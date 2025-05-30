namespace gad_checa_gestion_cementerio.Models.Views
{
   public class FiltroBovedasViewModel
{
    public string? TipoBloque { get; set; }
    public string? NombreBloque { get; set; }

    public List<string> TiposDisponibles { get; set; } = new();
    public List<string> BloquesDisponibles { get; set; } = new();

    public List<ReporteBovedasViewModel> Bovedas { get; set; } = new();
}



}
