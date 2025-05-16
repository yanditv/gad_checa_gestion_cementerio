using AutoMapper;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Models.Views;
using gad_checa_gestion_cementerio.Data;
namespace gad_checa_gestion_cementerio.Utils
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Configura los mapeos aquí
            CreateMap<Bloque, BloqueModel>();
            CreateMap<BloqueModel, Bloque>();
            CreateMap<BloqueViewModel, Bloque>();
            CreateMap<Bloque, BloqueViewModel>();

            CreateMap<Persona, PersonaModel>();
            CreateMap<PersonaModel, Persona>();

            CreateMap<Boveda, BovedaViewModel>();
            CreateMap<BovedaViewModel, Boveda>();


            CreateMap<Piso, PisoModel>();
            CreateMap<PisoModel, Piso>();

            CreateMap<GADInformacion, GADInformacion>();

            CreateMap<Cementerio, CementerioModel>();
            CreateMap<CementerioModel, Cementerio>();


            CreateMap<Cuota, CuotaModel>();
            CreateMap<Pago, PagoModel>();
            CreateMap<Responsable, ResponsableModel>();

            // Ejemplo:
            // CreateMap<Origen, Destino>()
            //     .ForMember(dest => dest.PropiedadDestino, opt => opt.MapFrom(src => src.PropiedadOrigen));

            // Puedes agregar más mapeos según sea necesario
        }
    }
}
