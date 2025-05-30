using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using QuestPDF.Helpers;
using gad_checa_gestion_cementerio.Models.Views;
using System.Collections.Generic;
using static QuestPDF.Helpers.PageSizes;
using System;

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

        table.Header(header =>
        {
            header.Cell().Element(CellStyle).Text("Bóveda").SemiBold();
            header.Cell().Element(CellStyle).Text("Piso").SemiBold();
            header.Cell().Element(CellStyle).Text("Estado").SemiBold();
            header.Cell().Element(CellStyle).Text("Bloque").SemiBold();
            header.Cell().Element(CellStyle).Text("Tipo").SemiBold();
            header.Cell().Element(CellStyle).Text("Contrato").SemiBold();
            header.Cell().Element(CellStyle).Text("Duración").SemiBold();
            header.Cell().Element(CellStyle).Text("Responsable").SemiBold();
            header.Cell().Element(CellStyle).Text("Difunto").SemiBold();
        });

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

            table.Cell().Element(CellStyle).Text($"#{item.NumeroBoveda}").WrapAnywhere();
            table.Cell().Element(CellStyle).Text(item.NumeroPiso.ToString());
            table.Cell().Element(CellStyle).Text(item.EstadoBoveda);
            table.Cell().Element(CellStyle).Text(item.NombreBloque).WrapAnywhere();
            table.Cell().Element(CellStyle).Text(item.TipoBloque);
            table.Cell().Element(CellStyle).Text(contrato).WrapAnywhere();
            table.Cell().Element(CellStyle).Text(duracion);
            table.Cell().Element(CellStyle).Text(responsable).WrapAnywhere();
            table.Cell().Element(CellStyle).Text(difunto).WrapAnywhere();
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