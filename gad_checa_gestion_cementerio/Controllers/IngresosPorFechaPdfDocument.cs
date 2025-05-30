using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using QuestPDF.Helpers;
using gad_checa_gestion_cementerio.Models.Views;
using System.Collections.Generic;

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

            page.Header().Text("Reporte de Ingresos por Fecha")
                .FontSize(18)
                .SemiBold()
                .FontColor(Colors.Blue.Medium);

            page.Content().Element(ComposeTable);
        });
    }

    void ComposeTable(IContainer container)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.ConstantColumn(70);  // Fecha
                columns.RelativeColumn();    // Bóveda
                columns.RelativeColumn();    // Tipo
                columns.RelativeColumn();    // Pagado por
                columns.RelativeColumn();    // Comprobante
                columns.RelativeColumn();    // Monto
            });

            // Header
            table.Header(header =>
            {
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Fecha").Bold();
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Bóveda").Bold();
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Tipo Ingreso").Bold();
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Pagado Por").Bold();
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Comprobante").Bold();
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Monto").Bold();
            });

            // Body
            foreach (var ingreso in _ingresos)
            {
                table.Cell().Element(CellStyle).Text(ingreso.FechaPago.ToShortDateString());
                table.Cell().Element(CellStyle).Text(ingreso.Boveda);
                table.Cell().Element(CellStyle).Text(ingreso.TipoIngreso);
                table.Cell().Element(CellStyle).Text(ingreso.PagadoPor);
                table.Cell().Element(CellStyle).Text(ingreso.NumeroComprobante);
                table.Cell().Element(CellStyle).Text($"${ingreso.Monto:F2}");
            }

            // Footer
            table.Footer(footer =>
            {
                footer.Cell().ColumnSpan(5).Element(CellStyle).AlignRight().Text("TOTAL:").Bold();
                footer.Cell().Element(CellStyle).Text($"${_ingresos.Sum(i => i.Monto):F2}").Bold();
            });
        });
    }

    IContainer CellStyle(IContainer container) =>
        container.Border(0.5f).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5).PaddingHorizontal(3);
}
