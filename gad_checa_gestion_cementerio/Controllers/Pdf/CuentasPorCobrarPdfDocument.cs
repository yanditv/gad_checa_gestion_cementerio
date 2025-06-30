using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using QuestPDF.Helpers;
using gad_checa_gestion_cementerio.Models.Views;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System;

public class CuentasPorCobrarPdfDocument : IDocument
{
    private readonly List<ReporteCuentasPorCobrarViewModel> _viewModels;

    public CuentasPorCobrarPdfDocument(List<ReporteCuentasPorCobrarViewModel> viewModels)
    {
        _viewModels = viewModels ?? new List<ReporteCuentasPorCobrarViewModel>();
    }

    public DocumentMetadata GetMetadata() => new DocumentMetadata
    {
        Title = "Reporte de Cuentas por Cobrar",
        Author = "GAD Checa",
        Subject = "Reporte de Cuentas por Cobrar - Gestión de Cementerio",
        Creator = "Sistema de Gestión de Cementerio",
        CreationDate = DateTime.Now
    };

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Margin(25);
            page.Size(PageSizes.A4.Landscape()); // Cambiar a formato horizontal para mejor distribución

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

                        headerColumn.Item().AlignCenter().Text("REPORTE DE CUENTAS POR COBRAR")
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
                        headerColumn.Item().AlignRight().Text($"Cuentas por Cobrar: {GetTotalPendientes()}")
                            .FontSize(10)
                            .Bold();
                    });
                });

                // Línea separadora
                column.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Blue.Darken2);

                // Resumen estadístico
                column.Item().PaddingTop(10).Row(statsRow =>
                {
                    if (!HasData())
                    {
                        statsRow.RelativeItem().Background(Colors.Red.Lighten4).Padding(8).Column(col =>
                        {
                            col.Item().Text("SIN DATOS").FontSize(12).Bold().FontColor(Colors.Red.Darken2);
                            col.Item().Text("No hay registros para mostrar").FontSize(10).FontColor(Colors.Red.Darken2);
                        });
                        return;
                    }

                    statsRow.RelativeItem().Background(Colors.Orange.Lighten4).Padding(8).Column(col =>
                    {
                        col.Item().Text("CUENTAS POR COBRAR").FontSize(10).Bold().FontColor(Colors.Orange.Darken2);
                        col.Item().Text($"{GetTotalPendientes()}").FontSize(14).Bold().FontColor(Colors.Orange.Darken2);
                    });

                    statsRow.RelativeItem().Background(Colors.Blue.Lighten4).Padding(8).Column(col =>
                    {
                        col.Item().Text("MONTO POR COBRAR").FontSize(10).Bold().FontColor(Colors.Blue.Darken2);
                        col.Item().Text($"${GetMontoPendiente():F2}").FontSize(14).Bold().FontColor(Colors.Blue.Darken2);
                    });
                });
            });

            page.Content().Element(ComposeTable);

            // Footer mejorado
            page.Footer().AlignCenter().Text("Generado por Sistema de Gestión de Cementerio - GAD Checa")
                .FontSize(10).FontColor(Colors.Grey.Darken1);
        });
    }


    void ComposeTable(IContainer container)
    {
        // Filtrar solo las cuentas pendientes (por cobrar)
        var cuentasPorCobrar = _viewModels.Where(v => !v.Pagada).ToList();

        if (!cuentasPorCobrar.Any())
        {
            container.PaddingTop(50).AlignCenter().Text("No hay cuentas por cobrar para mostrar en el reporte")
                .FontSize(16).Bold().FontColor(Colors.Grey.Darken2);
            return;
        }

        container.PaddingTop(15).Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(3);   // Contrato (más ancho)
                columns.RelativeColumn(2);   // Responsable
                columns.RelativeColumn(1);   // Teléfono
                columns.RelativeColumn(2);   // Difunto
                columns.RelativeColumn(2);   // Ubicación
                columns.ConstantColumn(85);  // Fecha Venc.
                columns.ConstantColumn(80);  // Monto
            });

            // ENCABEZADO mejorado
            table.Header(header =>
            {
                var titles = new[] {
                    "Contrato", "Responsable", "Teléfono", "Difunto", "Ubicación",
                    "Fecha Venc.", "Monto"
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

            // FILAS mejoradas con colores alternados
            var rowIndex = 0;
            foreach (var item in cuentasPorCobrar)
            {
                var ubicacion = FormatUbicacion(item);
                var isEvenRow = rowIndex % 2 == 0;
                var backgroundColor = isEvenRow ? Colors.White : Colors.Grey.Lighten5;

                // Determinar si la fecha está vencida
                var fechaVencida = IsFechaVencida(item);
                var fechaColor = fechaVencida ? Colors.Red.Darken1 : Colors.Black;

                // Generar número de contrato con formato específico
                var numeroContrato = GenerarNumeroContrato(item.NumeroSecuencialContrato?.ToString() ?? "");

                // Celdas de datos
                CreateDataCell(table, numeroContrato, backgroundColor, true);
                CreateDataCell(table, item.NombreResponsable ?? "N/A", backgroundColor);
                CreateDataCell(table, item.TelefonoResponsable ?? "N/A", backgroundColor);
                CreateDataCell(table, item.NombreDifunto ?? "N/A", backgroundColor);
                CreateDataCell(table, ubicacion, backgroundColor);

                // Celda de fecha con formato especial para vencidas
                var fechaText = table.Cell().Element(container => CellStyleWithBackground(container, backgroundColor))
                    .Text(item.FechaVencimiento.ToString("dd/MM/yyyy"))
                    .FontSize(9)
                    .FontColor(fechaColor);

                if (fechaVencida)
                    fechaText.Bold();

                // Celda de monto alineada a la derecha
                table.Cell().Element(container => CellStyleWithBackground(container, backgroundColor))
                    .AlignRight()
                    .Text($"${item.Monto:F2}")
                    .FontSize(9)
                    .Bold();

                rowIndex++;
            }

            // FOOTER con totales mejorado
            table.Footer(footer =>
            {
                // Fila de totales
                footer.Cell().ColumnSpan(6)
                    .Background(Colors.Blue.Darken3)
                    .Padding(8)
                    .AlignRight()
                    .Text("TOTAL POR COBRAR:")
                    .FontSize(10)
                    .Bold()
                    .FontColor(Colors.White);

                footer.Cell()
                    .Background(Colors.Blue.Darken2)
                    .Padding(8)
                    .AlignCenter()
                    .Text($"${GetMontoPendiente():F2}")
                    .FontSize(10)
                    .Bold()
                    .FontColor(Colors.White);
            });
        });
    }

    IContainer CellStyle(IContainer container)
    {
        return container
            .Border(0.5f)
            .BorderColor(Colors.Grey.Lighten2)
            .PaddingVertical(6)
            .PaddingHorizontal(5);
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

    // Método para crear celdas de datos de manera consistente
    private void CreateDataCell(TableDescriptor table, string text, string backgroundColor, bool bold = false)
    {
        var cell = table.Cell().Element(container => CellStyleWithBackground(container, backgroundColor))
            .Text(text)
            .FontSize(9);

        if (bold)
            cell.Bold();
    }

    // Métodos auxiliares para estadísticas
    private int GetTotalPendientes() => _viewModels.Count(v => !v.Pagada);
    private decimal GetMontoPendiente() => _viewModels.Where(v => !v.Pagada).Sum(v => v.Monto);

    // Método para validar si hay datos (cuentas por cobrar)
    private bool HasData() => _viewModels != null && _viewModels.Any(v => !v.Pagada);

    // Método para formatear ubicación de manera consistente
    private string FormatUbicacion(ReporteCuentasPorCobrarViewModel item)
    {
        return $"{item.Bloque ?? "N/A"} - P{item.Piso} - B{item.NumeroBoveda}";
    }

    // Método para determinar si una fecha está vencida
    private bool IsFechaVencida(ReporteCuentasPorCobrarViewModel item)
    {
        return !item.Pagada && item.FechaVencimiento < DateTime.Now;
    }

    // Método para verificar y obtener la ruta del logo
    private string? GetLogoPath()
    {
        var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "logo.png");
        return File.Exists(logoPath) ? logoPath : null;
    }

    // Método para generar el número de contrato con formato específico
    private string GenerarNumeroContrato(string numeroSecuencial)
    {
        if (string.IsNullOrEmpty(numeroSecuencial))
            return "N/A";

        if (int.TryParse(numeroSecuencial, out int numero))
        {
            return $"RNV-CTR-GADCHECA-2025-{numero:000}";
        }

        // Si no es un número válido, devolver el valor original
        return numeroSecuencial;
    }
}
