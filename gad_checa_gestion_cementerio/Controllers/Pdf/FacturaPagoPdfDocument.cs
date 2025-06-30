using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using QuestPDF.Helpers;
using gad_checa_gestion_cementerio.Data;
using System;
using System.IO;
using System.Linq;

namespace gad_checa_gestion_cementerio.Controllers.Pdf
{
    public class FacturaPagoPdfDocument : IDocument
    {
        private readonly Pago _pago;
        private readonly Persona _responsable;

        public FacturaPagoPdfDocument(Pago pago, Persona responsable)
        {
            _pago = pago;
            _responsable = responsable;
        }

        public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

        public void Compose(IDocumentContainer container)
        {
            // Manejo robusto de la ruta del logo para producción
            string logoPath = "";
            bool logoExists = false;

            try
            {
                // Intentar múltiples ubicaciones para el logo
                var possiblePaths = new[]
                {
                    Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "logo.png"),
                    Path.Combine(AppContext.BaseDirectory, "wwwroot", "logo.png"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "wwwroot", "logo.png")
                };

                foreach (var path in possiblePaths)
                {
                    if (!string.IsNullOrEmpty(path) && File.Exists(path))
                    {
                        logoPath = path;
                        logoExists = true;
                        break;
                    }
                }
            }
            catch (Exception ex)
            {
                // Log del error si es necesario, pero continuar sin logo
                System.Diagnostics.Debug.WriteLine($"Error al buscar logo: {ex.Message}");
            }

            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(20);
                page.DefaultTextStyle(x => x.FontSize(9).FontColor(Colors.Black).FontFamily("Arial"));

                // Encabezado limpio sin bordes
                page.Header().Container().Padding(12).Background(Colors.White).Column(column =>
                {
                    column.Item().Row(row =>
                    {
                        // Logo a la izquierda
                        row.ConstantItem(100).Column(logoCol =>
                        {
                            if (logoExists)
                            {
                                try
                                {
                                    // Logo sin bordes, integrado naturalmente
                                    logoCol.Item().Width(80).Height(60)
                                        .Padding(2).Image(logoPath).FitArea();
                                }
                                catch
                                {
                                    // Fallback si falla la carga de imagen
                                    logoCol.Item().Width(80).Height(60).Background(Colors.Grey.Lighten4)
                                        .AlignCenter().AlignMiddle().Text("GAD")
                                        .FontSize(14).Bold().FontColor(Colors.Black);
                                }
                            }
                            else
                            {
                                // Logo placeholder cuando no existe el archivo
                                logoCol.Item().Width(80).Height(60).Background(Colors.Grey.Lighten4)
                                    .AlignCenter().AlignMiddle().Text("GAD")
                                    .FontSize(14).Bold().FontColor(Colors.Black);
                            }
                        });

                        // Información del emisor al centro
                        row.RelativeItem().Padding(8).Column(infoCol =>
                        {
                            infoCol.Item().AlignCenter().Text("GOBIERNO AUTÓNOMO DESCENTRALIZADO").FontSize(14).Bold().FontColor(Colors.Black);
                            infoCol.Item().AlignCenter().Text("PARROQUIAL DE CHECA").FontSize(12).Bold().FontColor(Colors.Grey.Darken2);
                            infoCol.Item().AlignCenter().PaddingTop(2).Text("ADMINISTRACIÓN DE CEMENTERIOS").FontSize(10).FontColor(Colors.Grey.Darken1);

                        });

                        // Número de comprobante a la derecha con diseño más sutil
                        row.ConstantItem(130).Column(numCol =>
                        {
                            numCol.Item().Border(1).BorderColor(Colors.Grey.Darken1).Background(Colors.White)
                                .Padding(8).Column(c =>
                            {
                                c.Item().AlignCenter().Text("COMPROBANTE").FontSize(9).Bold().FontColor(Colors.Black);
                                c.Item().AlignCenter().Text("N° " + _pago.Id.ToString("D8")).FontSize(14).Bold().FontColor(Colors.Black);
                                c.Item().AlignCenter().PaddingTop(3).Text(_pago.FechaPago.ToString("dd/MM/yyyy")).FontSize(8).FontColor(Colors.Grey.Darken2);
                                c.Item().AlignCenter().Text(_pago.FechaPago.ToString("HH:mm")).FontSize(7).FontColor(Colors.Grey.Darken1);
                            });
                        });
                    });

                    // Línea separadora sutil
                    column.Item().PaddingTop(8).Border(0.5f).BorderColor(Colors.Grey.Lighten1);
                });

