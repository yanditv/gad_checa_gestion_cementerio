using System;

namespace gad_checa_gestion_cementerio.Utils
{
    /// <summary>
    /// Excepción base para errores relacionados con la generación de PDFs
    /// </summary>
    public class PdfException : Exception
    {
        public PdfException(string message) : base(message) { }
        public PdfException(string message, Exception innerException) : base(message, innerException) { }
    }

    /// <summary>
    /// Excepción cuando el servicio de PDF no está disponible
    /// </summary>
    public class PdfServiceUnavailableException : PdfException
    {
        public PdfServiceUnavailableException() : base("El servicio de generación de PDF no está disponible en este momento. Por favor, contacte al administrador.") { }
        public PdfServiceUnavailableException(string message) : base(message) { }
        public PdfServiceUnavailableException(string message, Exception innerException) : base(message, innerException) { }
    }

    /// <summary>
    /// Excepción cuando faltan datos requeridos para generar el PDF
    /// </summary>
    public class PdfDataException : PdfException
    {
        public PdfDataException(string message) : base(message) { }
        public PdfDataException(string message, Exception innerException) : base(message, innerException) { }
    }

    /// <summary>
    /// Excepción durante la generación del documento PDF
    /// </summary>
    public class PdfGenerationException : PdfException
    {
        public PdfGenerationException(string message) : base(message) { }
        public PdfGenerationException(string message, Exception innerException) : base(message, innerException) { }
    }
}
