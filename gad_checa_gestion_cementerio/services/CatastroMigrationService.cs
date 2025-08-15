using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Areas.Identity.Data;
using System.Globalization;
using Microsoft.AspNetCore.Identity;

namespace gad_checa_gestion_cementerio.Services
{
    public class CatastroMigrationService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<CatastroMigrationService> _logger;

        public CatastroMigrationService(
            ApplicationDbContext context, 
            UserManager<ApplicationUser> userManager,
            ILogger<CatastroMigrationService> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<CatastroMigrationResult> MigrarCatastroDesdeExcel(string rutaArchivo)
        {
            var resultado = new CatastroMigrationResult();

            try
            {
                // Configurar EPPlus para uso no comercial
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

                using var package = new ExcelPackage(new FileInfo(rutaArchivo));

                _logger.LogInformation($"Iniciando migración de catastro desde: {rutaArchivo}");
                _logger.LogInformation($"Hojas encontradas: {string.Join(", ", package.Workbook.Worksheets.Select(w => w.Name))}");

                // Obtener usuario para la migración
                var usuarioMigracion = await ObtenerUsuarioMigracion();

                // Crear estructura base
                var cementerio = await CrearOValidarCementerio(usuarioMigracion);

                // Crear bloques lógicos para resolver conflictos de numeración
                await CrearBloquesLogicos(cementerio, usuarioMigracion);

                // Procesar cada hoja del archivo Excel
                foreach (var worksheet in package.Workbook.Worksheets)
                {
                    _logger.LogInformation($"📄 Procesando hoja: {worksheet.Name}");
                    
                    if (worksheet.Name.ToUpper().Contains("TÚMULOS") || worksheet.Name.ToUpper().Contains("TUMULOS"))
                    {
                        // Procesar hoja TÚMULOS con formato especial
                        await ProcesarHojaTumulos(worksheet, cementerio, usuarioMigracion, resultado);
                    }
                    else
                    {
                        // Procesar hojas normales (NICHOS, BÓVEDAS)
                        await ProcesarHojaNormal(worksheet, cementerio, usuarioMigracion, resultado);
                    }
                }

                resultado.EsExitoso = true;
                _logger.LogInformation("Migración de catastro completada exitosamente");
            }
            catch (Exception ex)
            {
                resultado.Errores.Add($"Error general: {ex.Message}");
                _logger.LogError(ex, "Error durante la migración del catastro");
            }

            return resultado;
        }

        private async Task CrearBloquesLogicos(Cementerio cementerio, ApplicationUser usuario)
        {
            _logger.LogInformation("🧠 Creando bloques lógicos para resolver conflictos de numeración...");

            // Crear bloque lógico para nichos
            var bloqueLogicoNichos = await _context.Bloque.FirstOrDefaultAsync(b => b.Descripcion == "Lógico Nichos");
            if (bloqueLogicoNichos == null)
            {
                bloqueLogicoNichos = new Bloque
                {
                    Descripcion = "Lógico Nichos",
                    CalleA = "Virtual",
                    CalleB = "Virtual",
                    Tipo = "Nichos",
                    NumeroDePisos = 1,
                    BovedasPorPiso = 100,
                    TarifaBase = 30.00m,
                    Estado = true,
                    FechaCreacion = DateTime.Now,
                    FechaActualizacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id,
                    UsuarioActualizadorId = usuario.Id,
                    CementerioId = cementerio.Id
                };

                _context.Bloque.Add(bloqueLogicoNichos);
                await _context.SaveChangesAsync();
                _logger.LogInformation("✅ Bloque 'Lógico Nichos' creado");
            }

            // Crear bloque lógico para bóvedas
            var bloqueLogicoBovedas = await _context.Bloque.FirstOrDefaultAsync(b => b.Descripcion == "Lógico Bóvedas");
            if (bloqueLogicoBovedas == null)
            {
                bloqueLogicoBovedas = new Bloque
                {
                    Descripcion = "Lógico Bóvedas",
                    CalleA = "Virtual",
                    CalleB = "Virtual",
                    Tipo = "Bovedas",
                    NumeroDePisos = 1,
                    BovedasPorPiso = 100,
                    TarifaBase = 50.00m,
                    Estado = true,
                    FechaCreacion = DateTime.Now,
                    FechaActualizacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id,
                    UsuarioActualizadorId = usuario.Id,
                    CementerioId = cementerio.Id
                };

                _context.Bloque.Add(bloqueLogicoBovedas);
                await _context.SaveChangesAsync();
                _logger.LogInformation("✅ Bloque 'Lógico Bóvedas' creado");
            }

            // Crear pisos para los bloques lógicos
            var pisoLogicoNichos = await _context.Piso.FirstOrDefaultAsync(p => p.BloqueId == bloqueLogicoNichos.Id);
            if (pisoLogicoNichos == null)
            {
                pisoLogicoNichos = new Piso
                {
                    NumeroPiso = 1,
                    BloqueId = bloqueLogicoNichos.Id,
                    Precio = 30.00m
                };

                _context.Piso.Add(pisoLogicoNichos);
                await _context.SaveChangesAsync();
            }

            var pisoLogicoBovedas = await _context.Piso.FirstOrDefaultAsync(p => p.BloqueId == bloqueLogicoBovedas.Id);
            if (pisoLogicoBovedas == null)
            {
                pisoLogicoBovedas = new Piso
                {
                    NumeroPiso = 1,
                    BloqueId = bloqueLogicoBovedas.Id,
                    Precio = 50.00m
                };

                _context.Piso.Add(pisoLogicoBovedas);
                await _context.SaveChangesAsync();
            }
        }

        private async Task ProcesarHojaNormal(ExcelWorksheet worksheet, Cementerio cementerio, ApplicationUser usuario, CatastroMigrationResult resultado)
        {
            // Identificar y crear las secciones del catastro
            var secciones = IdentificarSecciones(worksheet);
            resultado.Mensajes.AddRange(secciones.Select(s => $"Sección encontrada: {s.Nombre} (filas {s.FilaInicio}-{s.FilaFin})"));

            // Crear bloques y pisos basados en las secciones
            await CrearEstructuraBovedas(secciones, cementerio, usuario, resultado);

            // Migrar registros por sección
            foreach (var seccion in secciones)
            {
                await MigrarSeccion(worksheet, seccion, usuario, resultado);
            }
        }

        private async Task ProcesarHojaTumulos(ExcelWorksheet worksheet, Cementerio cementerio, ApplicationUser usuario, CatastroMigrationResult resultado)
        {
            _logger.LogInformation("🏺 Procesando hoja TÚMULOS con formato especial");

            // Crear bloque TÚMULOS
            var bloqueExistente = await _context.Bloque.FirstOrDefaultAsync(b => b.Descripcion == "Túmulos");
            
            Bloque bloque;
            if (bloqueExistente == null)
            {
                bloque = new Bloque
                {
                    Descripcion = "Túmulos",
                    CalleA = "No especificada",
                    CalleB = "No especificada", 
                    Tipo = "Tumulos",
                    NumeroDePisos = 1,
                    BovedasPorPiso = 100,
                    TarifaBase = 50.00m,
                    Estado = true,
                    FechaCreacion = DateTime.Now,
                    FechaActualizacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id,
                    UsuarioActualizadorId = usuario.Id,
                    CementerioId = cementerio.Id
                };

                _context.Bloque.Add(bloque);
                await _context.SaveChangesAsync();
                resultado.BloquesCreados++;
            }
            else
            {
                bloque = bloqueExistente;
            }

            // Crear piso para el bloque
            var pisoExistente = await _context.Piso.FirstOrDefaultAsync(p => p.BloqueId == bloque.Id);
            
            Piso piso;
            if (pisoExistente == null)
            {
                piso = new Piso
                {
                    NumeroPiso = 1,
                    BloqueId = bloque.Id,
                    Precio = 50.00m
                };

                _context.Piso.Add(piso);
                await _context.SaveChangesAsync();
                resultado.PisosCreados++;
            }
            else
            {
                piso = pisoExistente;
            }

            // Procesar registros de TÚMULOS
            var filas = worksheet.Dimension?.Rows ?? 0;
            var numeroSecuencial = 1;

            for (int fila = 2; fila <= filas; fila++) // Empezar desde fila 2 para saltar encabezado
            {
                try
                {
                    var registro = ExtraerRegistroFilaTumulos(worksheet, fila, numeroSecuencial);
                    
                    if (!EsFilaVacia(registro))
                    {
                        await ProcesarRegistroTumulos(registro, piso.Id, usuario, resultado);
                        numeroSecuencial++;
                    }
                }
                catch (Exception ex)
                {
                    resultado.Errores.Add($"Error en fila {fila} de TÚMULOS: {ex.Message}");
                    _logger.LogWarning($"Error procesando fila {fila} de TÚMULOS: {ex.Message}");
                }
            }
        }

        private List<SeccionCatastro> IdentificarSecciones(ExcelWorksheet worksheet)
        {
            var secciones = new List<SeccionCatastro>();
            var filas = worksheet.Dimension?.Rows ?? 0;

            SeccionCatastro? seccionActual = null;

            for (int fila = 1; fila <= filas; fila++)
            {
                // Buscar encabezados de sección en cualquier columna de la fila
                string contenidoFila = "";
                for (int col = 1; col <= 10; col++) // Revisar las primeras 10 columnas
                {
                    var contenidoColumna = worksheet.Cells[fila, col].Value?.ToString()?.Trim();
                    if (!string.IsNullOrEmpty(contenidoColumna))
                    {
                        contenidoFila += contenidoColumna + " ";
                    }
                }
                contenidoFila = contenidoFila.Trim();
                
                // Buscar encabezados de sección
                if (!string.IsNullOrEmpty(contenidoFila))
                {
                    // Debug: Log contenido de filas que podrían ser encabezados
                    if (contenidoFila.ToUpper().Contains("TUMULO") || contenidoFila.ToUpper().Contains("TÚMULO"))
                    {
                        _logger.LogInformation($"🔍 Fila {fila}: Detectado posible encabezado TÚMULOS: '{contenidoFila}'");
                    }
                    
                    // Detectar secciones válidas
                    if (EsSeccionValida(contenidoFila))
                    {
                        // Finalizar sección anterior
                        if (seccionActual != null)
                        {
                            seccionActual.FilaFin = fila - 1;
                            secciones.Add(seccionActual);
                        }

                        // Crear nueva sección
                        seccionActual = new SeccionCatastro
                        {
                            Nombre = contenidoFila,
                            FilaInicio = fila + 2, // Saltar header
                            TipoBloque = DeterminarTipoBloque(contenidoFila)
                        };
                    }
                }

                // Si llegamos al final y hay una sección activa
                if (fila == filas && seccionActual != null)
                {
                    seccionActual.FilaFin = fila;
                    secciones.Add(seccionActual);
                }
            }

            return secciones;
        }

        private bool EsSeccionValida(string contenidoFila)
        {
            if (string.IsNullOrEmpty(contenidoFila)) return false;
            
            var contenido = contenidoFila.ToUpper();
            
            // Excluir "BLOQUES DE NICHOS PARTE INFERIOR" - solo para nichos
            if (contenido.Contains("BLOQUES DE NICHOS PARTE INFERIOR"))
                return false;
            
            // Secciones de nichos
            if (contenido.Contains("SOBRE BLOQUE") || 
                contenido.Contains("BLOQUE MANO DERECHA DEL CRISTO"))
                return true;
            
            // Secciones de túmulos
            if (contenido.Contains("TUMULOS") || contenido.Contains("TÚMULOS"))
                return true;
            
            // Secciones de bóvedas
            if (contenido.Contains("BLOQUES DE BÓVEDAS") ||
                contenido.Contains("BOVEDAS") ||
                EsBloqueBovedas(contenido))
                return true;
            
            // Secciones de nichos generales
            if (contenido.Contains("NICHOS") && !contenido.Contains("BLOQUES DE NICHOS"))
                return true;
            
            return false;
        }

        private bool EsBloqueBovedas(string contenido)
        {
            // Bloques con letras: A, B, C, D, E, F
            var bloquesLetra = new[] { "BLOQUE \"A\"", "BLOQUE \"B\"", "BLOQUE \"C\"", "BLOQUE \"D\"", "BLOQUE \"E\"", "BLOQUE \"F\"",
                                     "BLOQUE 'A'", "BLOQUE 'B'", "BLOQUE 'C'", "BLOQUE 'D'", "BLOQUE 'E'", "BLOQUE 'F'" };
            
            // Bloques numerados: 1-16
            for (int i = 1; i <= 16; i++)
            {
                if (contenido.Contains($"BLOQUE {i}"))
                    return true;
            }
            
            // Bloques especiales del Cristo
            if (contenido.Contains("BLOQUE MANO DERECHA DEL CRISTO") ||
                contenido.Contains("BLOQUE MANO IZQUIERDA DEL CRISTO") ||
                contenido.Contains("BLOQUE MANO IZQUIERDA DEL CRISTO PARTE BAJA"))
                return true;
            
            // Verificar bloques con letras
            return bloquesLetra.Any(bloque => contenido.Contains(bloque));
        }

        private string DeterminarTipoBloque(string nombreSeccion)
        {
            var nombre = nombreSeccion.ToUpper();
            if (nombre.Contains("NICHO") || nombre.Contains("SOBRE BLOQUE") || nombre.Contains("BLOQUE MANO DERECHA DEL CRISTO"))
                return "Nichos";
            else if (nombre.Contains("TUMULO") || nombre.Contains("TÚMULO"))
                return "Tumulos";
            else
                return "Bovedas";
        }

        private async Task CrearEstructuraBovedas(List<SeccionCatastro> secciones, Cementerio cementerio, ApplicationUser usuario, CatastroMigrationResult resultado)
        {
            foreach (var seccion in secciones)
            {
                // Crear bloque para cada sección
                var nombreBloque = ExtraerNombreBloque(seccion.Nombre);
                
                var bloqueExistente = await _context.Bloque
                    .FirstOrDefaultAsync(b => b.Descripcion == nombreBloque);

                Bloque bloque;
                if (bloqueExistente == null)
                {
                    bloque = new Bloque
                    {
                        Descripcion = nombreBloque,
                        CalleA = "No especificada",
                        CalleB = "No especificada",
                        Tipo = seccion.TipoBloque,
                        NumeroDePisos = 1,
                        BovedasPorPiso = 100,
                        TarifaBase = seccion.TipoBloque == "Nichos" ? 30.00m : 50.00m,
                        Estado = true,
                        FechaCreacion = DateTime.Now,
                        FechaActualizacion = DateTime.Now,
                        UsuarioCreadorId = usuario.Id,
                        UsuarioActualizadorId = usuario.Id,
                        CementerioId = cementerio.Id
                    };

                    _context.Bloque.Add(bloque);
                    await _context.SaveChangesAsync();
                    resultado.BloquesCreados++;
                    seccion.BloqueId = bloque.Id;
                }
                else
                {
                    bloque = bloqueExistente;
                    seccion.BloqueId = bloque.Id;
                }

                // Crear piso para el bloque
                var pisoExistente = await _context.Piso
                    .FirstOrDefaultAsync(p => p.BloqueId == bloque.Id);

                if (pisoExistente == null)
                {
                    var piso = new Piso
                    {
                        NumeroPiso = 1,
                        BloqueId = bloque.Id,
                        Precio = seccion.TipoBloque == "Nichos" ? 30.00m : 50.00m
                    };

                    _context.Piso.Add(piso);
                    await _context.SaveChangesAsync();
                    resultado.PisosCreados++;
                    seccion.PisoId = piso.Id;

                    // Crear todas las bóvedas automáticamente (100 bóvedas por bloque)
                    await CrearBovedasAutomaticamente(piso, usuario, resultado);
                }
                else
                {
                    seccion.PisoId = pisoExistente.Id;
                    
                    // Verificar si el piso existente tiene bóvedas, si no, crearlas
                    var bovedasExistentes = await _context.Boveda.CountAsync(b => b.PisoId == pisoExistente.Id);
                    if (bovedasExistentes == 0)
                    {
                        await CrearBovedasAutomaticamente(pisoExistente, usuario, resultado);
                    }
                }
            }
        }

        private string ExtraerNombreBloque(string nombreSeccion)
        {
            var seccion = nombreSeccion.ToUpper();
            
            // Mapear los nombres específicos de bloques de nichos
            if (seccion.Contains("SOBRE BLOQUE \"B\" PARTE FRONTAL") || seccion.Contains("SOBRE BLOQUE 'B' PARTE FRONTAL"))
                return "Sobre Bloque B Frontal";
            else if (seccion.Contains("SOBRE BLOQUE \"B\" PARTE POSTERIOR") || seccion.Contains("SOBRE BLOQUE 'B' PARTE POSTERIOR"))
                return "Sobre Bloque B Posterior";
            else if (seccion.Contains("SOBRE BLOQUE \"C\" PARTE FRONTAL") || seccion.Contains("SOBRE BLOQUE 'C' PARTE FRONTAL"))
                return "Sobre Bloque C Frontal";
            else if (seccion.Contains("SOBRE BLOQUE \"C\" PARTE POSTERIOR") || seccion.Contains("SOBRE BLOQUE 'C' PARTE POSTERIOR"))
                return "Sobre Bloque C Posterior";
            else if (seccion.Contains("SOBRE BLOQUE \"D\" PARTE FRONTAL") || seccion.Contains("SOBRE BLOQUE 'D' PARTE FRONTAL"))
                return "Sobre Bloque D Frontal";
            else if (seccion.Contains("SOBRE BLOQUE \"D\" PARTE POSTERIOR") || seccion.Contains("SOBRE BLOQUE 'D' PARTE POSTERIOR"))
                return "Sobre Bloque D Posterior";
            else if (seccion.Contains("SOBRE BLOQUE \"E\" PARTE FRONTAL") || seccion.Contains("SOBRE BLOQUE 'E' PARTE FRONTAL"))
                return "Sobre Bloque E Frontal";
            else if (seccion.Contains("SOBRE BLOQUE \"E\" PARTE POSTERIOR") || seccion.Contains("SOBRE BLOQUE 'E' PARTE POSTERIOR"))
                return "Sobre Bloque E Posterior";
            else if (seccion.Contains("SOBRE BLOQUE \"F\" PARTE LATERAL") || seccion.Contains("SOBRE BLOQUE 'F' PARTE LATERAL"))
                return "Sobre Bloque F Lateral";
            else if (seccion.Contains("BLOQUE MANO DERECHA DEL CRISTO"))
                return "Bloque Mano Derecha del Cristo";
            
            // Mapear bloques de bóvedas con letras
            else if (seccion.Contains("BLOQUE \"A\"") || seccion.Contains("BLOQUE 'A'"))
                return "Bloque A";
            else if (seccion.Contains("BLOQUE \"B\"") || seccion.Contains("BLOQUE 'B'"))
                return "Bloque B";
            else if (seccion.Contains("BLOQUE \"C\"") || seccion.Contains("BLOQUE 'C'"))
                return "Bloque C";
            else if (seccion.Contains("BLOQUE \"D\"") || seccion.Contains("BLOQUE 'D'"))
                return "Bloque D";
            else if (seccion.Contains("BLOQUE \"E\"") || seccion.Contains("BLOQUE 'E'"))
                return "Bloque E";
            else if (seccion.Contains("BLOQUE \"F\"") || seccion.Contains("BLOQUE 'F'"))
                return "Bloque F";
            
            // Mapear bloques numerados de bóvedas
            else if (seccion.Contains("BLOQUE 1"))
                return "Bloque 1";
            else if (seccion.Contains("BLOQUE 2"))
                return "Bloque 2";
            else if (seccion.Contains("BLOQUE 3"))
                return "Bloque 3";
            else if (seccion.Contains("BLOQUE 4"))
                return "Bloque 4";
            else if (seccion.Contains("BLOQUE 5"))
                return "Bloque 5";
            else if (seccion.Contains("BLOQUE 6"))
                return "Bloque 6";
            else if (seccion.Contains("BLOQUE 7"))
                return "Bloque 7";
            else if (seccion.Contains("BLOQUE 8"))
                return "Bloque 8";
            else if (seccion.Contains("BLOQUE 9"))
                return "Bloque 9";
            else if (seccion.Contains("BLOQUE 10"))
                return "Bloque 10";
            else if (seccion.Contains("BLOQUE 11"))
                return "Bloque 11";
            else if (seccion.Contains("BLOQUE 12"))
                return "Bloque 12";
            else if (seccion.Contains("BLOQUE 13"))
                return "Bloque 13";
            else if (seccion.Contains("BLOQUE 14"))
                return "Bloque 14";
            else if (seccion.Contains("BLOQUE 15"))
                return "Bloque 15";
            else if (seccion.Contains("BLOQUE 16"))
                return "Bloque 16";
            
            // Bloques especiales del Cristo para bóvedas
            else if (seccion.Contains("BLOQUE MANO IZQUIERDA DEL CRISTO PARTE BAJA"))
                return "Bloque Mano Izquierda del Cristo Parte Baja";
            else if (seccion.Contains("BLOQUE MANO IZQUIERDA DEL CRISTO"))
                return "Bloque Mano Izquierda del Cristo";
            
            // Otros tipos
            else if (seccion.Contains("TUMULOS") || seccion.Contains("TÚMULOS"))
                return "Túmulos";
            else if (seccion.Contains("BOVEDAS"))
                return "Bóvedas";
            else
                return nombreSeccion;
        }

        private async Task MigrarSeccion(ExcelWorksheet worksheet, SeccionCatastro seccion, ApplicationUser usuario, CatastroMigrationResult resultado)
        {
            for (int fila = seccion.FilaInicio; fila <= seccion.FilaFin; fila++)
            {
                try
                {
                    var registro = ExtraerRegistroFila(worksheet, fila);
                    
                    if (!EsFilaVacia(registro))
                    {
                        await ProcesarRegistro(registro, seccion, usuario, resultado);
                    }
                }
                catch (Exception ex)
                {
                    resultado.Errores.Add($"Error en fila {fila} de sección '{seccion.Nombre}': {ex.Message}");
                    _logger.LogWarning($"Error procesando fila {fila}: {ex.Message}");
                }
            }
        }

        private RegistroCatastro ExtraerRegistroFila(ExcelWorksheet worksheet, int fila)
        {
            var columnaA = worksheet.Cells[fila, 1].Value?.ToString()?.Trim();
            
            // Para TÚMULOS: Si la columna A no tiene número o dice "suelo", usar un número secuencial
            int? numero = null;
            string nombreDifunto = null;
            
            if (!string.IsNullOrEmpty(columnaA) && (columnaA.ToLower() == "suelo" || !int.TryParse(columnaA, out _)))
            {
                // Es una fila tipo "suelo" - el nombre del difunto está en columna A, no hay número
                nombreDifunto = columnaA;
                numero = null; // Se asignará automáticamente después
            }
            else
            {
                // Formato normal
                numero = ParsearEntero(columnaA);
                nombreDifunto = worksheet.Cells[fila, 2].Value?.ToString()?.Trim();
            }

            return new RegistroCatastro
            {
                Numero = numero,
                NombreDifunto = nombreDifunto,
                FechaContrato = ParsearFecha(worksheet.Cells[fila, 3].Value?.ToString()),
                FechaVencimiento = ParsearFecha(worksheet.Cells[fila, 4].Value?.ToString()),
                EsPropio = EsColumnaTrue(worksheet.Cells[fila, 5].Value?.ToString()),
                EsArrendado = EsColumnaTrue(worksheet.Cells[fila, 6].Value?.ToString()),
                ReutilizacionArriendo = worksheet.Cells[fila, 7].Value?.ToString()?.Trim(),
                Representante = worksheet.Cells[fila, 8].Value?.ToString()?.Trim(),
                Contacto = worksheet.Cells[fila, 9].Value?.ToString()?.Trim(),
                CorreoElectronico = worksheet.Cells[fila, 10].Value?.ToString()?.Trim(),
                Observaciones = worksheet.Cells[fila, 11].Value?.ToString()?.Trim()
            };
        }

        private RegistroCatastro ExtraerRegistroFilaTumulos(ExcelWorksheet worksheet, int fila, int numeroSecuencial)
        {
            // Para TÚMULOS: El nombre del difunto está en columna B (columna 2)
            var nombreDifunto = worksheet.Cells[fila, 2].Value?.ToString()?.Trim();
            
            // Si la columna B está vacía, puede estar en columna A
            if (string.IsNullOrEmpty(nombreDifunto))
            {
                nombreDifunto = worksheet.Cells[fila, 1].Value?.ToString()?.Trim();
            }

            return new RegistroCatastro
            {
                Numero = numeroSecuencial, // Usar número secuencial
                NombreDifunto = nombreDifunto,
                FechaContrato = ParsearFecha(worksheet.Cells[fila, 3].Value?.ToString()),
                FechaVencimiento = ParsearFecha(worksheet.Cells[fila, 4].Value?.ToString()),
                EsPropio = EsColumnaTrue(worksheet.Cells[fila, 4].Value?.ToString()), // Columna "Propio"
                EsArrendado = !EsColumnaTrue(worksheet.Cells[fila, 4].Value?.ToString()), 
                ReutilizacionArriendo = worksheet.Cells[fila, 7].Value?.ToString()?.Trim(),
                Representante = worksheet.Cells[fila, 5].Value?.ToString()?.Trim(), // Columna "Representante"
                Contacto = worksheet.Cells[fila, 6].Value?.ToString()?.Trim(), // Columna "Contacto"
                CorreoElectronico = worksheet.Cells[fila, 7].Value?.ToString()?.Trim(), // Columna "Correo Electrónico"
                Observaciones = worksheet.Cells[fila, 8].Value?.ToString()?.Trim() // Columna "Observaciones"
            };
        }

        private async Task ProcesarRegistroTumulos(RegistroCatastro registro, int pisoId, ApplicationUser usuario, CatastroMigrationResult resultado)
        {
            // 1. Crear/obtener bóveda para TÚMULOS
            var boveda = await CrearOObtenerBovedaTumulos(registro, pisoId, usuario);
            
            // 2. Crear/obtener difunto
            Difunto? difunto = null;
            if (!string.IsNullOrEmpty(registro.NombreDifunto))
            {
                difunto = await CrearOObtenerDifunto(registro, usuario);
            }

            // 3. Crear/obtener persona responsable
            Persona? responsable = null;
            if (!string.IsNullOrEmpty(registro.Representante))
            {
                responsable = await CrearOObtenerPersona(registro, usuario);
            }

            // 4. Si está marcado como "propia", crear propietario y asignarlo a la bóveda
            if (registro.EsPropio && responsable != null)
            {
                var propietario = await CrearOObtenerPropietario(responsable, usuario);
                if (propietario != null)
                {
                    boveda.PropietarioId = propietario.Id;
                    _context.Boveda.Update(boveda);
                    await _context.SaveChangesAsync();
                }
            }

            // 5. Crear contrato si hay difunto
            if (difunto != null && boveda != null)
            {
                await CrearContrato(registro, boveda, difunto, responsable, usuario, resultado);
            }

            resultado.RegistrosProcesados++;
        }

        private async Task<Boveda> CrearOObtenerBovedaTumulos(RegistroCatastro registro, int pisoId, ApplicationUser usuario)
        {
            var numeroBoveda = registro.Numero ?? 1;
            
            var bovedaExistente = await _context.Boveda
                .FirstOrDefaultAsync(b => b.Numero == numeroBoveda && b.PisoId == pisoId);

            if (bovedaExistente == null)
            {
                var boveda = new Boveda
                {
                    Numero = numeroBoveda,
                    NumeroSecuencial = $"{numeroBoveda:000}",
                    Estado = true,
                    FechaCreacion = DateTime.Now,
                    FechaActualizacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id,
                    PisoId = pisoId
                };

                _context.Boveda.Add(boveda);
                await _context.SaveChangesAsync();
                return boveda;
            }

            return bovedaExistente;
        }

        private bool EsFilaVacia(RegistroCatastro registro)
        {
            return string.IsNullOrEmpty(registro.NombreDifunto) &&
                   string.IsNullOrEmpty(registro.Representante) &&
                   !registro.Numero.HasValue;
        }

        private async Task ProcesarRegistro(RegistroCatastro registro, SeccionCatastro seccion, ApplicationUser usuario, CatastroMigrationResult resultado)
        {
            // 1. Crear/obtener bóveda (puede ser en bloque físico o lógico)
            var boveda = await CrearOObtenerBovedaConLogica(registro, seccion, usuario);
            
            // 2. Crear/obtener difunto
            Difunto? difunto = null;
            if (!string.IsNullOrEmpty(registro.NombreDifunto) && 
                !registro.NombreDifunto.Trim().Equals("vacío", StringComparison.OrdinalIgnoreCase) &&
                !registro.NombreDifunto.Trim().Equals("vacio", StringComparison.OrdinalIgnoreCase) &&
                !registro.NombreDifunto.Trim().Equals("empty", StringComparison.OrdinalIgnoreCase))
            {
                difunto = await CrearOObtenerDifunto(registro, usuario);
            }

            // 3. Crear/obtener persona responsable
            Persona? responsable = null;
            if (!string.IsNullOrEmpty(registro.Representante))
            {
                responsable = await CrearOObtenerPersona(registro, usuario);
            }

            // 4. Si está marcado como "propia", crear propietario y asignarlo a la bóveda
            if (registro.EsPropio && responsable != null)
            {
                var propietario = await CrearOObtenerPropietario(responsable, usuario);
                if (propietario != null)
                {
                    boveda.PropietarioId = propietario.Id;
                    _context.Boveda.Update(boveda);
                    await _context.SaveChangesAsync();
                }
            }

            // 5. Crear contrato si hay difunto
            if (difunto != null && boveda != null)
            {
                _logger.LogInformation($"📝 Creando contrato para bóveda #{boveda.Numero} - Difunto: {registro.NombreDifunto}");
                await CrearContratoConRelaciones(registro, boveda, difunto, responsable, usuario, resultado, seccion);
            }
            else
            {
                _logger.LogInformation($"❌ No se crea contrato - Bóveda #{boveda?.Numero} - Difunto: {registro.NombreDifunto} (difunto null: {difunto == null}, boveda null: {boveda == null})");
            }

            resultado.RegistrosProcesados++;
        }

        private async Task<Boveda> CrearOObtenerBoveda(RegistroCatastro registro, SeccionCatastro seccion, ApplicationUser usuario)
        {
            int numeroBoveda;
            
            if (registro.Numero.HasValue)
            {
                numeroBoveda = registro.Numero.Value;
            }
            else
            {
                // Para registros sin número (como en TÚMULOS), generar número secuencial
                var ultimoNumero = await _context.Boveda
                    .Where(b => b.PisoId == seccion.PisoId)
                    .MaxAsync(b => (int?)b.Numero) ?? 0;
                numeroBoveda = ultimoNumero + 1;
            }
            
            var bovedaExistente = await _context.Boveda
                .FirstOrDefaultAsync(b => b.Numero == numeroBoveda && b.PisoId == seccion.PisoId);

            if (bovedaExistente == null)
            {
                var boveda = new Boveda
                {
                    Numero = numeroBoveda,
                    NumeroSecuencial = $"{numeroBoveda:000}",
                    Estado = true,
                    FechaCreacion = DateTime.Now,
                    FechaActualizacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id,
                    PisoId = seccion.PisoId
                };

                _context.Boveda.Add(boveda);
                await _context.SaveChangesAsync();
                return boveda;
            }

            return bovedaExistente;
        }

        private async Task<Boveda> CrearOObtenerBovedaConLogica(RegistroCatastro registro, SeccionCatastro seccion, ApplicationUser usuario)
        {
            var numeroBoveda = registro.Numero ?? 1;
            var tipoBloque = DeterminarTipoBloque(seccion.Nombre);

            // Verificar si ya existe una bóveda con el mismo número en el mismo bloque físico específico
            var conflicto = await VerificarConflictoNumeracionEnBloqueEspecifico(numeroBoveda, seccion);

            if (conflicto)
            {
                // Usar bloque lógico para resolver conflicto de duplicado en el mismo bloque
                _logger.LogInformation($"🔄 Conflicto detectado para bóveda #{numeroBoveda} - usando bloque lógico {tipoBloque}");
                var pisoLogico = await ObtenerPisoLogico(tipoBloque);
                return await CrearBovedaEnPisoLogico(registro, pisoLogico, usuario);
            }
            else
            {
                // Usar la lógica normal (bloque físico)
                _logger.LogInformation($"✅ Sin conflicto para bóveda #{numeroBoveda} - usando bloque físico");
                return await CrearOObtenerBoveda(registro, seccion, usuario);
            }
        }

        private async Task<bool> VerificarConflictoNumeracionEnBloqueEspecifico(int numeroBoveda, SeccionCatastro seccion)
        {
            // Verificar si ya existe un CONTRATO ACTIVO en una bóveda con el mismo número en el mismo bloque físico específico
            var nombreBloqueEspecifico = ExtraerNombreBloque(seccion.Nombre);
            
            var contratoExistente = await _context.Contrato
                .Include(c => c.Boveda)
                .ThenInclude(b => b.Piso)
                .ThenInclude(p => p.Bloque)
                .FirstOrDefaultAsync(c => c.Boveda.Numero == numeroBoveda && 
                                         c.Boveda.Piso.Bloque.Descripcion == nombreBloqueEspecifico &&
                                         !c.Boveda.Piso.Bloque.Descripcion.Contains("Lógico") &&
                                         c.FechaEliminacion == null &&
                                         c.Estado);

            return contratoExistente != null;
        }

        private async Task<Piso> ObtenerPisoLogico(string tipoBloque)
        {
            var nombreBloqueLogico = tipoBloque == "Nichos" ? "Lógico Nichos" : "Lógico Bóvedas";
            
            var piso = await _context.Piso
                .Include(p => p.Bloque)
                .FirstOrDefaultAsync(p => p.Bloque.Descripcion == nombreBloqueLogico);

            if (piso == null)
            {
                throw new InvalidOperationException($"No se encontró el bloque lógico: {nombreBloqueLogico}");
            }

            return piso;
        }

        private async Task<Boveda> CrearBovedaEnPisoLogico(RegistroCatastro registro, Piso pisoLogico, ApplicationUser usuario)
        {
            var numeroBoveda = registro.Numero ?? 1;
            
            var bovedaExistente = await _context.Boveda
                .FirstOrDefaultAsync(b => b.Numero == numeroBoveda && b.PisoId == pisoLogico.Id);

            if (bovedaExistente == null)
            {
                var boveda = new Boveda
                {
                    Numero = numeroBoveda,
                    NumeroSecuencial = $"{numeroBoveda:000}",
                    Estado = true,
                    FechaCreacion = DateTime.Now,
                    FechaActualizacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id,
                    PisoId = pisoLogico.Id
                };

                _context.Boveda.Add(boveda);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"🔗 Bóveda {numeroBoveda} creada en bloque lógico {pisoLogico.Bloque.Descripcion}");
                return boveda;
            }

            return bovedaExistente;
        }

