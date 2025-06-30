using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using QuestPDF.Helpers;
using gad_checa_gestion_cementerio.Models.Views;
using System.Collections.Generic;
using static QuestPDF.Helpers.PageSizes;
using System.IO;
using System.Linq;
using System;

public class BovedasPdfDocument : IDocument
{
    private readonly List<ReporteBovedasViewModel> _viewModels;

    public BovedasPdfDocument(List<ReporteBovedasViewModel> viewModels)
    {
        _viewModels = viewModels ?? new List<ReporteBovedasViewModel>();
    }

    public DocumentMetadata GetMetadata() => new DocumentMetadata
    {
        Title = "Reporte de Bóvedas",
        Author = "GAD Checa",
        Subject = "Reporte de Bóvedas - Gestión de Cementerio",
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

                        headerColumn.Item().AlignCenter().Text("REPORTE DE BÓVEDAS")
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
                        headerColumn.Item().AlignRight().Text($"Total Espacios: {_viewModels.Count}")
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
            container.PaddingTop(50).AlignCenter().Text("No hay datos para mostrar en el reporte")
                .FontSize(16).Bold().FontColor(Colors.Grey.Darken2);
            return;
        }

        container.Column(column =>
        {
            // Resumen estadístico al inicio del contenido
            column.Item().PaddingTop(10).Row(statsRow =>
            {
                // Primera fila de estadísticas - NICHOS
                statsRow.RelativeItem().Background(Colors.Orange.Lighten4).Padding(8).Column(col =>
                {
                    col.Item().Text("NICHOS TOTALES").FontSize(10).Bold().FontColor(Colors.Orange.Darken2);
                    col.Item().Text($"{GetTotalNichos()}").FontSize(14).Bold().FontColor(Colors.Orange.Darken2);
                });

                statsRow.RelativeItem().Background(Colors.Green.Lighten4).Padding(8).Column(col =>
                {
                    col.Item().Text("NICHOS OCUPADOS").FontSize(10).Bold().FontColor(Colors.Green.Darken2);
                    col.Item().Text($"{GetNichosOcupados()}").FontSize(14).Bold().FontColor(Colors.Green.Darken2);
                });

                statsRow.RelativeItem().Background(Colors.Blue.Lighten4).Padding(8).Column(col =>
                {
                    col.Item().Text("NICHOS LIBRES").FontSize(10).Bold().FontColor(Colors.Blue.Darken2);
                    col.Item().Text($"{GetNichosLibres()}").FontSize(14).Bold().FontColor(Colors.Blue.Darken2);
                });
            });

            // Segunda fila de estadísticas - BÓVEDAS
            column.Item().PaddingTop(10).Row(statsRow =>
            {
                statsRow.RelativeItem().Background(Colors.Purple.Lighten4).Padding(8).Column(col =>
                {
                    col.Item().Text("BÓVEDAS TOTALES").FontSize(10).Bold().FontColor(Colors.Purple.Darken2);
                    col.Item().Text($"{GetTotalBovedas()}").FontSize(14).Bold().FontColor(Colors.Purple.Darken2);
                });

                statsRow.RelativeItem().Background(Colors.Red.Lighten4).Padding(8).Column(col =>
                {
                    col.Item().Text("BÓVEDAS OCUPADAS").FontSize(10).Bold().FontColor(Colors.Red.Darken2);
                    col.Item().Text($"{GetBovedasOcupadas()}").FontSize(14).Bold().FontColor(Colors.Red.Darken2);
                });

                statsRow.RelativeItem().Background(Colors.Teal.Lighten4).Padding(8).Column(col =>
                {
                    col.Item().Text("BÓVEDAS LIBRES").FontSize(10).Bold().FontColor(Colors.Teal.Darken2);
                    col.Item().Text($"{GetBovedasLibres()}").FontSize(14).Bold().FontColor(Colors.Teal.Darken2);
                });
            });

            // Tercera fila de estadísticas - POR CADUCAR
            column.Item().PaddingTop(10).Row(statsRow =>
            {
                statsRow.RelativeItem().Background(Colors.Orange.Lighten4).Padding(8).Column(col =>
                {
                    col.Item().Text("NICHOS POR CADUCAR").FontSize(10).Bold().FontColor(Colors.Orange.Darken2);
                    col.Item().Text($"{GetNichosPorCaducar()}").FontSize(14).Bold().FontColor(Colors.Orange.Darken2);
                });

                statsRow.RelativeItem().Background(Colors.Orange.Lighten4).Padding(8).Column(col =>
                {
                    col.Item().Text("BÓVEDAS POR CADUCAR").FontSize(10).Bold().FontColor(Colors.Orange.Darken2);
                    col.Item().Text($"{GetBovedasPorCaducar()}").FontSize(14).Bold().FontColor(Colors.Orange.Darken2);
                });

                statsRow.RelativeItem().Background(Colors.Transparent);
            });

            // Cuarta fila - PROPIETARIOS Y TOTAL
            column.Item().PaddingTop(10).Row(statsRow =>
            {
                statsRow.RelativeItem().Background(Colors.Amber.Lighten4).Padding(8).Column(col =>
                {
                    col.Item().Text("CON PROPIETARIO").FontSize(10).Bold().FontColor(Colors.Amber.Darken2);
                    col.Item().Text($"{GetEspaciosConPropietario()}").FontSize(14).Bold().FontColor(Colors.Amber.Darken2);
                });

                statsRow.RelativeItem().Background(Colors.Indigo.Lighten4).Padding(8).Column(col =>
                {
                    col.Item().Text("TOTAL ESPACIOS").FontSize(10).Bold().FontColor(Colors.Indigo.Darken2);
                    col.Item().Text($"{_viewModels.Count}").FontSize(14).Bold().FontColor(Colors.Indigo.Darken2);
                });

                // Espacio vacío para mantener simetría
                statsRow.RelativeItem().Background(Colors.Transparent);
            });

            // Agrupar primero por tipo (Nichos/Bóvedas) y luego por bloques
            var gruposPorTipo = _viewModels
                .GroupBy(v => EsNicho(v) ? "NICHOS" : "BÓVEDAS")
                .OrderBy(g => g.Key)
                .ToList();

            foreach (var grupoTipo in gruposPorTipo)
            {
                // Título del tipo (NICHOS o BÓVEDAS)
                column.Item().PaddingTop(25).Row(row =>
                {
                    row.RelativeItem().Background(Colors.Blue.Darken3).Padding(12).Column(titleCol =>
                    {
                        titleCol.Item().Text($"SECCIÓN: {grupoTipo.Key}")
                            .FontSize(16)
                            .Bold()
                            .FontColor(Colors.White);

                        var ocupadas = grupoTipo.Count(v => TieneContratoActivo(v));
                        var libres = grupoTipo.Count(v => !TieneContratoActivo(v) && !TieneContratoPorCaducar(v));
                        var porCaducar = grupoTipo.Count(v => TieneContratoPorCaducar(v));

                        titleCol.Item().Text($"Total: {grupoTipo.Count()} | Ocupadas: {ocupadas} | Libres: {libres} | Por Caducar: {porCaducar}")
                            .FontSize(12)
                            .FontColor(Colors.White);
                    });
                });

                // Agrupar por bloques dentro de cada tipo
                var bloquesPorTipo = grupoTipo
                    .GroupBy(v => new { v.NombreBloque, v.TipoBloque })
                    .OrderBy(g => g.Key.NombreBloque)
                    .ToList();

                foreach (var bloque in bloquesPorTipo)
                {
                    // Título del bloque
                    column.Item().PaddingTop(15).Row(row =>
                    {
                        row.RelativeItem().Background(Colors.Grey.Darken1).Padding(8).Column(titleCol =>
                        {
                            titleCol.Item().Text($"BLOQUE: {bloque.Key.NombreBloque}")
                                .FontSize(12)
                                .Bold()
                                .FontColor(Colors.White);

                            var ocupadasBloque = bloque.Count(v => TieneContratoActivo(v));
                            var libresBloque = bloque.Count(v => !TieneContratoActivo(v) && !TieneContratoPorCaducar(v));
                            var porCaducarBloque = bloque.Count(v => TieneContratoPorCaducar(v));

                            titleCol.Item().Text($"Tipo: {bloque.Key.TipoBloque} | Total: {bloque.Count()} | Ocupadas: {ocupadasBloque} | Libres: {libresBloque} | Por Caducar: {porCaducarBloque}")
                                .FontSize(9)
                                .FontColor(Colors.White);
                        });
                    });

                    // Tabla para este bloque (sin footer)
                    column.Item().PaddingTop(5).Table(table =>
                    {
                        ComposeTableForBloqueSimple(table, bloque.ToList());
                    });
                }

                // Footer con estadísticas del tipo completo (al final de cada sección)
                column.Item().PaddingTop(10).Table(table =>
                {
                    ComposeFooterForTipo(table, grupoTipo.ToList(), grupoTipo.Key);
                });

                // Espacio entre tipos
                if (grupoTipo != gruposPorTipo.Last())
                {
                    column.Item().PaddingTop(20).LineHorizontal(2).LineColor(Colors.Blue.Darken2);
                }
            }
        });
    }

    void ComposeTableForBloqueSimple(TableDescriptor table, List<ReporteBovedasViewModel> itemsBloque)
    {
        table.ColumnsDefinition(columns =>
        {
            columns.ConstantColumn(60);  // Bóveda
            columns.ConstantColumn(50);  // Piso
            columns.ConstantColumn(80);  // Estado
            columns.ConstantColumn(70);  // Tipo
            columns.RelativeColumn(2);   // Contrato
            columns.ConstantColumn(70);  // Duración
            columns.RelativeColumn(2);   // Propietario
            columns.RelativeColumn(2);   // Difunto
        });

        // ENCABEZADO mejorado (sin columna de Bloque ya que está agrupado)
        table.Header(header =>
        {
            var titles = new[] {
                "Bóveda", "Piso", "Estado", "Tipo",
                "Contrato", "Duración", "Propietario", "Difunto"
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
        foreach (var item in itemsBloque.OrderBy(x => x.NumeroPiso).ThenBy(x => x.NumeroBoveda))
        {
            var isEvenRow = rowIndex % 2 == 0;
            var backgroundColor = isEvenRow ? Colors.White : Colors.Grey.Lighten5;

            // Formatear información del contrato
            string contrato = FormatContrato(item);
            string duracion = FormatDuracion(item);
            string propietario = FormatPropietario(item);
            string difunto = FormatDifunto(item);

            // Determinar estado calculado y su color
            var estadoCalculado = GetEstadoCalculado(item);
            var estadoColor = GetEstadoColor(estadoCalculado);

            // Celdas de datos
            CreateDataCell(table, $"#{item.NumeroBoveda}", backgroundColor, true);
            CreateDataCell(table, item.NumeroPiso.ToString(), backgroundColor);

            // Celda de estado con color calculado
            var infoAdicional = GetInfoAdicionalEstado(item);
            var textoEstado = string.IsNullOrEmpty(infoAdicional) ? estadoCalculado : $"{estadoCalculado}\n{infoAdicional}";

            table.Cell().Element(container => CellStyleWithBackground(container, backgroundColor))
                .AlignCenter()
                .Text(textoEstado)
                .FontSize(9)
                .Bold()
                .FontColor(estadoColor);

            CreateDataCell(table, item.TipoBloque ?? "N/A", backgroundColor);
            CreateDataCell(table, contrato, backgroundColor);
            CreateDataCell(table, duracion, backgroundColor);
            CreateDataCell(table, propietario, backgroundColor);
            CreateDataCell(table, difunto, backgroundColor);

            rowIndex++;
        }

        // Sin footer aquí - se mostrará al final del tipo
    }

    void ComposeFooterForTipo(TableDescriptor table, List<ReporteBovedasViewModel> itemsTipo, string tipoNombre)
    {
        table.ColumnsDefinition(columns =>
        {
            columns.RelativeColumn(1);
            columns.RelativeColumn(1);
            columns.RelativeColumn(1);
            columns.RelativeColumn(1);
            columns.RelativeColumn(1);
            columns.RelativeColumn(1);
            columns.RelativeColumn(1);
            columns.RelativeColumn(1);
        });

        // Footer único con estadísticas del tipo completo
        table.Cell().ColumnSpan(8)
            .Background(Colors.Blue.Darken3)
            .Padding(10)
            .Row(footerRow =>
            {
                var ocupadas = itemsTipo.Count(v => TieneContratoActivo(v));
                var libres = itemsTipo.Count(v => !TieneContratoActivo(v) && !TieneContratoPorCaducar(v));
                var porCaducar = itemsTipo.Count(v => TieneContratoPorCaducar(v));
                var conPropietario = itemsTipo.Count(v => TienePropietario(v));
                var total = itemsTipo.Count;

                footerRow.RelativeItem().Background(Colors.Green.Darken2).Padding(6).AlignCenter().Text($"Ocupadas: {ocupadas}").FontSize(9).Bold().FontColor(Colors.White);
                footerRow.RelativeItem().Background(Colors.Blue.Darken2).Padding(6).AlignCenter().Text($"Libres: {libres}").FontSize(9).Bold().FontColor(Colors.White);
                footerRow.RelativeItem().Background(Colors.Orange.Darken2).Padding(6).AlignCenter().Text($"Por Caducar: {porCaducar}").FontSize(9).Bold().FontColor(Colors.White);
                footerRow.RelativeItem().Background(Colors.Amber.Darken2).Padding(6).AlignCenter().Text($"Con Propietario: {conPropietario}").FontSize(9).Bold().FontColor(Colors.White);
                footerRow.RelativeItem().Background(Colors.Indigo.Darken2).Padding(6).AlignCenter().Text($"TOTAL {tipoNombre}: {total}").FontSize(10).Bold().FontColor(Colors.White);
            });
    }

    private static IContainer CellStyle(IContainer container)
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
    private int GetBovedasOcupadas() => _viewModels.Count(v => EsBoveda(v) && TieneContratoActivo(v));
    private int GetBovedasLibres() => _viewModels.Count(v => EsBoveda(v) && !TieneContratoActivo(v) && !TieneContratoPorCaducar(v));
    private int GetBovedasPorCaducar() => _viewModels.Count(v => EsBoveda(v) && TieneContratoPorCaducar(v));
    private int GetNichosOcupados() => _viewModels.Count(v => EsNicho(v) && TieneContratoActivo(v));
    private int GetNichosLibres() => _viewModels.Count(v => EsNicho(v) && !TieneContratoActivo(v) && !TieneContratoPorCaducar(v));
    private int GetNichosPorCaducar() => _viewModels.Count(v => EsNicho(v) && TieneContratoPorCaducar(v));
    private int GetContratosActivos() => _viewModels.Count(v => TieneContratoActivo(v));
    private int GetTotalNichos() => _viewModels.Count(v => EsNicho(v));
    private int GetTotalBovedas() => _viewModels.Count(v => EsBoveda(v));
    private int GetEspaciosConPropietario() => _viewModels.Count(v => TienePropietario(v));

    // Métodos auxiliares para determinar tipos - Versión más robusta
    private bool EsNicho(ReporteBovedasViewModel item)
    {
        var tipo = item.TipoBloque?.ToUpper() ?? "";
        return tipo.Contains("NICHO") || tipo.Contains("NICHO");
    }

    private bool EsBoveda(ReporteBovedasViewModel item)
    {
        var tipo = item.TipoBloque?.ToUpper() ?? "";
        return tipo.Contains("BOVEDA") || tipo.Contains("BÓVEDA") || tipo.Contains("BOVEDA");
    }

    // Método para verificar si tiene propietario
    private bool TienePropietario(ReporteBovedasViewModel item)
    {
        return !string.IsNullOrEmpty(item.NombrePropietario) ||
               !string.IsNullOrEmpty(item.CedulaPropietario);
    }

    // Método para validar si hay datos
    private bool HasData() => _viewModels != null && _viewModels.Any();

    // Método para formatear información del contrato
    private string FormatContrato(ReporteBovedasViewModel item)
    {
        if (item.NumeroSecuencialContrato != null)
        {
            var numeroFormateado = GenerarNumeroContrato(item.NumeroSecuencialContrato?.ToString() ?? "");
            var fechaInicio = item.FechaInicioContrato?.ToString("dd/MM/yyyy") ?? "N/A";
            var fechaFin = item.FechaFinContrato?.ToString("dd/MM/yyyy") ?? "N/A";
            return $"{numeroFormateado}\n{fechaInicio} - {fechaFin}";
        }
        else
        {
            // Si no tiene secuencial de contrato, mostrar el número de bóveda
            return $"Bóveda #{item.NumeroBoveda}\nSin contrato";
        }
    }

    // Método para formatear duración en años
    private string FormatDuracion(ReporteBovedasViewModel item)
    {
        if (item.NumeroDeMeses != null && item.NumeroDeMeses > 0)
        {
            var años = item.NumeroDeMeses / 12.0;
            if (años >= 1)
            {
                return años % 1 == 0 ? $"{años:F0} años" : $"{años:F1} años";
            }
            else
            {
                return $"{item.NumeroDeMeses} años";
            }
        }
        return "-";
    }

    // Método para formatear información del difunto
    private string FormatDifunto(ReporteBovedasViewModel item)
    {
        if (!string.IsNullOrEmpty(item.NombresDifunto))
        {
            var nombre = $"{item.NombresDifunto} {item.ApellidosDifunto}";
            var fecha = item.FechaFallecimiento?.ToString("dd/MM/yyyy") ?? "N/A";
            return $"{nombre}\n{fecha}";
        }
        return "Libre";
    }

    // Método para formatear información del propietario
    private string FormatPropietario(ReporteBovedasViewModel item)
    {
        if (!string.IsNullOrEmpty(item.NombrePropietario))
        {
            var nombre = item.NombrePropietario;
            var cedula = item.CedulaPropietario ?? "N/A";
            return $"{nombre}\nCI: {cedula}";
        }
        return "Sin Propietario";
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

    // Método para determinar el color del estado
    private string GetEstadoColor(string estado)
    {
        return estado?.ToLower() switch
        {
            "ocupada" => Colors.Red.Darken1,
            "libre" => Colors.Green.Darken1,
            "por caducar" => Colors.Orange.Darken1,
            "mantenimiento" => Colors.Purple.Darken1,
            "reservada" => Colors.Blue.Darken1,
            _ => Colors.Black
        };
    }

    // Método para verificar y obtener la ruta del logo
    private string? GetLogoPath()
    {
        var logoPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "logo.png");
        return File.Exists(logoPath) ? logoPath : null;
    }

    // Método para verificar si tiene contrato activo (dentro del plazo de fechas)
    private bool TieneContratoActivo(ReporteBovedasViewModel item)
    {
        if (item.FechaInicioContrato == null || item.FechaFinContrato == null)
            return false;

        var fechaActual = DateTime.Now.Date;
        return fechaActual >= item.FechaInicioContrato.Value.Date &&
               fechaActual <= item.FechaFinContrato.Value.Date;
    }

    // Método para verificar si el contrato está próximo a caducar (30 días antes)
    private bool TieneContratoPorCaducar(ReporteBovedasViewModel item)
    {
        if (item.FechaFinContrato == null)
            return false;

        var fechaActual = DateTime.Now.Date;
        var fechaLimite = item.FechaFinContrato.Value.Date;
        var diasRestantes = (fechaLimite - fechaActual).Days;

        // Contrato por caducar si le quedan 30 días o menos pero aún no ha vencido
        return diasRestantes <= 30 && diasRestantes > 0;
    }

    // Método para obtener el estado calculado basado en el contrato
    private string GetEstadoCalculado(ReporteBovedasViewModel item)
    {
        if (TieneContratoActivo(item))
            return "Ocupada";
        else if (TieneContratoPorCaducar(item))
            return "Por Caducar";
        else
            return "Libre";
    }

    // Método para obtener información adicional del estado (días restantes para contratos por caducar)
    private string GetInfoAdicionalEstado(ReporteBovedasViewModel item)
    {
        if (TieneContratoPorCaducar(item) && item.FechaFinContrato != null)
        {
            var diasRestantes = (item.FechaFinContrato.Value.Date - DateTime.Now.Date).Days;
            return $"({diasRestantes} días restantes)";
        }
        return "";
    }
}
