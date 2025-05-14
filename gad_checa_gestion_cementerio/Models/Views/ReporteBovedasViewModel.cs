
using gad_checa_gestion_cementerio.Data;

namespace gad_checa_gestion_cementerio.Models.Views
{
    public class ReporteBovedasViewModel
    {
        public int BovedaId { get; set; }      // El ID de la bóveda
        public int Numero { get; set; }     // El número de la bóveda
        public string Estado { get; set; }     // Estado: Ocupada o Libre
        public int NumeroPiso { get; set; }       // Piso de la bóveda public List<Boveda> Bovedas { get; set; }
        public decimal TotalEnBoveda { get; set; }
    }
}