        private async Task CrearContratoConRelaciones(RegistroCatastro registro, Boveda boveda, Difunto difunto, Persona? responsable, ApplicationUser usuario, CatastroMigrationResult resultado, SeccionCatastro seccion)
        {
            var contratoExistente = await _context.Contrato
                .FirstOrDefaultAsync(c => c.BovedaId == boveda.Id && c.DifuntoId == difunto.Id);

            if (contratoExistente == null)
            {
                var contrato = new Contrato
                {
                    NumeroSecuencial = GenerarNumeroSecuencial(boveda.Id),
                    BovedaId = boveda.Id,
                    DifuntoId = difunto.Id,
                    FechaInicio = registro.FechaContrato ?? DateTime.Now.AddYears(-1),
                    FechaFin = registro.FechaVencimiento ?? DateTime.Now.AddYears(4),
                    NumeroDeMeses = CalcularMeses(registro.FechaContrato, registro.FechaVencimiento),
                    MontoTotal = registro.EsArrendado ? 250.00m : 0m,
                    Observaciones = registro.Observaciones ?? "",
                    Estado = true,
                    EsRenovacion = false,
                    FechaCreacion = DateTime.Now,
                    FechaActualizacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id,
                    UsuarioActualizadorId = usuario.Id
                };

                _context.Contrato.Add(contrato);
                await _context.SaveChangesAsync();

                // Buscar contrato relacionado (mismo número de bóveda en bloque físico)
                await EstablecerRelacionContrato(contrato, registro.Numero ?? 1, seccion, boveda);

                // Agregar responsable si existe
                if (responsable != null)
                {
                    var responsableContrato = new Responsable
                    {
                        Nombres = TruncateString(responsable.Nombres, 95),
                        Apellidos = TruncateString(responsable.Apellidos, 95),
                        TipoIdentificacion = responsable.TipoIdentificacion,
                        NumeroIdentificacion = responsable.NumeroIdentificacion,
                        Telefono = TruncateString(responsable.Telefono, 20),
                        Email = TruncateString(responsable.Email, 100),
                        Direccion = TruncateString(responsable.Direccion, 200),
                        FechaInicio = contrato.FechaInicio,
                        FechaFin = contrato.FechaFin,
                        Estado = true,
                        FechaCreacion = DateTime.Now,
                        UsuarioCreador = usuario,
                        UsuarioCreadorId = usuario.Id
                    };

                    _context.Responsable.Add(responsableContrato);
                    await _context.SaveChangesAsync();

                    // Relacionar con el contrato
                    contrato.Responsables = new List<Responsable> { responsableContrato };
                    await _context.SaveChangesAsync();
                }

                resultado.ContratosCreados++;
            }
        }

