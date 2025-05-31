using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using QuestPDF.Helpers;
using gad_checa_gestion_cementerio.Models.Views;
using System.Collections.Generic;
using System.Linq;
using System.IO;

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

            var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "logo_gad.png");

            page.Header().Column(column =>
            {
                column.Item().AlignCenter().Width(500).Height(100).Image(logoPath).FitArea();
                column.Item().Text("REPORTE DE CUENTAS POR COBRAR")
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
                columns.ConstantColumn(60); // Contrato
                columns.RelativeColumn();   // Responsable
                columns.RelativeColumn();   // Teléfono
                columns.RelativeColumn();   // Difunto
                columns.RelativeColumn();   // Ubicación
                columns.ConstantColumn(80); // Fecha Venc.
                columns.ConstantColumn(60); // Monto
                columns.ConstantColumn(60); // Estado
            });

            // ENCABEZADO
            table.Header(header =>
            {
                foreach (var title in new[] {
                    "Contrato", "Responsable", "Teléfono", "Difunto", "Ubicación",
                    "Fecha Venc.", "Monto", "Estado"
                })
                {
                    header.Cell().Background(Colors.Grey.Lighten3)
                        .Padding(5) // Ajusta si quieres más/menos espacio
                        .AlignCenter()
                        .AlignMiddle()
                        .Text(title)
                        .FontSize(9)
                        .Bold();
                }
            });

            // FILAS
            foreach (var item in _viewModels)
            {
                var ubicacion = $"{item.Bloque} - Piso {item.Piso} - Bóveda {item.NumeroBoveda}";

                table.Cell().Element(CellStyle).Text(item.NumeroSecuencialContrato).FontSize(9);
                table.Cell().Element(CellStyle).Text(item.NombreResponsable).FontSize(9);
                table.Cell().Element(CellStyle).Text(item.TelefonoResponsable).FontSize(9);
                table.Cell().Element(CellStyle).Text(item.NombreDifunto).FontSize(9);
                table.Cell().Element(CellStyle).Text(ubicacion).FontSize(9);
                table.Cell().Element(CellStyle).Text(item.FechaVencimiento.ToShortDateString()).FontSize(9);
                table.Cell().Element(CellStyle).Text($"${item.Monto:F2}").FontSize(9);
                table.Cell().Element(CellStyle).Text(item.Pagada ? "Pagada" : "Pendiente").FontSize(9);
            }

            // TOTAL
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
