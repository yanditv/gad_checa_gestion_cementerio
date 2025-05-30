using System;

namespace gad_checa_gestion_cementerio.Data;

public class Propietario : Persona
{
    public Propietario()
    {
        this.Bovedas = new List<Boveda>();
        this.FechaInicio = DateTime.Now;
    }
    public DateTime FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }

    public string Catastro { get; set; }

    public ICollection<Boveda> Bovedas { get; set; }

}
