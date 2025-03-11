namespace gad_checa_gestion_cementerio.Models
{
    public class ResponsableModel : PersonaModel
    {
        public ResponsableModel()
        {
            this.FechaInicio = DateTime.Now;
        }
        public DateTime FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
    }
}
