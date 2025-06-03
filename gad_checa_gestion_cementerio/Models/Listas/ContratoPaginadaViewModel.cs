using System;

namespace gad_checa_gestion_cementerio.Models.Listas;

public class ContratoPaginadaViewModel : PaginacionBaseViewModel
{
    public List<ContratoModel> Contratos { get; set; }
}
