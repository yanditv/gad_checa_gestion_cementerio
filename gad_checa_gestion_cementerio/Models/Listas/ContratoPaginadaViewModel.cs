using System;

namespace gad_checa_gestion_cementerio.Models.Listas;

public class ContratoPaginadaViewModel : PaginacionBaseViewModel
{
    public List<ContratoModel> Contratos { get; set; } = new List<ContratoModel>();

    // Propiedad adicional para mostrar el total de registros en el sistema
    public int TotalRegistros { get; set; }
}
