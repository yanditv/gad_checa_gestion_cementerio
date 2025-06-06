using gad_checa_gestion_cementerio.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;

public class ContratoPDF : IDocument
{
    private readonly CreateContratoModel model;

    public ContratoPDF(CreateContratoModel model)
    {
        this.model = model;
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
        var presidente = "Sr. Bolívar Robles Iñamagua"; // Asumimos que el presidente es un valor fijo, se puede cambiar según sea necesario
        var telefono_cementerio = "0987654321"; // Asumimos un número de teléfono fijo para el cementerio, se puede cambiar según sea necesario
        var email_cementerio = "";
        var direccion_cementerio = "Calle Principal, Parroquia Checa"; // Asumimos una dirección fija para el cementerio, se puede cambiar según sea necesario
        var numero_cuenta = "2000324704"; // Asumimos un número de cuenta fijo, se puede cambiar según sea necesario
        container.Page(page =>
        {
            page.Margin(40);
            page.Size(PageSizes.A4);
            page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));
            page.Margin(70);

            page.Background().Image("wwwroot/logo_gad.png", ImageScaling.FitArea);

            page.Content().Column(column =>
            {
                column.Spacing(20);
                column.Item().PaddingVertical(15);
                column.Item().AlignCenter().Text("CONTRATO DE ARRIENDO DE BÓVEDA DEL CEMENTERIO DE LA PARROQUIA CHECA").Bold().FontSize(13);
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
                    text.Span(responsable?.NombresCompletos ?? "________________").Bold();
                    text.Span(" con número de identidad ");
                    text.Span(responsable?.NumeroIdentificacion ?? "__________").Bold();
                    text.Span(", número de teléfono ");
                    text.Span(responsable?.Telefono ?? "__________").Bold();
                    text.Span(", correo electrónico ");
                    text.Span(responsable?.Email ?? "________________").Bold();
                    text.Span(", los comparecientes son mayores de edad, capaces ante la ley para celebrar todo acto y contrato quienes celebran el presente contrato de arrendamiento de acuerdo con las siguientes cláusulas:");
                });

                column.Item().Text(text =>
                {
                    text.Span("PRIMERA COMPARECIENTES. -").Bold();
                    text.Span(" Comparecen por una parte el Gobierno Parroquial de Checa representada por su presidente el ");
                    text.Span(presidente).Bold();
                    text.Span("; a quien en lo posterior se lo llamará arrendador, y por otra parte comparece el/la Sr/Sra. ");
                    text.Span(responsables.FirstOrDefault()?.NombresCompletos ?? "________________").Bold();
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
                    text.Span(difunto.NombresCompletos).Bold();
                    text.Span(" con número de cédula ");
                    text.Span(difunto.NumeroIdentificacion).Bold();
                    text.Span(", restos que serán depositados en la bóveda número ");
                    text.Span(boveda?.NumeroSecuecial ?? "________________").Bold();
                    text.Span(" en el bloque ");
                    text.Span(boveda?.Piso?.Bloque?.Descripcion ?? "________________").Bold();
                    if (boveda?.Piso?.NumeroPiso != null)
                        text.Span($", piso {boveda.Piso.NumeroPiso}").Bold();
                });

                column.Item().Text(text =>
                {
                    text.Span("CUARTA: PRECIO. -").Bold();
                    text.Span(" El valor por arriendo de la Bóveda es de ");
                    text.Span(contrato.MontoTotal.ToString("C")).Bold();
                    text.Span($", valor que fue cancelado con depósito en el banco del Austro cta. # ");
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
                    text.Span($"{contrato.FechaFin:dd} de {contrato.FechaFin.ToString("MMMM", new CultureInfo("es-ES"))} del {contrato.FechaFin:yyyy}").Bold();
                    text.Span(".");
                });

                column.Item().Text(text =>
                {
                    text.Span("SEXTA: -").Bold();
                    text.Span(" Las partes por estar conforme con las estipulaciones del presente contrato, firman al pie del mismo y por duplicado para constancia de lo actuado suscriben.");
                });

                column.Item().Height(50);
                column.Item().AlignCenter().Row(row =>
                {
                    row.Spacing(100); // Espacio horizontal entre columnas (ajustable)

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
                        col.Item().AlignCenter().Text($"Sr/Sra. {responsable?.NombresCompletos ?? "________________"}").Bold();
                        col.Item().AlignCenter().Text($"CI. {responsable?.NumeroIdentificacion ?? "____________"}");
                        col.Item().AlignCenter().Text("ARRENDATARIO");
                    });
                });

            });
        });
    }
}
