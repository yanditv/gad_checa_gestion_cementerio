using System;

namespace gad_checa_gestion_cementerio.Models.Listas;

public class PagoPaginadaViewModel : PaginacionBaseViewModel
{
    public IEnumerable<PagoModel> Pagos { get; set; }
}
