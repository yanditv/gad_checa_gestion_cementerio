using gad_checa_gestion_cementerio.Data;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace gad_checa_gestion_cementerio.Models.Views
{
    public class BovedaFilterModel
    {
        public BovedaFilterModel()
        {
            this.Bovedas = new List<BovedaViewModel>();
        }

        public int Bloque { get; set; }
        public int Piso { get; set; }
        public int getNumeroPisos
        {
            get
            {
                return this.Bovedas.Any()? this.Bovedas.Max(x=>x.Piso.NumeroPiso):0;	
            }
        }

        public List<BovedaViewModel> Bovedas { get; set; }
    }
}
