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

        [Required(ErrorMessage = "La descripción es requerida")]
        [StringLength(100, ErrorMessage = "La descripción no puede exceder los 100 caracteres")]
        [Display(Name = "Descripción")]
        public string Descripcion { get; set; }

        [Required(ErrorMessage = "La calle A es requerida")]
        [StringLength(100, ErrorMessage = "La calle A no puede exceder los 100 caracteres")]
        [Display(Name = "Calle A")]
        public string CalleA { get; set; }

        [Required(ErrorMessage = "La calle B es requerida")]
        [StringLength(100, ErrorMessage = "La calle B no puede exceder los 100 caracteres")]
        [Display(Name = "Calle B")]
        public string CalleB { get; set; }

        [Required(ErrorMessage = "El tipo es requerido")]
        [StringLength(50, ErrorMessage = "El tipo no puede exceder los 50 caracteres")]
        [Display(Name = "Tipo")]
        public string Tipo { get; set; }

        [Required(ErrorMessage = "El número de pisos es requerido")]
        [Range(1, 20, ErrorMessage = "El número de pisos debe estar entre 1 y 20")]
        [Display(Name = "Número de Pisos")]
        public int NumeroDePisos { get; set; }

        [Required(ErrorMessage = "El número de bóvedas por piso es requerido")]
        [Range(1, 100, ErrorMessage = "El número de bóvedas por piso debe estar entre 1 y 100")]
        [Display(Name = "Bóvedas por Piso")]
        public int BovedasPorPiso { get; set; }

        [Required(ErrorMessage = "La tarifa base es requerida")]
        [Range(0.01, 1000000, ErrorMessage = "La tarifa base debe ser mayor a 0")]
        [Display(Name = "Tarifa Base")]
        [DataType(DataType.Currency)]
        public decimal TarifaBase { get; set; }

        [Required(ErrorMessage = "El cementerio es requerido")]
        [Display(Name = "Cementerio")]
        public int CementerioId { get; set; }

        [Display(Name = "Precios por Piso")]
        public List<PisoPrecioViewModel> PreciosPorPiso { get; set; } = new List<PisoPrecioViewModel>();

        // Auditoría

        [Display(Name = "Fecha de Creación")]
        public DateTime FechaCreacion { get; set; }

        public readonly string UsuarioCreadorId;
        public readonly IdentityUser UsuarioCreador;

        override public string ToString()
        {
            return Descripcion;
        }
    }

    public class PisoPrecioViewModel
    {
        public int NumeroPiso { get; set; }

        [Display(Name = "Precio Personalizado")]
        [DataType(DataType.Currency)]
        public decimal? PrecioPersonalizado { get; set; }

        [Display(Name = "Usar Tarifa Base")]
        public bool UsarTarifaBase { get; set; } = true;
    }
}
