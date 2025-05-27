namespace gad_checa_gestion_cementerio.Models.Views
{
    public class ReporteIngresoPorFechaViewModel
    {
        public DateTime FechaPago { get; set; }
        public string TipoPago { get; set; }
        public string NumeroComprobante { get; set; }
        public decimal Monto { get; set; }

        public string PagadoPor { get; set; }
        public string IdentificacionPagador { get; set; }

        public string NumeroContrato { get; set; }
        public string TipoIngreso { get; set; }

        public string Boveda { get; set; }
        public string Piso { get; set; }
        public string Bloque { get; set; }

        // Para encabezado de PDF
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
 
    }
}