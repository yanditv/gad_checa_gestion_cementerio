using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using QuestPDF.Helpers;
using gad_checa_gestion_cementerio.Models.Views;
using System.Collections.Generic;
using System.Linq;
using System.IO;

public class IngresosPorFechaPdfDocument : IDocument
{
    private readonly List<ReporteIngresoPorFechaViewModel> _ingresos;

    public IngresosPorFechaPdfDocument(List<ReporteIngresoPorFechaViewModel> ingresos)
    {
        _ingresos = ingresos;
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Margin(30);
            page.Size(PageSizes.A4);

            var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "logo_gad.png");

            page.Header().Column(column =>
            {
                column.Item().AlignCenter().Width(500).Height(100).Image(logoPath).FitArea();
                column.Item().Text("REPORTE DE INGRESOS POR FECHA")
                    .FontSize(20)
                    .Bold()
                    .FontColor(Colors.Black)
                    .AlignCenter();
            });

            page.Content().Element(ComposeTable);
        });
    }

    void ComposeTable(IContainer container)
    {
        container.PaddingTop(15).Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.ConstantColumn(70);  // Fecha
                columns.RelativeColumn();    // Bóveda
                columns.RelativeColumn();    // Tipo
                columns.RelativeColumn();    // Pagado por
                columns.RelativeColumn();    // Comprobante
                columns.ConstantColumn(80);  // Monto
            });

            // Header
            table.Header(header =>
            {
                foreach (var title in new[] {
                    "Fecha", "Bóveda", "Tipo Ingreso", "Pagado Por", "Comprobante", "Monto"
                })
                {
                    header.Cell().Background(Colors.Grey.Lighten3)
                        .Padding(5)
                        .AlignCenter()
                        .AlignMiddle()
                        .Text(title)
                        .FontSize(9)
                        .Bold();
                }
            });

            // Body
            foreach (var ingreso in _ingresos)
            {
                table.Cell().Element(CellStyle).Text(ingreso.FechaPago.ToShortDateString()).FontSize(9);
                table.Cell().Element(CellStyle).Text(ingreso.Boveda).FontSize(9);
                table.Cell().Element(CellStyle).Text(ingreso.TipoIngreso).FontSize(9);
                table.Cell().Element(CellStyle).Text(ingreso.PagadoPor).FontSize(9);
                table.Cell().Element(CellStyle).Text(ingreso.NumeroComprobante).FontSize(9);
                table.Cell().Element(CellStyle).Text($"${ingreso.Monto:F2}").FontSize(9);
            }

            // Footer
            table.Footer(footer =>
            {
                footer.Cell().ColumnSpan(5).Element(CellStyle).AlignRight().Text("TOTAL:").Bold();
                footer.Cell().Element(CellStyle).Text($"${_ingresos.Sum(i => i.Monto):F2}").Bold();
            });
        });
    }

    IContainer CellStyle(IContainer container)
    {
        return container
            .Border(0.5f)
            .BorderColor(Colors.Grey.Lighten2)
            .PaddingVertical(5)
            .PaddingHorizontal(3);
    }
}
