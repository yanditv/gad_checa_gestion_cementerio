using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using QuestPDF.Helpers;
using gad_checa_gestion_cementerio.Models.Views;
using System.Collections.Generic;
using static QuestPDF.Helpers.PageSizes;
using System.IO;
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

            var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "logo_gad.png");

            page.Header().Column(column =>
            {
                column.Item().AlignCenter().Width(500).Height(100).Image(logoPath).FitArea();
                column.Item().Text("REPORTE DE BÓVEDAS")
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
                columns.RelativeColumn(1); // Bóveda
                columns.RelativeColumn(1); // Piso
                columns.RelativeColumn(1); // Estado
                columns.RelativeColumn(2); // Bloque
                columns.RelativeColumn(1); // Tipo
                columns.RelativeColumn(2); // Contrato
                columns.RelativeColumn(1); // Duración
                columns.RelativeColumn(2); // Responsable
                columns.RelativeColumn(2); // Difunto
            });

            // Encabezado
            table.Header(header =>
            {
                foreach (var title in new[] {
                    "Bóveda", "Piso", "Estado", "Bloque", "Tipo",
                    "Contrato", "Duración", "Difunto"
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

            // Filas
            foreach (var item in _viewModels)
            {
                string contrato = item.NumeroSecuencialContrato != null
                    ? $"{item.NumeroSecuencialContrato}\n{item.FechaInicioContrato?.ToShortDateString()} - {item.FechaFinContrato?.ToShortDateString()}"
                    : "Sin contrato";

                string duracion = item.NumeroDeMeses != null
                    ? $"{item.NumeroDeMeses} meses"
                    : "-";

                string responsable = item.NombreResponsable != null
                    ? $"{item.NombreResponsable}\n{item.CedulaResponsable}"
                    : "N/A";

                string difunto = item.NombresDifunto != null
                    ? $"{item.NombresDifunto} {item.ApellidosDifunto}\n{item.FechaFallecimiento?.ToShortDateString()}"
                    : "Libre";

                table.Cell().Element(CellStyle).Text($"#{item.NumeroBoveda}").FontSize(9).WrapAnywhere();
                table.Cell().Element(CellStyle).Text(item.NumeroPiso.ToString()).FontSize(9);
                table.Cell().Element(CellStyle).Text(item.EstadoBoveda).FontSize(9);
                table.Cell().Element(CellStyle).Text(item.NombreBloque).FontSize(9).WrapAnywhere();
                table.Cell().Element(CellStyle).Text(item.TipoBloque).FontSize(9);
                table.Cell().Element(CellStyle).Text(contrato).FontSize(9).WrapAnywhere();
                table.Cell().Element(CellStyle).Text(duracion).FontSize(9);
                table.Cell().Element(CellStyle).Text(difunto).FontSize(9).WrapAnywhere();
            }
        });
    }

    private static IContainer CellStyle(IContainer container)
    {
        return container
            .Border(0.5f)
            .BorderColor(Colors.Grey.Lighten2)
            .PaddingVertical(5)
            .PaddingHorizontal(3);
    }
}
