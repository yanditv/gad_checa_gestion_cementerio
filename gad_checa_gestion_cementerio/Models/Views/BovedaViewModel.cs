using gad_checa_gestion_cementerio.Data;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace gad_checa_gestion_cementerio.Models.Views
{
    public class BovedaViewModel
    {
        public BovedaViewModel()
        {
        }

        [Key]
        public int Id { get; set; }

        [Required]
        public int Numero { get; set; }

        [Required]
        public bool Estado { get; set; }

        // Auditoría
        public DateTime FechaCreacion { get; set; }



        public int PisoId { get; set; }
        public Piso Piso { get; set; } // Relación con el piso
    }
}
