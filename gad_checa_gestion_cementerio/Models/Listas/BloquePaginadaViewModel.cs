using System;

namespace gad_checa_gestion_cementerio.Models.Listas;

public class BloquePaginadaViewModel : PaginacionBaseViewModel
{
    public IEnumerable<BloqueModel> Bloque { get; set; }
    public override int TotalResultados { get; set; }
}
