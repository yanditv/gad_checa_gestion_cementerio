using System;
using gad_checa_gestion_cementerio.Utils;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace gad_checa_gestion_cementerio.Models.Listas;

public class BovedaPaginadaViewModel : PaginacionBaseViewModel
{
    public IEnumerable<BovedaModel> Bovedas { get; set; }
    public override int TotalResultados { get; set; }
    public string Filtro { get; set; }
    public string Tipo { get; set; }
    public int? BloqueId { get; set; }
    public IEnumerable<SelectListItem> Bloques { get; set; } = new List<SelectListItem>();
}
