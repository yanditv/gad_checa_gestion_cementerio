using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using QuestPDF.Helpers;
using gad_checa_gestion_cementerio.Models.Views;
using System.Collections.Generic;
using System.Linq;

public class CuentasPorCobrarPdfDocument : IDocument
{
    private readonly List<ReporteCuentasPorCobrarViewModel> _viewModels;

    public CuentasPorCobrarPdfDocument(List<ReporteCuentasPorCobrarViewModel> viewModels)
    {
        _viewModels = viewModels;
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Margin(30);

            page.Header().Text("Reporte de Cuentas por Cobrar")
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
                columns.ConstantColumn(60); // Contrato
                columns.RelativeColumn();   // Responsable
                columns.RelativeColumn();   // Teléfono
                columns.RelativeColumn();   // Difunto
                columns.RelativeColumn();   // Ubicación
                columns.ConstantColumn(80); // Fecha Venc.
                columns.ConstantColumn(60); // Monto
                columns.ConstantColumn(60); // Estado
            });

            // Encabezado
            table.Header(header =>
            {
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Contrato").Bold();
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Responsable").Bold();
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Teléfono").Bold();
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Difunto").Bold();
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Ubicación").Bold();
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Fecha Venc.").Bold();
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Monto").Bold();
                header.Cell().Element(CellStyle).Background(Colors.Grey.Lighten3).Text("Estado").Bold();
            });

            // Cuerpo
            foreach (var item in _viewModels)
            {
                var ubicacion = $"{item.Bloque} - Piso {item.Piso} - Bóveda {item.NumeroBoveda}";

                table.Cell().Element(CellStyle).Text(item.NumeroSecuencialContrato);
                table.Cell().Element(CellStyle).Text(item.NombreResponsable);
                table.Cell().Element(CellStyle).Text(item.TelefonoResponsable);
                table.Cell().Element(CellStyle).Text(item.NombreDifunto);
                table.Cell().Element(CellStyle).Text(ubicacion);
                table.Cell().Element(CellStyle).Text(item.FechaVencimiento.ToShortDateString());
                table.Cell().Element(CellStyle).Text($"${item.Monto:F2}");
                table.Cell().Element(CellStyle).Text(item.Pagada ? "Pagada" : "Pendiente");
            }

            // Total
            table.Footer(footer =>
            {
                footer.Cell().ColumnSpan(6).Element(CellStyle).AlignRight().Text("TOTAL:").Bold();
                footer.Cell().ColumnSpan(2).Element(CellStyle).Text($"${_viewModels.Sum(v => v.Monto):F2}").Bold();
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
