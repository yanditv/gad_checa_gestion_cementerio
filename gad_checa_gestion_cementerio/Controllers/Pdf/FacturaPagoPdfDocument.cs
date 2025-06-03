using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using QuestPDF.Helpers;
using gad_checa_gestion_cementerio.Data;
using System.IO;
using System.Linq;

namespace gad_checa_gestion_cementerio.Controllers.Pdf
{
    public class FacturaPagoPdfDocument : IDocument
    {
        private readonly Pago _pago;
        private readonly Persona _responsable;

        public FacturaPagoPdfDocument(Pago pago, Persona responsable)
        {
            _pago = pago;
            _responsable = responsable;
        }

        public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

        public void Compose(IDocumentContainer container)
        {
            var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/images", "logo.jpeg");

            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(11));

                // Encabezado con logo y título
                page.Header().Column(column =>
                {
                    column.Item().Width(200).Height(120).Image(logoPath).FitArea();
                    column.Item().AlignCenter().Text("FACTURA DE PAGO").FontSize(20).Bold();
                });

                // Contenido
                page.Content().Element(ComposeContent);
            });
        }

        private void ComposeContent(IContainer container)
        {
            var primeraCuota = _pago.Cuotas.FirstOrDefault();
            var contrato = primeraCuota?.Contrato;
            var boveda = contrato?.Boveda;
            var cementerio = boveda?.Piso?.Bloque?.Cementerio;

            container.Column(col =>
            {
                // Información del Cementerio
                col.Item().Text($"Cementerio: {cementerio?.Nombre ?? "N/A"}").Bold();
                col.Item().Text($"Dirección: {cementerio?.Direccion ?? "N/A"}");
                col.Item().PaddingVertical(10);

                // Información del cliente y contrato
                col.Item().Row(row =>
                {
                    row.RelativeColumn().Column(c =>
                    {
                        c.Item().Text($"Razón social / Nombres y Apellidos: {_responsable.Nombres} {_responsable.Apellidos}").Bold();
                        c.Item().Text($"Fecha de Emisión: {_pago.FechaPago:dd/MM/yyyy}");
                        c.Item().Text($"Dirección: {_responsable.Direccion}");
                    });

                    row.ConstantColumn(250).Column(c =>
                    {
                        c.Item().Text($"Identificación: {_responsable.NumeroIdentificacion}");
                        c.Item().Text($"Fecha de Vencimiento: {primeraCuota?.FechaVencimiento:dd/MM/yyyy}");
                        c.Item().Text($"Origen: {contrato?.NumeroSecuencial ?? "N/A"}");
                    });
                });

                col.Item().PaddingVertical(10);

                // Tabla de cuotas pagadas con bordes
                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(2);   // Código
                        columns.RelativeColumn(4);   // Descripción
                        columns.ConstantColumn(80);  // Precio Unitario
                        columns.ConstantColumn(60);  // Descuento
                        columns.ConstantColumn(80);  // Total
                    });

                    table.Header(header =>
                    {
                        header.Cell().BorderBottom(1).Padding(2).Text("Código Principal").Bold();
                        header.Cell().BorderBottom(1).Padding(2).Text("Descripción").Bold();
                        header.Cell().BorderBottom(1).Padding(2).AlignRight().Text("Precio Unitario").Bold();
                        header.Cell().BorderBottom(1).Padding(2).AlignRight().Text("Descuento").Bold();
                        header.Cell().BorderBottom(1).Padding(2).AlignRight().Text("Precio Total").Bold();
                    });

                    foreach (var cuota in _pago.Cuotas)
                    {
                        table.Cell().BorderBottom(0.5f).Padding(2).Text("CUOTA-" + cuota.Id);
                        table.Cell().BorderBottom(0.5f).Padding(2).Text($"Pago cuota con vencimiento {cuota.FechaVencimiento:dd/MM/yyyy}");
                        table.Cell().BorderBottom(0.5f).Padding(2).AlignRight().Text(cuota.Monto.ToString("C"));
                        table.Cell().BorderBottom(0.5f).Padding(2).AlignRight().Text("$ 0.00");
                        table.Cell().BorderBottom(0.5f).Padding(2).AlignRight().Text(cuota.Monto.ToString("C"));
                    }
                });

                col.Item().PaddingVertical(10);

                // Total (sin IVA)
                var total = _pago.Cuotas.Sum(cuota => cuota.Monto);
                col.Item().Row(row =>
                {
                    row.RelativeColumn();
                    row.ConstantColumn(250).Column(c =>
                    {
                        c.Item().Row(r =>
                        {
                            r.RelativeColumn().Text("Total:");
                            r.ConstantColumn(100).AlignRight().Text(total.ToString("C")).Bold();
                        });
                    });
                });

                col.Item().PaddingTop(15);

                // Información adicional y forma de pago
                col.Item().Text("Información Adicional").Bold();
                col.Item().Text($"Email: {_responsable.Email ?? "N/A"}");

                col.Item().PaddingTop(10);
                col.Item().AlignRight().Row(row =>
                {
                    row.ConstantColumn(120).Text("Forma de Pago:").Bold();
                    row.ConstantColumn(120).AlignRight().Text(_pago.TipoPago);
                });
            });
        }
    }
}
