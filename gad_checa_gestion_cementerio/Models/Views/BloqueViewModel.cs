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

        [Required(ErrorMessage = "La descripción es obligatoria")]
        [Display(Name = "Descripción")]
        public string Descripcion { get; set; }

        [Required(ErrorMessage = "El tipo es obligatorio")]
        [Display(Name = "Tipo")]
        public string Tipo { get; set; }

        [Required(ErrorMessage = "La calle A es obligatoria")]
        [Display(Name = "Calle A")]
        public string CalleA { get; set; }

        [Required(ErrorMessage = "La calle B es obligatoria")]
        [Display(Name = "Calle B")]
        public string CalleB { get; set; }

        [Required(ErrorMessage = "El número de pisos es obligatorio")]
        [Range(1, 20, ErrorMessage = "El número de pisos debe estar entre 1 y 20")]
        [Display(Name = "Número de Pisos")]
        public int NumeroDePisos { get; set; }

        [Required(ErrorMessage = "El número de bóvedas por piso es obligatorio")]
        [Range(1, 100, ErrorMessage = "El número de bóvedas por piso debe estar entre 1 y 100")]
        [Display(Name = "Bóvedas por Piso")]
        public int BovedasPorPiso { get; set; }

        [Required(ErrorMessage = "La tarifa base es obligatoria")]
        [Range(0.01, double.MaxValue, ErrorMessage = "La tarifa base debe ser mayor a 0")]
        [Display(Name = "Tarifa Base")]
        public decimal TarifaBase { get; set; }

        [Required(ErrorMessage = "El cementerio es obligatorio")]
        [Display(Name = "Cementerio")]
        public int CementerioId { get; set; }

        public Cementerio? Cementerio { get; set; }

        public ICollection<Piso>? Pisos { get; set; }

        // Nuevas propiedades para estadísticas
        public int TotalBovedas => NumeroDePisos * BovedasPorPiso;
        public int BovedasOcupadas { get; set; }
        public int BovedasDisponibles => TotalBovedas - BovedasOcupadas;
        public decimal PorcentajeOcupacion => TotalBovedas > 0 ? (decimal)BovedasOcupadas / TotalBovedas * 100 : 0;

        // Información de difuntos
        public ICollection<DifuntoInfo>? Difuntos { get; set; }

        // Precios por piso
        public ICollection<PisoPrecioViewModel>? PreciosPorPiso { get; set; }

        // Bóvedas
        public ICollection<BovedaInfo>? Bovedas { get; set; }

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

    public class DifuntoInfo
    {
        public int Id { get; set; }
        public string Nombres { get; set; }
        public string Apellidos { get; set; }
        public DateTime? FechaFallecimiento { get; set; }
        public string NumeroBoveda { get; set; }
        public int NumeroPiso { get; set; }
        public string Propietario { get; set; }
    }

    public class BovedaInfo
    {
        public int Numero { get; set; }
        public string? NumeroSecuencial { get; set; }
        public int NumeroPiso { get; set; }
        public bool TieneContratoActivo { get; set; }
        public bool TienePropietario { get; set; }
        public DateTime? FechaFinContrato { get; set; }
        public PersonaModel? Propietario { get; set; }
        public string? NombreDifunto { get; set; }
        public string Estado => GetEstado();

        private string GetEstado()
        {
            if (TienePropietario) return "propietario";
            if (TieneContratoActivo)
            {
                if (FechaFinContrato.HasValue && FechaFinContrato.Value <= DateTime.Now.AddMonths(3))
                    return "por-liberar";
                return "ocupada";
            }
            return "disponible";
        }
    }

    public class PisoPrecioViewModel
    {
        public int NumeroPiso { get; set; }
        public bool UsarTarifaBase { get; set; }
        public decimal? PrecioPersonalizado { get; set; }
    }
}
