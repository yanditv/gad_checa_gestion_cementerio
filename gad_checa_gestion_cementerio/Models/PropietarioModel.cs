using System;

namespace gad_checa_gestion_cementerio.Models;

public class PropietarioModel : PersonaModel
{
    public PropietarioModel()
    {
        this.FechaInicio = DateTime.Now;
        this.Catastro = string.Empty;
    }
    public DateTime FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }

    public string Catastro { get; set; }
}
