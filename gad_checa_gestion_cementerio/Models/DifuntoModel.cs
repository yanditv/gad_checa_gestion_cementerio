using gad_checa_gestion_cementerio.Data;
using Microsoft.AspNetCore.Identity;
using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace gad_checa_gestion_cementerio.Models
{
    public class DifuntoModel
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "El campo {0} es requerido")]
        [StringLength(100)]
        [Display(Name = "Nombres")]
        public string Nombres { get; set; }
        [Required(ErrorMessage = "El campo {0} es requerido")]
        [StringLength(100)]
        public string Apellidos { get; set; }

        [Required(ErrorMessage = "El campo {0} es requerido")]
        [StringLength(20)]
        public string NumeroIdentificacion { get; set; }

        [Required(ErrorMessage = "El campo {0} es requerido")]
        public DateTime FechaNacimiento { get; set; }
        [Required(ErrorMessage = "El campo {0} es requerido")]
        public DateTime FechaFallecimiento { get; set; }

        [Required(ErrorMessage = "El campo {0} es requerido")]
        [ForeignKey("Descuento")]
        public int DescuentoId { get; set; }

        public string NombresCompletos => $"{Nombres} {Apellidos}";
    }

}
