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

            CreateMap<Persona, Responsable>();
            CreateMap<Responsable, Persona>();

            CreateMap<Propietario, Responsable>();
            CreateMap<Responsable, Propietario>();

            CreateMap<PersonaModel, Responsable>();



            CreateMap<Boveda, BovedaViewModel>();
            CreateMap<BovedaViewModel, Boveda>();
            CreateMap<Boveda, BovedaModel>();
            CreateMap<BovedaModel, Boveda>();


            CreateMap<Piso, PisoModel>();
            CreateMap<PisoModel, Piso>();

            CreateMap<GADInformacion, GADInformacion>();
            CreateMap<GADInformacion, GADInformacion>();

            CreateMap<Cementerio, CementerioModel>();
            CreateMap<CementerioModel, Cementerio>();


            CreateMap<Cuota, CuotaModel>();
            CreateMap<CuotaModel, Cuota>();
            // Pago
            CreateMap<Pago, PagoModel>();
            CreateMap<PagoModel, Pago>();
            //responsable
            CreateMap<Responsable, ResponsableModel>();
            CreateMap<ResponsableModel, Responsable>();

            //propietario
            CreateMap<Propietario, PropietarioModel>();
            CreateMap<PropietarioModel, Propietario>();

            //contrato
            CreateMap<Contrato, ContratoModel>();
            CreateMap<ContratoModel, Contrato>();

            //difunto
            CreateMap<Difunto, DifuntoModel>();
            CreateMap<DifuntoModel, Difunto>();
            //Boveda

            // Ejemplo:
            // CreateMap<Origen, Destino>()
            //     .ForMember(dest => dest.PropiedadDestino, opt => opt.MapFrom(src => src.PropiedadOrigen));

            // Puedes agregar más mapeos según sea necesario
        }
    }
}
