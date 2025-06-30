using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using QuestPDF.Helpers;
using gad_checa_gestion_cementerio.Models.Views;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System;

public class IngresosPorFechaPdfDocument : IDocument
{
    private readonly List<ReporteIngresoPorFechaViewModel> _ingresos;

    public IngresosPorFechaPdfDocument(List<ReporteIngresoPorFechaViewModel> ingresos)
    {
        _ingresos = ingresos ?? new List<ReporteIngresoPorFechaViewModel>();
    }

    public DocumentMetadata GetMetadata() => new DocumentMetadata
    {
        Title = "Reporte de Ingresos por Fecha",
        Author = "GAD Checa",
        Subject = "Reporte de Ingresos - Gestión de Cementerio",
        Creator = "Sistema de Gestión de Cementerio",
        CreationDate = DateTime.Now
    };

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Margin(25);
            page.Size(PageSizes.A4.Landscape()); // Formato horizontal para mejor distribución

            var logoPath = GetLogoPath();

            page.Header().Column(column =>
            {
                // Header principal con logo y título
                column.Item().Row(row =>
                {
                    row.RelativeItem().Column(headerColumn =>
                    {
                        if (logoPath != null)
                        {
                            headerColumn.Item().AlignCenter().Width(80).Height(60).Image(logoPath).FitArea();
                        }
                        else
                        {
                            headerColumn.Item().AlignCenter().Width(80).Height(60)
                                .Background(Colors.Grey.Lighten3)
                                .AlignCenter()
                                .AlignMiddle()
                                .Text("LOGO")
                                .FontSize(12)
                                .FontColor(Colors.Grey.Darken1);
                        }
                    });

                    row.RelativeItem(3).Column(headerColumn =>
                    {
                        headerColumn.Item().AlignCenter().Text("GOBIERNO AUTÓNOMO DESCENTRALIZADO")
                            .FontSize(14)
                            .Bold()
                            .FontColor(Colors.Blue.Darken2);

                        headerColumn.Item().AlignCenter().Text("PARROQUIAL DE CHECA")
                            .FontSize(12)
                            .Bold()
                            .FontColor(Colors.Blue.Darken2);

                        headerColumn.Item().AlignCenter().Text("REPORTE DE INGRESOS POR FECHA")
                            .FontSize(16)
                            .Bold()
                            .FontColor(Colors.Black);
                    });

                    row.RelativeItem().Column(headerColumn =>
                    {
                        headerColumn.Item().AlignRight().Text($"Fecha: {DateTime.Now:dd/MM/yyyy}")
                            .FontSize(10);
                        headerColumn.Item().AlignRight().Text($"Hora: {DateTime.Now:HH:mm}")
                            .FontSize(10);
                        headerColumn.Item().AlignRight().Text($"Total Registros: {_ingresos.Count}")
                            .FontSize(10)
                            .Bold();
                    });
                });

                // Línea separadora
                column.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Blue.Darken2);
            });

            page.Content().Element(ComposeTable);

            // Footer mejorado
            page.Footer().AlignCenter().Text("Generado por Sistema de Gestión de Cementerio - GAD Checa")
                .FontSize(10).FontColor(Colors.Grey.Darken1);
        });
    }

    void ComposeTable(IContainer container)
    {
        if (!HasData())
        {
            container.PaddingTop(50).AlignCenter().Text("No hay ingresos para mostrar en el reporte")
                .FontSize(16).Bold().FontColor(Colors.Grey.Darken2);
            return;
        }

        container.Column(column =>
        {
            // Estadísticas de resumen
            column.Item().PaddingTop(15).Row(statsRow =>
            {
                var totalIngresos = _ingresos.Sum(i => i.Monto);
                var fechaMinima = _ingresos.Min(i => i.FechaPago);
                var fechaMaxima = _ingresos.Max(i => i.FechaPago);
                var promedioIngreso = _ingresos.Average(i => i.Monto);

                statsRow.RelativeItem().Background(Colors.Green.Lighten4).Padding(8).Column(col =>
                {
                    col.Item().Text("TOTAL INGRESOS").FontSize(10).Bold().FontColor(Colors.Green.Darken2);
                    col.Item().Text($"${totalIngresos:F2}").FontSize(14).Bold().FontColor(Colors.Green.Darken2);
                });

                statsRow.RelativeItem().Background(Colors.Blue.Lighten4).Padding(8).Column(col =>
                {
                    col.Item().Text("PROMEDIO POR PAGO").FontSize(10).Bold().FontColor(Colors.Blue.Darken2);
                    col.Item().Text($"${promedioIngreso:F2}").FontSize(14).Bold().FontColor(Colors.Blue.Darken2);
                });

                statsRow.RelativeItem().Background(Colors.Orange.Lighten4).Padding(8).Column(col =>
                {
                    col.Item().Text("PERÍODO").FontSize(10).Bold().FontColor(Colors.Orange.Darken2);
                    col.Item().Text($"{fechaMinima:dd/MM/yyyy} - {fechaMaxima:dd/MM/yyyy}").FontSize(10).Bold().FontColor(Colors.Orange.Darken2);
                });

                statsRow.RelativeItem().Background(Colors.Purple.Lighten4).Padding(8).Column(col =>
                {
                    col.Item().Text("TOTAL REGISTROS").FontSize(10).Bold().FontColor(Colors.Purple.Darken2);
                    col.Item().Text($"{_ingresos.Count}").FontSize(14).Bold().FontColor(Colors.Purple.Darken2);
                });
            });

            // Agrupar por tipo de ingreso y mostrar cada uno
            var gruposPorTipo = _ingresos
                .GroupBy(i => i.TipoIngreso ?? "Sin Clasificar")
                .OrderBy(g => g.Key)
                .ToList();

            foreach (var grupo in gruposPorTipo)
            {
                // Título del tipo de ingreso
                column.Item().PaddingTop(20).Row(row =>
                {
                    row.RelativeItem().Background(Colors.Blue.Darken2).Padding(10).Column(titleCol =>
                    {
                        titleCol.Item().Text($"TIPO DE INGRESO: {grupo.Key.ToUpper()}")
                            .FontSize(14)
                            .Bold()
                            .FontColor(Colors.White);

                        var totalGrupo = grupo.Sum(i => i.Monto);
                        var conteoGrupo = grupo.Count();

                        titleCol.Item().Text($"Registros: {conteoGrupo} | Total: ${totalGrupo:F2}")
                            .FontSize(11)
                            .FontColor(Colors.White);
                    });
                });

                // Tabla para este grupo
                column.Item().PaddingTop(10).Table(table =>
                {
                    ComposeTableForGroup(table, grupo.OrderBy(i => i.FechaPago).ToList());
                });

                // Espacio entre grupos
                if (grupo != gruposPorTipo.Last())
                {
                    column.Item().PaddingTop(15).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                }
            }

            // Footer con resumen final
            column.Item().PaddingTop(20).Table(table =>
            {
                ComposeFooterSummary(table);
            });
        });
    }

    void ComposeTableForGroup(TableDescriptor table, List<ReporteIngresoPorFechaViewModel> ingresos)
    {
        table.ColumnsDefinition(columns =>
        {
            columns.ConstantColumn(80);  // Fecha
            columns.ConstantColumn(100); // Tipo Pago
            columns.RelativeColumn(1);   // Bóveda
            columns.RelativeColumn(2);   // Pagado por
            columns.RelativeColumn(1);   // Contrato
            columns.ConstantColumn(100); // Comprobante
            columns.ConstantColumn(80);  // Monto
        });

        // Header
        table.Header(header =>
        {
            var titles = new[] {
                "Fecha", "Tipo Pago", "Bóveda", "Pagado Por", "Contrato", "Comprobante", "Monto"
            };

            foreach (var title in titles)
            {
                header.Cell()
                    .Background(Colors.Blue.Darken2)
                    .Padding(8)
                    .AlignCenter()
                    .AlignMiddle()
                    .Text(title)
                    .FontSize(10)
                    .Bold()
                    .FontColor(Colors.White);
            }
        });

        // Body con colores alternados
        var rowIndex = 0;
        foreach (var ingreso in ingresos)
        {
            var isEvenRow = rowIndex % 2 == 0;
            var backgroundColor = isEvenRow ? Colors.White : Colors.Grey.Lighten5;

            CreateDataCell(table, ingreso.FechaPago.ToString("dd/MM/yyyy"), backgroundColor);
            CreateDataCell(table, ingreso.TipoPago ?? "N/A", backgroundColor);
            CreateDataCell(table, FormatBoveda(ingreso), backgroundColor);
            CreateDataCell(table, FormatPagador(ingreso), backgroundColor);
            CreateDataCell(table, ingreso.NumeroContrato ?? "N/A", backgroundColor);
            CreateDataCell(table, ingreso.NumeroComprobante ?? "N/A", backgroundColor);
            CreateDataCell(table, $"${ingreso.Monto:F2}", backgroundColor, true);

            rowIndex++;
        }

        // Footer con subtotal del grupo
        table.Footer(footer =>
        {
            var subtotal = ingresos.Sum(i => i.Monto);

            footer.Cell().ColumnSpan(6)
                .Background(Colors.Blue.Darken1)
                .Padding(6)
                .AlignRight()
                .Text($"SUBTOTAL:")
                .FontSize(10)
                .Bold()
                .FontColor(Colors.White);

            footer.Cell()
                .Background(Colors.Blue.Darken1)
                .Padding(6)
                .AlignCenter()
                .Text($"${subtotal:F2}")
                .FontSize(10)
                .Bold()
                .FontColor(Colors.White);
        });
    }

    void ComposeFooterSummary(TableDescriptor table)
    {
        table.ColumnsDefinition(columns =>
        {
            columns.RelativeColumn(1);
            columns.RelativeColumn(1);
            columns.RelativeColumn(1);
            columns.RelativeColumn(1);
            columns.RelativeColumn(1);
        });

        table.Cell().ColumnSpan(5)
            .Background(Colors.Green.Darken2)
            .Padding(12)
            .Row(summaryRow =>
            {
                var totalGeneral = _ingresos.Sum(i => i.Monto);
                var gruposPorTipo = _ingresos.GroupBy(i => i.TipoIngreso ?? "Sin Clasificar").ToList();

                summaryRow.RelativeItem().Background(Colors.Green.Darken3).Padding(8).AlignCenter().Text($"TOTAL GENERAL").FontSize(12).Bold().FontColor(Colors.White);
                summaryRow.RelativeItem().Background(Colors.Blue.Darken3).Padding(8).AlignCenter().Text($"${totalGeneral:F2}").FontSize(14).Bold().FontColor(Colors.White);
                summaryRow.RelativeItem().Background(Colors.Orange.Darken3).Padding(8).AlignCenter().Text($"Registros: {_ingresos.Count}").FontSize(10).Bold().FontColor(Colors.White);
                summaryRow.RelativeItem().Background(Colors.Purple.Darken3).Padding(8).AlignCenter().Text($"Tipos: {gruposPorTipo.Count}").FontSize(10).Bold().FontColor(Colors.White);
                summaryRow.RelativeItem().Background(Colors.Teal.Darken3).Padding(8).AlignCenter().Text($"Promedio: ${_ingresos.Average(i => i.Monto):F2}").FontSize(10).Bold().FontColor(Colors.White);
            });
    }

    // Método para crear celdas de datos de manera consistente
    private void CreateDataCell(TableDescriptor table, string text, string backgroundColor, bool bold = false)
    {
        var cell = table.Cell().Element(container => CellStyleWithBackground(container, backgroundColor))
            .Text(text)
            .FontSize(9);

        if (bold)
            cell.Bold();
    }

    IContainer CellStyleWithBackground(IContainer container, string backgroundColor)
    {
        return container
            .Background(backgroundColor)
            .Border(0.5f)
            .BorderColor(Colors.Grey.Lighten2)
            .PaddingVertical(6)
            .PaddingHorizontal(5);
    }

    // Método para formatear información de la bóveda
    private string FormatBoveda(ReporteIngresoPorFechaViewModel ingreso)
    {
        var boveda = ingreso.Boveda ?? "N/A";
        var piso = ingreso.Piso ?? "N/A";
        var bloque = ingreso.Bloque ?? "N/A";

        return $"{boveda}\nPiso: {piso}\nBloque: {bloque}";
    }

    // Método para formatear información del pagador
    private string FormatPagador(ReporteIngresoPorFechaViewModel ingreso)
    {
        var nombre = ingreso.PagadoPor ?? "N/A";
        var identificacion = ingreso.IdentificacionPagador ?? "N/A";

        return $"{nombre}\nCI: {identificacion}";
    }

    // Método para validar si hay datos
    private bool HasData() => _ingresos != null && _ingresos.Any();

    // Método para verificar y obtener la ruta del logo
    private string? GetLogoPath()
    {
        var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "logo.png");
        return File.Exists(logoPath) ? logoPath : null;
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
