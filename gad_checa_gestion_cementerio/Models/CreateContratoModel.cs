using gad_checa_gestion_cementerio.Data;

namespace gad_checa_gestion_cementerio.Models;

public class CreateContratoModel
{
    public CreateContratoModel()
    {
        contrato = new ContratoModel();
        difunto = new DifuntoModel();
        responsables = new List<ResponsableModel>();
        pago = new PagoModel();
    }
    public ContratoModel contrato { get; set; }
    public DifuntoModel difunto { get; set; }
    public List<ResponsableModel> responsables { get; set; }
    public PagoModel pago { get; set; }
    
    // Para manejar contratos relacionados (segundo difunto en la misma bóveda)
    public int? ContratoExistenteId { get; set; }
    public ContratoModel? ContratoExistente { get; set; }

}
