using System;

namespace gad_checa_gestion_cementerio.Models;

public class PaginacionBaseViewModel
{
    public int PaginaActual { get; set; } = 1;
    public int TotalPaginas { get; set; } = 1;

    public virtual int TotalResultados { get; set; } = 0;
    public string Filtro { get; set; }

    public bool TienePaginaAnterior => PaginaActual > 1;
    public bool TienePaginaSiguiente => PaginaActual < TotalPaginas;
}
