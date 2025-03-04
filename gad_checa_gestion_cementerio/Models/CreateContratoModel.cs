using System;
using gad_checa_gestion_cementerio.Data;

namespace gad_checa_gestion_cementerio.Models;

public class CreateContratoModel
{
    public CreateContratoModel()
    {
        contrato = new Contrato();
        difunto = new Difunto();
        responsables = new List<Responsable>();
        pago = new Pago();
    }
    public Contrato contrato { get; set; }
    public Difunto difunto { get; set; }
    public List<Responsable> responsables { get; set; }
    public Pago pago { get; set; }

}