        private async Task EstablecerRelacionContrato(Contrato contratoActual, int numeroBoveda, SeccionCatastro seccion, Boveda bovedaActual)
        {
            // Buscar contrato en bóveda física con el mismo número Y del mismo bloque físico
            var tipoBloque = DeterminarTipoBloque(seccion.Nombre);
            var tipoComplementario = tipoBloque == "Nichos" ? "Bovedas" : "Nichos";
            
            // Obtener el nombre del bloque físico actual (sin "Lógico")
            var bloqueActual = await _context.Bloque
                .FirstOrDefaultAsync(b => b.Id == bovedaActual.Piso.BloqueId);
            
            if (bloqueActual == null || bloqueActual.Descripcion.Contains("Lógico"))
            {
                return; // No relacionar contratos de bloques lógicos
            }
            
            // Extraer el identificador del bloque físico (B, C, D, E, F, 1, 2, etc.)
            var identificadorBloqueActual = ExtraerIdentificadorBloque(bloqueActual.Descripcion);

            var contratoRelacionado = await _context.Contrato
                .Include(c => c.Boveda)
                .ThenInclude(b => b.Piso)
                .ThenInclude(p => p.Bloque)
                .FirstOrDefaultAsync(c => c.Boveda.Numero == numeroBoveda && 
                                         c.Boveda.Piso.Bloque.Tipo == tipoComplementario &&
                                         !c.Boveda.Piso.Bloque.Descripcion.Contains("Lógico") &&
                                         ExtraerIdentificadorBloque(c.Boveda.Piso.Bloque.Descripcion) == identificadorBloqueActual);

            if (contratoRelacionado != null)
            {
                // Establecer relación bidireccional
                contratoActual.ContratoRelacionadoId = contratoRelacionado.Id;
                contratoRelacionado.ContratoRelacionadoId = contratoActual.Id;

                _context.Contrato.UpdateRange(contratoActual, contratoRelacionado);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"🔗 Relación establecida: Contrato {contratoActual.Id} ↔ Contrato {contratoRelacionado.Id} (Bóveda #{numeroBoveda}, Bloque {identificadorBloqueActual})");
            }
        }

        private async Task<Difunto> CrearOObtenerDifunto(RegistroCatastro registro, ApplicationUser usuario)
        {
            var partes = registro.NombreDifunto!.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var nombres = partes.Length > 0 ? string.Join(" ", partes.Take(partes.Length / 2 + 1)) : "Sin nombre";
            var apellidos = partes.Length > 1 ? string.Join(" ", partes.Skip(partes.Length / 2 + 1)) : "Sin apellido";
            
            // Truncar campos para evitar errores de longitud
            nombres = TruncateString(nombres, 95); // Dejar espacio para posibles caracteres especiales
            apellidos = TruncateString(apellidos, 95);

            var difuntoExistente = await _context.Difunto
                .FirstOrDefaultAsync(d => d.Nombres == nombres && d.Apellidos == apellidos);

            if (difuntoExistente == null)
            {
                // Obtener el descuento por defecto (Ninguno)
                var descuentoPorDefecto = await _context.Descuento
                    .FirstOrDefaultAsync(d => d.Descripcion == "Ninguno") 
                    ?? await _context.Descuento.FirstOrDefaultAsync();

                if (descuentoPorDefecto == null)
                {
                    throw new InvalidOperationException("No se encontró ningún descuento en la base de datos. Verifique que los datos iniciales estén creados.");
                }

                // Usar fecha de contrato como fecha de fallecimiento si está disponible, sino una fecha por defecto
                var fechaFallecimiento = registro.FechaContrato?.AddDays(-7) ?? DateTime.Now.AddDays(-30);
                
                var difunto = new Difunto
                {
                    Nombres = nombres,
                    Apellidos = apellidos,
                    NumeroIdentificacion = "9999999999", // Temporal
                    FechaNacimiento = fechaFallecimiento.AddYears(-70),
                    FechaFallecimiento = fechaFallecimiento,
                    Estado = true,
                    FechaCreacion = DateTime.Now,
                    FechaActualizacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id,
                    DescuentoId = descuentoPorDefecto.Id
                };

                _context.Difunto.Add(difunto);
                await _context.SaveChangesAsync();
                return difunto;
            }

            return difuntoExistente;
        }

        private async Task<Persona> CrearOObtenerPersona(RegistroCatastro registro, ApplicationUser usuario)
        {
            var partesNombre = registro.Representante!.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var nombres = partesNombre.Length > 0 ? string.Join(" ", partesNombre.Take(partesNombre.Length / 2 + 1)) : "Sin nombre";
            var apellidos = partesNombre.Length > 1 ? string.Join(" ", partesNombre.Skip(partesNombre.Length / 2 + 1)) : "Sin apellido";
            
            // Truncar campos para evitar errores de longitud
            nombres = TruncateString(nombres, 95);
            apellidos = TruncateString(apellidos, 95);

            var personaExistente = await _context.Persona
                .FirstOrDefaultAsync(p => p.Nombres == nombres && p.Apellidos == apellidos);

            if (personaExistente == null)
            {
                var persona = new Persona
                {
                    Nombres = nombres,
                    Apellidos = apellidos,
                    TipoIdentificacion = "CEDULA",
                    NumeroIdentificacion = "9999999999", // Temporal
                    Telefono = TruncateString(registro.Contacto ?? "N/A", 20),
                    Email = TruncateString(registro.CorreoElectronico ?? "no-email@ejemplo.com", 100),
                    Direccion = TruncateString("No especificada", 200),
                    Estado = true,
                    FechaCreacion = DateTime.Now,
                    UsuarioCreador = usuario,
                    UsuarioCreadorId = usuario.Id
                };

                _context.Persona.Add(persona);
                await _context.SaveChangesAsync();
                return persona;
            }

            return personaExistente;
        }

        private async Task<Propietario?> CrearOObtenerPropietario(Persona persona, ApplicationUser usuario)
        {
            try
            {
                // Buscar si ya existe un propietario con estos datos
                var propietarioExistente = await _context.Propietario
                    .FirstOrDefaultAsync(p => p.Nombres == persona.Nombres && p.Apellidos == persona.Apellidos);

                if (propietarioExistente == null)
                {
                    var propietario = new Propietario
                    {
                        Nombres = TruncateString(persona.Nombres, 95),
                        Apellidos = TruncateString(persona.Apellidos, 95),
                        TipoIdentificacion = persona.TipoIdentificacion,
                        NumeroIdentificacion = persona.NumeroIdentificacion,
                        Telefono = persona.Telefono,
                        Email = persona.Email,
                        Direccion = persona.Direccion,
                        Estado = true,
                        FechaCreacion = DateTime.Now,
                        UsuarioCreador = usuario,
                        UsuarioCreadorId = usuario.Id,
                        Catastro = "MIGRADO" // Marcar como proveniente del catastro
                    };

                    _context.Propietario.Add(propietario);
                    await _context.SaveChangesAsync();
                    return propietario;
                }

                return propietarioExistente;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al crear propietario para {persona.Nombres} {persona.Apellidos}");
                return null;
            }
        }

        private async Task CrearContrato(RegistroCatastro registro, Boveda boveda, Difunto difunto, Persona? responsable, ApplicationUser usuario, CatastroMigrationResult resultado)
        {
            var contratoExistente = await _context.Contrato
                .FirstOrDefaultAsync(c => c.BovedaId == boveda.Id && c.DifuntoId == difunto.Id);

            if (contratoExistente == null)
            {
                var contrato = new Contrato
                {
                    NumeroSecuencial = GenerarNumeroSecuencial(boveda.Id),
                    BovedaId = boveda.Id,
                    DifuntoId = difunto.Id,
                    FechaInicio = registro.FechaContrato ?? DateTime.Now.AddYears(-1),
                    FechaFin = registro.FechaVencimiento ?? DateTime.Now.AddYears(4),
                    NumeroDeMeses = CalcularMeses(registro.FechaContrato, registro.FechaVencimiento),
                    MontoTotal = registro.EsArrendado ? 250.00m : 0m,
                    Observaciones = registro.Observaciones ?? "",
                    Estado = true,
                    EsRenovacion = false,
                    FechaCreacion = DateTime.Now,
                    FechaActualizacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id,
                    UsuarioActualizadorId = usuario.Id
                };

                _context.Contrato.Add(contrato);
                await _context.SaveChangesAsync();

                // Agregar responsable si existe
                if (responsable != null)
                {
                    var responsableContrato = new Responsable
                    {
                        Nombres = TruncateString(responsable.Nombres, 95),
                        Apellidos = TruncateString(responsable.Apellidos, 95),
                        TipoIdentificacion = responsable.TipoIdentificacion,
                        NumeroIdentificacion = responsable.NumeroIdentificacion,
                        Telefono = TruncateString(responsable.Telefono, 20),
                        Email = TruncateString(responsable.Email, 100),
                        Direccion = TruncateString(responsable.Direccion, 200),
                        FechaInicio = contrato.FechaInicio,
                        FechaFin = contrato.FechaFin,
                        Estado = true,
                        FechaCreacion = DateTime.Now,
                        UsuarioCreador = usuario,
                        UsuarioCreadorId = usuario.Id
                    };

                    _context.Responsable.Add(responsableContrato);
                    await _context.SaveChangesAsync();

                    // Relacionar con el contrato
                    contrato.Responsables = new List<Responsable> { responsableContrato };
                    await _context.SaveChangesAsync();
                }

                resultado.ContratosCreados++;
            }
        }

        // Métodos auxiliares
        private async Task<ApplicationUser> ObtenerUsuarioMigracion()
        {
            var email = "migracion@sistema.com";
            var usuario = await _userManager.FindByEmailAsync(email);

            if (usuario == null)
            {
                usuario = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    EmailConfirmed = true,
                    Nombres = "Sistema",
                    Apellidos = "Migración"
                };

                await _userManager.CreateAsync(usuario, "Migracion123!");
                _logger.LogInformation("Usuario de migración creado");
            }

            return usuario;
        }

        private async Task<Cementerio> CrearOValidarCementerio(ApplicationUser usuario)
        {
            var cementerio = await _context.Cementerio.FirstOrDefaultAsync();

            if (cementerio == null)
            {
                cementerio = new Cementerio
                {
                    Nombre = "Cementerio Municipal de Checa",
                    Direccion = "Checa, Ecuador",
                    Estado = true,
                    FechaCreacion = DateTime.Now,
                    FechaActualizacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id,
                    UsuarioActualizadorId = usuario.Id,
                    tarifa_arriendo = 50.00m,
                    tarifa_arriendo_nicho = 30.00m,
                    VecesRenovacionBovedas = 3,
                    VecesRenovacionNicho = 5
                };

                _context.Cementerio.Add(cementerio);
                await _context.SaveChangesAsync();
            }

            return cementerio;
        }

        private int? ParsearEntero(string? texto)
        {
            if (string.IsNullOrEmpty(texto)) return null;
            return int.TryParse(texto, out int numero) ? numero : null;
        }

        private DateTime? ParsearFecha(string? fechaTexto)
        {
            if (string.IsNullOrEmpty(fechaTexto)) return null;

            var formatos = new[]
            {
                "d/M/yyyy",
                "dd/MM/yyyy",
                "MM/dd/yyyy", 
                "yyyy-MM-dd",
                "dd-MM-yyyy"
            };

            foreach (var formato in formatos)
            {
                if (DateTime.TryParseExact(fechaTexto, formato, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime fecha))
                {
                    return fecha;
                }
            }

            return null;
        }

        private bool EsColumnaTrue(string? valor)
        {
            if (string.IsNullOrEmpty(valor)) return false;
            valor = valor.Trim().ToLower();
            return valor == "x" || valor == "true" || valor == "1" || valor == "sí" || valor == "si";
        }

        private int CalcularMeses(DateTime? fechaInicio, DateTime? fechaFin)
        {
            if (!fechaInicio.HasValue || !fechaFin.HasValue) return 60; // Default 5 años

            var meses = ((fechaFin.Value.Year - fechaInicio.Value.Year) * 12) + 
                       fechaFin.Value.Month - fechaInicio.Value.Month;
            
            return Math.Max(meses, 1);
        }

        private string GenerarNumeroSecuencial(int bovedaId)
        {
            var year = DateTime.Now.Year;
            var count = _context.Contrato.Count(c => c.BovedaId == bovedaId) + 1;
            return $"{year}-{bovedaId:000}-{count:000}";
        }

        private string TruncateString(string input, int maxLength)
        {
            if (string.IsNullOrEmpty(input))
                return input;
                
            return input.Length <= maxLength ? input : input.Substring(0, maxLength);
        }

        private string ExtraerIdentificadorBloque(string descripcionBloque)
        {
            if (string.IsNullOrEmpty(descripcionBloque))
                return "";

            var descripcion = descripcionBloque.ToUpper();

            // Bloques de nichos (Sobre Bloque)
            if (descripcion.Contains("SOBRE BLOQUE B"))
                return "B";
            else if (descripcion.Contains("SOBRE BLOQUE C"))
                return "C";
            else if (descripcion.Contains("SOBRE BLOQUE D"))
                return "D";
            else if (descripcion.Contains("SOBRE BLOQUE E"))
                return "E";
            else if (descripcion.Contains("SOBRE BLOQUE F"))
                return "F";
            else if (descripcion.Contains("MANO DERECHA DEL CRISTO"))
                return "CRISTO_DERECHA";
            else if (descripcion.Contains("MANO IZQUIERDA DEL CRISTO"))
                return "CRISTO_IZQUIERDA";

            // Bloques de bóvedas (Bloque simple)
            else if (descripcion.Contains("BLOQUE A"))
                return "A";
            else if (descripcion.Contains("BLOQUE B"))
                return "B";
            else if (descripcion.Contains("BLOQUE C"))
                return "C";
            else if (descripcion.Contains("BLOQUE D"))
                return "D";
            else if (descripcion.Contains("BLOQUE E"))
                return "E";
            else if (descripcion.Contains("BLOQUE F"))
                return "F";

            // Bloques numerados
            else if (descripcion.Contains("BLOQUE 1"))
                return "1";
            else if (descripcion.Contains("BLOQUE 2"))
                return "2";
            else if (descripcion.Contains("BLOQUE 3"))
                return "3";
            else if (descripcion.Contains("BLOQUE 4"))
                return "4";
            else if (descripcion.Contains("BLOQUE 5"))
                return "5";
            else if (descripcion.Contains("BLOQUE 6"))
                return "6";
            else if (descripcion.Contains("BLOQUE 7"))
                return "7";
            else if (descripcion.Contains("BLOQUE 8"))
                return "8";
            else if (descripcion.Contains("BLOQUE 9"))
                return "9";
            else if (descripcion.Contains("BLOQUE 10"))
                return "10";
            else if (descripcion.Contains("BLOQUE 11"))
                return "11";
            else if (descripcion.Contains("BLOQUE 12"))
                return "12";
            else if (descripcion.Contains("BLOQUE 13"))
                return "13";
            else if (descripcion.Contains("BLOQUE 14"))
                return "14";
            else if (descripcion.Contains("BLOQUE 15"))
                return "15";
            else if (descripcion.Contains("BLOQUE 16"))
                return "16";

            return "DESCONOCIDO";
        }

        private async Task CrearBovedasAutomaticamente(Piso piso, ApplicationUser usuario, CatastroMigrationResult resultado)
        {
            // Crear 100 bóvedas automáticamente para cada piso
            const int totalBovedas = 100;
            
            for (int numeroBoveda = 1; numeroBoveda <= totalBovedas; numeroBoveda++)
            {
                // Verificar si la bóveda ya existe
                var bovedaExistente = await _context.Boveda
                    .FirstOrDefaultAsync(b => b.Numero == numeroBoveda && b.PisoId == piso.Id);

                if (bovedaExistente == null)
                {
                    var boveda = new Boveda
                    {
                        Numero = numeroBoveda,
                        NumeroSecuencial = $"{numeroBoveda:000}",
                        Estado = true,
                        FechaCreacion = DateTime.Now,
                        FechaActualizacion = DateTime.Now,
                        UsuarioCreadorId = usuario.Id,
                        PisoId = piso.Id
                    };

                    _context.Boveda.Add(boveda);
                    resultado.BovedasCreadas++;
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation($"✅ Creadas {totalBovedas} bóvedas automáticamente para el piso {piso.NumeroPiso}");
        }
    }

    // Clases de soporte
    public class CatastroMigrationResult
    {
        public bool EsExitoso { get; set; }
        public List<string> Mensajes { get; set; } = new List<string>();
        public List<string> Errores { get; set; } = new List<string>();
        public int BloquesCreados { get; set; }
        public int PisosCreados { get; set; }
        public int BovedasCreadas { get; set; }
        public int PersonasCreadas { get; set; }
        public int DifuntosCreados { get; set; }
        public int ContratosCreados { get; set; }
        public int RegistrosProcesados { get; set; }
    }

    public class SeccionCatastro
    {
        public string Nombre { get; set; } = "";
        public int FilaInicio { get; set; }
        public int FilaFin { get; set; }
        public string TipoBloque { get; set; } = "";
        public int BloqueId { get; set; }
        public int PisoId { get; set; }
    }

    public class RegistroCatastro
    {
        public int? Numero { get; set; }
        public string? NombreDifunto { get; set; }
        public DateTime? FechaContrato { get; set; }
        public DateTime? FechaVencimiento { get; set; }
        public bool EsPropio { get; set; }
        public bool EsArrendado { get; set; }
        public string? ReutilizacionArriendo { get; set; }
        public string? Representante { get; set; }
        public string? Contacto { get; set; }
        public string? CorreoElectronico { get; set; }
        public string? Observaciones { get; set; }
    }
}