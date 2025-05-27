using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using QuestPDF.Helpers;
using gad_checa_gestion_cementerio.Models.Views;
using System.Collections.Generic;
using System.Linq;

public class BovedasPdfDocument : IDocument
{
    private readonly List<ReporteBovedasViewModel> _viewModels;

    public BovedasPdfDocument(List<ReporteBovedasViewModel> viewModels)
    {
        _viewModels = viewModels;
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Margin(30);
            page.Size(PageSizes.A4);

            page.Header().Text("Reporte de Bóvedas")
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
                columns.ConstantColumn(60); // Nº Bóveda
                columns.RelativeColumn();   // Piso
                columns.RelativeColumn();   // Estado
                columns.RelativeColumn();   // Fecha Creación
            });

            // Header
            table.Header(header =>
            {
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Bóveda").Bold();
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Piso").Bold();
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Estado").Bold();
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Creación").Bold();
            });

            // Body
            foreach (var item in _viewModels)
            {
                table.Cell().Element(CellStyle).Text(item.NumeroBoveda.ToString());
                table.Cell().Element(CellStyle).Text(item.NumeroPiso.ToString());
                table.Cell().Element(CellStyle).Text(item.EstadoBoveda);
                table.Cell().Element(CellStyle).Text(item.FechaCreacionBoveda.ToShortDateString());
            }

            // Footer (opcional)
            table.Footer(footer =>
            {
                footer.Cell().ColumnSpan(3).Element(CellStyle).AlignRight().Text("TOTAL:").Bold();
                footer.Cell().Element(CellStyle).Text(_viewModels.Count.ToString()).Bold();
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