                // Contenido
                page.Content().Element(ComposeContent);

                // Pie de página mejorado
                page.Footer().Border(1).BorderColor(Colors.Grey.Lighten1).Background(Colors.Grey.Lighten4)
                    .Padding(6).Row(row =>
                {
                    row.RelativeItem().Column(left =>
                    {
                        left.Item().Text("Documento válido según normativa vigente").FontSize(7).FontColor(Colors.Grey.Darken2);
                        // left.Item().Text("Para consultas: administracion@gadcheca.gob.ec").FontSize(7).FontColor(Colors.Grey.Darken2);
                    });

                    row.RelativeItem().AlignRight().Column(right =>
                    {
                        right.Item().AlignRight().Text($"Generado: {DateTime.Now:dd/MM/yyyy HH:mm}").FontSize(7).FontColor(Colors.Grey.Darken1);
                        right.Item().AlignRight().Text($"Usuario: {_responsable.Nombres} {_responsable.Apellidos}").FontSize(7).FontColor(Colors.Grey.Darken1);
                    });
                });
            });
        }

        private void ComposeContent(IContainer container)
        {
            var primeraCuota = _pago.Cuotas.FirstOrDefault();
            var contrato = primeraCuota?.Contrato;
            var boveda = contrato?.Boveda;
            var cementerio = boveda?.Piso?.Bloque?.Cementerio;

            // Variables para el resumen financiero
            var subtotal = _pago.Cuotas.Sum(cuota => cuota.Monto);
            var descuentos = 0m; // Por ahora no hay descuentos
            var total = subtotal - descuentos;

            container.Column(col =>
            {
                col.Item().PaddingVertical(8);

                // Sección: Información del Cementerio
                col.Item().Background(Colors.Grey.Lighten3).Border(1).BorderColor(Colors.Grey.Darken1)
                    .Padding(8).Column(cemCol =>
                {
                    cemCol.Item().Text("📍 INFORMACIÓN DEL CEMENTERIO").FontSize(11).Bold().FontColor(Colors.Black);
                    cemCol.Item().PaddingTop(4).Row(row =>
                    {
                        row.RelativeItem().Text("Cementerio: ").Bold().FontColor(Colors.Black);
                        row.RelativeItem(2).Text(cementerio?.Nombre ?? "N/A").FontColor(Colors.Grey.Darken2);
                    });
                    cemCol.Item().PaddingTop(2).Row(row =>
                    {
                        row.RelativeItem().Text("Dirección: ").Bold().FontColor(Colors.Black);
                        row.RelativeItem(2).Text(cementerio?.Direccion ?? "N/A").FontColor(Colors.Grey.Darken2);
                    });
                });

                col.Item().PaddingVertical(6);

                // Sección: Datos del Cliente y Contrato
                col.Item().Border(1).BorderColor(Colors.Grey.Darken1).Background(Colors.Grey.Lighten4)
                    .Padding(8).Column(clientCol =>
                {
                    clientCol.Item().Text("👤 DATOS DEL CLIENTE Y CONTRATO").FontSize(11).Bold().FontColor(Colors.Black);
                    clientCol.Item().PaddingTop(6);

                    clientCol.Item().Row(row =>
                    {
                        // Columna izquierda
                        row.RelativeItem().Column(left =>
                        {
                            left.Item().Row(r =>
                            {
                                r.ConstantItem(90).Text("Cliente:").Bold().FontColor(Colors.Black);
                                r.RelativeItem().Text($"{_responsable.Nombres} {_responsable.Apellidos}").FontColor(Colors.Grey.Darken2);
                            });
                            left.Item().PaddingTop(2).Row(r =>
                            {
                                r.ConstantItem(90).Text("Identificación:").Bold().FontColor(Colors.Black);
                                r.RelativeItem().Text(_responsable.NumeroIdentificacion).FontColor(Colors.Grey.Darken2);
                            });
                            left.Item().PaddingTop(2).Row(r =>
                            {
                                r.ConstantItem(90).Text("Dirección:").Bold().FontColor(Colors.Black);
                                r.RelativeItem().Text(_responsable.Direccion ?? "N/A").FontColor(Colors.Grey.Darken2);
                            });
                        });

                        // Columna derecha
                        row.RelativeItem().Column(right =>
                        {
                            right.Item().Row(r =>
                            {
                                r.ConstantItem(90).Text("Contrato N°:").Bold().FontColor(Colors.Black);
                                r.RelativeItem().Text(contrato?.NumeroSecuencial ?? "N/A").FontColor(Colors.Grey.Darken2);
                            });
                            right.Item().PaddingTop(2).Row(r =>
                            {
                                r.ConstantItem(90).Text("Bóveda:").Bold().FontColor(Colors.Black);
                                r.RelativeItem().Text($"{boveda?.Piso?.Bloque?.Descripcion ?? "N/A"} - Piso {boveda?.Piso?.NumeroPiso.ToString() ?? "0"} - Bóveda {(boveda?.Numero.ToString() ?? "N/A")}").FontColor(Colors.Grey.Darken2);
                            });
                            right.Item().PaddingTop(2).Row(r =>
                            {
                                r.ConstantItem(90).Text("Fecha de Pago:").Bold().FontColor(Colors.Black);
                                r.RelativeItem().Text(_pago.FechaPago.ToString("dd/MM/yyyy")).FontColor(Colors.Grey.Darken2);
                            });
                        });
                    });
                });

                col.Item().PaddingVertical(8);

                // Sección: Detalle de Cuotas Pagadas
                col.Item().Column(detailCol =>
                {
                    detailCol.Item().Text("💰 DETALLE DE CUOTAS PAGADAS").FontSize(11).Bold().FontColor(Colors.Black);
                    detailCol.Item().PaddingTop(6);

                    detailCol.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(60);   // N° Cuota
                            columns.RelativeColumn(3);    // Descripción
                            columns.ConstantColumn(75);   // Fecha Vencimiento
                            columns.ConstantColumn(70);   // Monto
                            columns.ConstantColumn(70);   // Total
                        });

                        // Encabezado de la tabla
                        table.Header(header =>
                        {
                            header.Cell().Background(Colors.Grey.Darken2).Padding(6).Text("N°").Bold().FontColor(Colors.White).FontSize(9);
                            header.Cell().Background(Colors.Grey.Darken2).Padding(6).Text("Descripción").Bold().FontColor(Colors.White).FontSize(9);
                            header.Cell().Background(Colors.Grey.Darken2).Padding(6).AlignCenter().Text("Vencimiento").Bold().FontColor(Colors.White).FontSize(9);
                            header.Cell().Background(Colors.Grey.Darken2).Padding(6).AlignRight().Text("Monto").Bold().FontColor(Colors.White).FontSize(9);
                            header.Cell().Background(Colors.Grey.Darken2).Padding(6).AlignRight().Text("Total").Bold().FontColor(Colors.White).FontSize(9);
                        });

                        // Filas de datos con mejor diseño
                        var isEvenRow = false;
                        foreach (var cuota in _pago.Cuotas)
                        {
                            var backgroundColor = isEvenRow ? Colors.Grey.Lighten4 : Colors.White;
                            var textColor = Colors.Black;

                            table.Cell().Background(backgroundColor).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(6)
                                .Text($"#{cuota.Id}").FontSize(8).FontColor(textColor).Bold();
                            table.Cell().Background(backgroundColor).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(6)
                                .Text($"Cuota venc. {cuota.FechaVencimiento:dd/MM/yyyy}").FontSize(8).FontColor(textColor);
                            table.Cell().Background(backgroundColor).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(6)
                                .AlignCenter().Text(cuota.FechaVencimiento.ToString("dd/MM/yyyy")).FontSize(8).FontColor(textColor);
                            table.Cell().Background(backgroundColor).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(6)
                                .AlignRight().Text(cuota.Monto.ToString("C")).FontSize(8).FontColor(textColor);
                            table.Cell().Background(backgroundColor).Border(1).BorderColor(Colors.Grey.Lighten2).Padding(6)
                                .AlignRight().Text(cuota.Monto.ToString("C")).FontSize(8).Bold().FontColor(Colors.Black);

                            isEvenRow = !isEvenRow;
                        }
                    });
                });

                col.Item().PaddingVertical(6);                // Sección: Resumen Financiero y Observaciones en una fila
                col.Item().Row(row =>
                {
                    // Resumen Financiero a la izquierda
                    row.ConstantItem(200).Border(1).BorderColor(Colors.Black).Background(Colors.Grey.Lighten3).Padding(8).Column(c =>
                    {
                        c.Item().Text("💳 RESUMEN").FontSize(10).Bold().FontColor(Colors.Black);
                        c.Item().PaddingTop(4);

                        c.Item().Row(r =>
                        {
                            r.RelativeItem().Text("Subtotal:").Bold().FontColor(Colors.Black).FontSize(9);
                            r.ConstantItem(80).AlignRight().Text(subtotal.ToString("C")).FontSize(9).FontColor(Colors.Grey.Darken2);
                        });

                        c.Item().PaddingTop(2).Row(r =>
                        {
                            r.RelativeItem().Text("Descuentos:").Bold().FontColor(Colors.Black).FontSize(9);
                            r.ConstantItem(80).AlignRight().Text(descuentos.ToString("C")).FontColor(Colors.Grey.Darken1).FontSize(9);
                        });

                        c.Item().PaddingTop(4).Border(1).BorderColor(Colors.Black).Background(Colors.Grey.Lighten2).Padding(4).Row(r =>
                        {
                            r.RelativeItem().Text("TOTAL:").FontSize(11).Bold().FontColor(Colors.Black);
                            r.ConstantItem(80).AlignRight().Text(total.ToString("C")).FontSize(12).Bold().FontColor(Colors.Black);
                        });
                    });

                    row.ConstantItem(10); // Espacio

                    // Observaciones a la derecha
                    row.RelativeItem().Background(Colors.Grey.Lighten4).Border(1).BorderColor(Colors.Grey.Darken1).Padding(8).Column(obsCol =>
                    {
                        obsCol.Item().Text("⚠️ OBSERVACIONES").FontSize(10).Bold().FontColor(Colors.Black);
                        obsCol.Item().PaddingTop(4).Text("• Este comprobante es un documento válido de pago.").FontSize(8).FontColor(Colors.Grey.Darken2);
                        obsCol.Item().PaddingTop(2).Text("• Conserve este documento para futuras referencias.").FontSize(8).FontColor(Colors.Grey.Darken2);
                        obsCol.Item().PaddingTop(2).Text("• Para consultas, acérquese a nuestras oficinas.").FontSize(8).FontColor(Colors.Grey.Darken2);
                        obsCol.Item().PaddingTop(2).Text("• Documento válido para efectos tributarios.").FontSize(8).FontColor(Colors.Grey.Darken2);
                    });
                });
            });
        }
    }
}
