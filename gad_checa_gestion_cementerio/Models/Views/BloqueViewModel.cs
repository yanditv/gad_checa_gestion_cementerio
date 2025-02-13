using gad_checa_gestion_cementerio.Data;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Collections.ObjectModel;

namespace gad_checa_gestion_cementerio.Models.Views
{
    public class BloqueViewModel
    {
        public BloqueViewModel()
        {
        }

        public int Id { get; set; }

        [Display(Name = "Descripción")]
        public string Descripcion { get; set; }

        [Display(Name = "Calle A")]
        public string CalleA { get; set; }

        [Display(Name = "Calle B")]
        public string CalleB { get; set; }

        [Display(Name = "Tipo")]
        public string Tipo { get; set; }
        [Display(Name = "Número de Pisos")]
        public int NumeroDePisos { get; set; }

        [Display(Name = "Tarifa Base")]
        public decimal TarifaBase { get; set; }


        // Auditoría

        [Display(Name = "Fecha de Creación")]
        public  DateTime FechaCreacion { get; set; }

        public readonly string UsuarioCreadorId;
        public readonly IdentityUser UsuarioCreador;

        override public string ToString()
        {
            return Descripcion;
        }
    }
}
