using System.Collections.Generic;
using gad_checa_gestion_cementerio.Models;

namespace gad_checa_gestion_cementerio.Models.Listas
{
    public class DifuntoPaginadaViewModel : PaginacionBaseViewModel
    {
        public IEnumerable<DifuntoModel> Difuntos { get; set; }
        public override int TotalResultados { get; set; }
    }
}
