using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;
using System.IO;

public class ContratoPDF : IDocument
{
    private readonly CreateContratoModel model;
    private readonly Cementerio cementerio;

    public ContratoPDF(CreateContratoModel model, Cementerio cementerio)
    {
        this.model = model;
        this.cementerio = cementerio;
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container)
    {
        var contrato = model.contrato;
        var boveda = model.contrato.Boveda;
        var difunto = model.difunto;
        var responsables = model.responsables;
        var responsable = model.responsables.FirstOrDefault();
        var pago = model.pago;

        // Logging detallado para identificar problemas
        Console.WriteLine($"=== GENERANDO PDF ===");
        Console.WriteLine($"Presidente: {cementerio.Presidente} (Length: {cementerio.Presidente?.Length ?? 0})");
        Console.WriteLine($"Difunto: {difunto?.NombresCompletos} (Length: {difunto?.NombresCompletos?.Length ?? 0})");
        Console.WriteLine($"Responsable: {responsable?.NombresCompletos} (Length: {responsable?.NombresCompletos?.Length ?? 0})");
        Console.WriteLine($"Observaciones: {contrato.Observaciones?.Length ?? 0} caracteres");
        Console.WriteLine($"Bloque: {boveda?.Piso?.Bloque?.Descripcion} (Length: {boveda?.Piso?.Bloque?.Descripcion?.Length ?? 0})");

        var presidente = TruncateText(cementerio.Presidente ?? "Presidente del GAD Parroquial de Checa", 60);
        var telefono_cementerio = TruncateText(cementerio.Telefono ?? "02-XXXXXXX", 15);
        var email_cementerio = TruncateText(cementerio.Email ?? "checa@example.gob.ec", 40);
        var direccion_cementerio = TruncateText(cementerio.Direccion ?? "Checa, Ecuador", 60);
        var entidad_financiera = cementerio.EntidadFinanciera ?? "Banco";
        var NombreEntidadFinanciera = TruncateText(cementerio.NombreEntidadFinanciera ?? "Banco del Austro", 40);
        var numero_cuenta = TruncateText(cementerio.NumeroCuenta ?? "2000324704", 20);
        var abreviatura_banco = cementerio.EntidadFinanciera == "BANCO" ? "el banco" : "la Cooperativa de Ahorro y Crédito";

        // Validar y truncar observaciones para evitar texto excesivamente largo
        if (!string.IsNullOrWhiteSpace(contrato.Observaciones) && contrato.Observaciones.Length > 300)
        {
            Console.WriteLine($"ADVERTENCIA: Observaciones truncadas de {contrato.Observaciones.Length} a 300 caracteres");
            contrato.Observaciones = contrato.Observaciones.Substring(0, 297) + "...";
        }
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));

            // Intentar cargar el logo de manera segura
            try
            {
                var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "logo_gad.png");
                if (System.IO.File.Exists(logoPath))
                {
                    page.Header().AlignCenter().Image(Image.FromFile(logoPath)).FitWidth();
                }
            }
            catch
            {
                // Si no se puede cargar el logo, simplemente continuar sin él
            }

            // Intentar cargar el fondo de manera segura
            try
            {
                var backgroundPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "background.jpg");
                if (System.IO.File.Exists(backgroundPath))
                {
                    page.Background().AlignCenter().AlignMiddle().Image(Image.FromFile(backgroundPath)).FitWidth();
                }
            }
            catch
            {
                // Si no se puede cargar el fondo, simplemente continuar sin él
            }

            page.Footer().AlignCenter().PaddingBottom(20).Text(text =>
            {
                text.DefaultTextStyle(x => x.FontSize(9));
                text.Span("Dirección: ").SemiBold();
                text.Span(direccion_cementerio + "  |  ");
                text.Span("Teléfono: ").SemiBold();
                text.Span(telefono_cementerio + "  |  ");
                text.Span("Correo: ").SemiBold();
                text.Span(email_cementerio);
            });

            page.Content()
            .PaddingHorizontal(60)
            .PaddingVertical(20)
            .Column(column =>
            {
                column.Spacing(20);

                column.Item().AlignCenter().Text(TruncateText($"CONTRATO DE ARRIENDO DE BÓVEDA DEL CEMENTERIO DE LA PARROQUIA CHECA NRO. {contrato.NumeroSecuencial ?? "S/N"}", 100)).Bold().FontSize(13);

                column.Item().Text(text =>
                {
                    text.Span("En la Parroquia de Checa, a los ");
                    text.Span($"{contrato.FechaInicio:dd}").Bold();
                    text.Span(" días del mes de ");
                    text.Span($"{contrato.FechaInicio.ToString("MMMM", new CultureInfo("es-ES"))}").Bold();
                    text.Span(" del ");
                    text.Span($"{contrato.FechaInicio:yyyy}").Bold();
                    text.Span(", comparecen a celebrar el presente contrato de arrendamiento, por una parte y en calidad de arrendador, el Gobierno Parroquial de Checa, debidamente representado por el ");
                    text.Span(presidente).Bold();
                    text.Span("; por otro lado, el/la Sr/Sra. ");
                    text.Span(TruncateText(responsable?.NombresCompletos ?? "________________", 50)).Bold();
                    text.Span(" con número de identidad ");
                    text.Span(TruncateText(responsable?.NumeroIdentificacion ?? "__________", 20)).Bold();
                    text.Span(", número de teléfono ");
                    text.Span(TruncateText(responsable?.Telefono ?? "__________", 15)).Bold();
                    text.Span(", correo electrónico ");
                    text.Span(TruncateText(responsable?.Email ?? "________________", 30)).Bold();
                    text.Span(", los comparecientes son mayores de edad, capaces ante la ley para celebrar todo acto y contrato quienes celebran el presente contrato de arrendamiento de acuerdo con las siguientes cláusulas:");
                });

                column.Item().Text(text =>
                {
                    text.Span("PRIMERA COMPARECIENTES. -").Bold();
                    text.Span(" Comparecen por una parte el Gobierno Parroquial de Checa representada por su presidente el ");
                    text.Span(presidente).Bold();
                    text.Span("; a quien en lo posterior se lo llamará arrendador, y por otra parte comparece el/la Sr/Sra. ");
                    text.Span(TruncateText(responsables.FirstOrDefault()?.NombresCompletos ?? "________________", 50)).Bold();
                    text.Span(" a quien en lo posterior se le llamará Arrendatario.");
                });

                column.Item().Text(text =>
                {
                    text.Span("SEGUNDA ANTECEDENTE. -").Bold();
                    text.Span(" El Gobierno Parroquial de Checa es la Institución Pública que administra el Cementerio General de la Parroquia, es por ello que se encuentra facultado para suscribir todo contrato de arrendamiento o venta de bóveda del cementerio.");
                });

                column.Item().Text(text =>
                {
                    text.Span("TERCER OBJETO. -").Bold();
                    text.Span(" El Gobierno Parroquial de Checa, en su calidad de Administrador del Cementerio General de la Parroquia, por el presente contrato da en arriendo una bóveda a favor de quien en vida fue: ");
                    text.Span(TruncateText(difunto.NombresCompletos, 50)).Bold();
                    text.Span(" con número de cédula ");
                    text.Span(TruncateText(difunto.NumeroIdentificacion, 20)).Bold();
                    text.Span(", restos que serán depositados en la bóveda número ");
                    text.Span(TruncateText(boveda?.NumeroSecuencial != "S/N" ? boveda?.NumeroSecuencial : boveda?.Numero.ToString() ?? "________________", 20)).Bold();
                    text.Span(" en el bloque ");
                    text.Span(TruncateText(boveda?.Piso?.Bloque?.Descripcion ?? "________________", 30)).Bold();
                    if (boveda?.Piso?.NumeroPiso != null)
                        text.Span($", piso {boveda.Piso.NumeroPiso}.").Bold();
                });

                column.Item().Text(text =>
                {
                    text.Span("CUARTA: PRECIO. -").Bold();
                    text.Span(" El valor por arriendo de la Bóveda es de ");
                    text.Span(contrato.Cuotas.Sum(x => x.Monto).ToString("C", new CultureInfo("en-US"))).Bold();
                    text.Span($", valor que fue cancelado con depósito en {abreviatura_banco} del {NombreEntidadFinanciera} cta. # ");
                    text.Span(numero_cuenta).Bold();
                });

                column.Item().Text(text =>
                {
                    text.Span("QUINTA: OTRA. -").Bold();
                    text.Span(" La parte arrendadora aclara que una vez que el Gobierno Parroquial entrega el derecho de uso por ");
                    text.Span($"{contrato.Cuotas.Count()} años").Bold();
                    text.Span(" a partir de la fecha del ");
                    text.Span($"{contrato.FechaInicio:dd} de {contrato.FechaInicio.ToString("MMMM", new CultureInfo("es-ES"))} del {contrato.FechaInicio:yyyy}").Bold();
                    text.Span(", la parte arrendataria. Vence el contrato el ");
                    text.Span($"{contrato.FechaFin?.ToString("dd") ?? "--"} de {contrato.FechaFin?.ToString("MMMM", new CultureInfo("es-ES")) ?? "--------"} del {contrato.FechaFin?.ToString("yyyy") ?? "----"}").Bold();
                    text.Span(".");
                });

                column.Item().Text(text =>
                {
                    text.Span("SEXTA: -").Bold();
                    text.Span(" Las partes por estar conforme con las estipulaciones del presente contrato, firman al pie del mismo y por duplicado para constancia de lo actuado suscriben.");
                });

                // Mostrar observaciones solo si existen
                if (!string.IsNullOrWhiteSpace(contrato.Observaciones))
                {
                    column.Item().Text(text =>
                    {
                        text.Span("OBSERVACIONES: -").Bold();
                        text.Span($" {contrato.Observaciones}");
                    });
                }

                column.Item().PaddingTop(20);
                column.Item().AlignCenter().Row(row =>
                {
                    row.Spacing(40); // Espacio horizontal entre columnas - reducido para evitar overflow

                    row.AutoItem().Column(col =>
                    {
                        col.Item().AlignCenter().Text("____________________________").Bold();
                        col.Item().AlignCenter().Text(presidente).Bold();
                        col.Item().AlignCenter().Text("PRESIDENTE GAD CHECA");
                        col.Item().AlignCenter().Text("ARRENDADOR");
                    });

                    row.AutoItem().Column(col =>
                    {
                        var responsable = responsables.FirstOrDefault();
                        col.Item().AlignCenter().Text("____________________________").Bold();
                        col.Item().AlignCenter().Text(TruncateText($"Sr/Sra. {responsable?.NombresCompletos ?? "________________"}", 40)).Bold();
                        col.Item().AlignCenter().Text(TruncateText($"CI. {responsable?.NumeroIdentificacion ?? "____________"}", 25));
                        col.Item().AlignCenter().Text("ARRENDATARIO");
                    });
                });

            });
        });
    }

    // Método auxiliar para truncar texto y evitar problemas de layout
    private static string TruncateText(string text, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(text))
            return text ?? "";

        if (text.Length <= maxLength)
            return text;

        return text.Substring(0, maxLength - 3) + "...";
    }
}
