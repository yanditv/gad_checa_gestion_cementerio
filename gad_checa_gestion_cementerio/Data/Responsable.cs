using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace gad_checa_gestion_cementerio.Data
{
    public class Responsable : Persona
    {
        public Responsable()
        {
            this.Contratos = new List<Contrato>();
            this.FechaInicio = DateTime.Now;
        }
        public DateTime FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }

        public ICollection<Contrato> Contratos { get; set; }
    }
}
