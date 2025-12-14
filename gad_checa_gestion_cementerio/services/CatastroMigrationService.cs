using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Areas.Identity.Data;
using Microsoft.AspNetCore.Identity;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace gad_checa_gestion_cementerio.Services
{
    public class CatastroMigrationService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<CatastroMigrationService> _logger;

        private int _contadorContratos;
        private readonly Dictionary<string, int> _contadorBovedaPorBloque = new();

        private const int MAX_BOVEDAS_LOGICAS = 1000;

        public CatastroMigrationService(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<CatastroMigrationService> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        // ==========================================================
        // 🔥 MÉTODO PRINCIPAL
        // ==========================================================
        public async Task<CatastroMigrationResult> MigrarCatastroDesdeExcel(string rutaArchivo)
        {
            var result = new CatastroMigrationResult();
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            var usuario = await ObtenerUsuarioMigracion();
            var cementerio = await CrearOValidarCementerio(usuario);

            var ultimoContrato = await _context.Contrato.OrderByDescending(x => x.Id).FirstOrDefaultAsync();
            _contadorContratos = ultimoContrato?.Id ?? 0;

            using var package = new ExcelPackage(new FileInfo(rutaArchivo));

            foreach (var ws in package.Workbook.Worksheets)
            {
                if (ws.Dimension == null) continue;

                for (int row = 2; row <= ws.Dimension.Rows; row++)
                {
                    try
                    {
                        // COLUMNAS DEL NUEVO FORMATO:
                        // 1: Numero (número de bóveda/nicho)
                        // 2: Nombre (nombre del difunto)
                        // 3: Fecha Contrato (también se usa como Fecha Fallecimiento)
                        // 4: Fecha vencimiento
                        // 5: Propietario (X = es propietario)
                        // 6: Arrendado (X = está arrendado)
                        // 7: Reutilización arriendo (X = sí)
                        // 8: Representante (nombre del responsable/representante)
                        // 9: Contacto (teléfono del representante)
                        // 10: Email
                        // 11: Piso Numero
                        // 12: Bloque (nombre del bloque)
                        // 13: Numero Compartido
                        // 14: BLOQUE LOGICO (0 = no lógico, 1 = lógico)
                        // 15: Observaciones
                        // 16: Tipo (NICHOS, BOVEDAS, etc.)

                        // VALIDAR QUE EXISTA NÚMERO EN COLUMNA 1 (OBLIGATORIO para crear bóveda)
                        var numeroOTexto = ws.Cells[row, 1].Text?.Trim();
                        if (string.IsNullOrWhiteSpace(numeroOTexto)) continue;

                        result.RegistrosProcesados++;

                        string? nombreDifunto = ws.Cells[row, 2].Text?.Trim();
                        bool tieneDifunto = !string.IsNullOrWhiteSpace(nombreDifunto) && 
                                           !EsTextoVacio(nombreDifunto);

                        // Columna 1: Número de bóveda/nicho
                        int.TryParse(ws.Cells[row, 1].Text, out int numeroBoveda);
                        
                        // Columna 3: Fecha de contrato
                        string fechaContratoStr = ws.Cells[row, 3].Text?.Trim() ?? "";
                        
                        // Columna 4: Fecha de vencimiento
                        string fechaVencimientoStr = ws.Cells[row, 4].Text?.Trim() ?? "";
                        
                        // Columna 5: Es propietario (X = sí)
                        bool esPropietario = ws.Cells[row, 5].Text?.Trim().ToUpper() == "X";
                        
                        // Columna 6: Está arrendado (X = sí)
                        bool esArrendado = ws.Cells[row, 6].Text?.Trim().ToUpper() == "X";
                        
                        // Columna 7: Reutilización arriendo (X = sí)
                        bool esReutilizacion = ws.Cells[row, 7].Text?.Trim().ToUpper() == "X";
                        
                        // Columna 8: Representante (nombre)
                        string? representante = ws.Cells[row, 8].Text?.Trim();
                        
                        // Columna 9: Contacto (teléfono del representante)
                        string? telefonoRepresentante = ws.Cells[row, 9].Text?.Trim();
                        
                        // Columna 10: Email
                        string? email = ws.Cells[row, 10].Text?.Trim();
                        
                        // Columna 11: Piso Numero
                        int.TryParse(ws.Cells[row, 11].Text, out int pisoNumero);
                        if (pisoNumero == 0) pisoNumero = 1;
                        
                        // Columna 12: Bloque (nombre del bloque)
                        string? bloqueNombre = ws.Cells[row, 12].Text?.Trim();
                        
                        // Columna 13: Número compartido
                        int.TryParse(ws.Cells[row, 13].Text, out int numeroCompartido);
                        
                        // Columna 14: BLOQUE LOGICO (0 = no lógico, 1 = lógico)
                        int.TryParse(ws.Cells[row, 14].Text, out int bloqueLogicoNum);
                        
                        // Para BLOQUE TUMULOS: ignorar Numero Compartido y Bloque Lógico
                        bool esTumulos = bloqueNombre?.ToUpper().Contains("TUMULOS") == true;
                        bool esLogico = !esTumulos && (bloqueLogicoNum == 1 || string.IsNullOrWhiteSpace(bloqueNombre));
                        
                        // Columna 15: Observaciones
                        string? observaciones = ws.Cells[row, 15].Text?.Trim();
                        
                        // Columna 16: Tipo (NICHOS, BOVEDAS, etc.)
                        string? tipoTexto = ws.Cells[row, 16].Text?.Trim().ToUpper();
                        string tipo = tipoTexto?.Contains("NICHO") == true ? "Nichos" : "Bovedas";
                        
                        // Usar Fecha Contrato (columna 3) como Fecha Fallecimiento
                        DateTime? fechaFallecimiento = DateTime.TryParse(fechaContratoStr, out var fFallec) ? fFallec : null;

                        // Paso 1: Crear Bloque (y guardar inmediatamente)
                        var bloque = await ObtenerOCrearBloque(
                            cementerio,
                            esLogico ? $"Lógico {tipo}" : bloqueNombre,
                            tipo,
                            esLogico,
                            usuario,
                            result
                        );

                        // Paso 2: Crear Piso (y guardar inmediatamente) - usar piso del Excel
                        var piso = await ObtenerOCrearPiso(bloque, pisoNumero, cementerio, result);

                        if (esLogico)
                        {
                            int totalLogico = await _context.Boveda.CountAsync(b => b.PisoId == piso.Id);
                            if (totalLogico >= MAX_BOVEDAS_LOGICAS)
                                throw new Exception("Bloque lógico excede límite");
                        }

                        // Para BLOQUE TUMULOS: usar ID secuencial comenzando desde 1
                        int numeroBovedaFinal = numeroBoveda;
                        if (esTumulos)
                        {
                            string keyBloquePiso = $"{bloque.Id}_{piso.Id}";
                            if (!_contadorBovedaPorBloque.ContainsKey(keyBloquePiso))
                            {
                                // Obtener el máximo número de bóveda existente para este bloque/piso
                                var maxExistente = await _context.Boveda
                                    .Where(b => b.PisoId == piso.Id)
                                    .MaxAsync(b => (int?)b.Numero) ?? 0;
                                _contadorBovedaPorBloque[keyBloquePiso] = maxExistente;
                            }
                            _contadorBovedaPorBloque[keyBloquePiso]++;
                            numeroBovedaFinal = _contadorBovedaPorBloque[keyBloquePiso];
                        }

                        // Paso 3: Crear Bóveda (SIEMPRE, independientemente de los demás datos)
                        var boveda = await ObtenerOCrearBoveda(piso, numeroBovedaFinal, usuario, result);

                        // Solo si tiene difunto: crear difunto, contrato, cuotas, pagos
                        if (tieneDifunto)
                        {
                            // Paso 4: Crear Difunto
                            var difunto = await ObtenerOCrearDifunto(nombreDifunto!, fechaFallecimiento, usuario, result);

                            // Parsear fechas de contrato
                            DateTime fechaInicio = DateTime.TryParse(fechaContratoStr, out var fInicio) ? fInicio : DateTime.Today;
                            DateTime fechaFin;
                            
                            if (DateTime.TryParse(fechaVencimientoStr, out var fFin))
                            {
                                fechaFin = fFin;
                            }
                            else
                            {
                                int anios = tipo == "Nichos" ? cementerio.AniosArriendoNicho : cementerio.AniosArriendoBovedas;
                                fechaFin = fechaInicio.AddYears(anios);
                            }

                            // Preparar observaciones del contrato
                            var obsContrato = new List<string>();
                            obsContrato.Add("Migrado desde catastro Excel");
                            if (esPropietario) obsContrato.Add("PROPIETARIO");
                            if (esArrendado) obsContrato.Add("ARRENDADO");
                            if (esReutilizacion) obsContrato.Add("REUTILIZACIÓN ARRIENDO");
                            if (!string.IsNullOrWhiteSpace(observaciones)) obsContrato.Add(observaciones);

                            // 🔑 MARCAR BÓVEDA COMO OCUPADA (Estado = false)
                            boveda.Estado = false;
                            boveda.FechaActualizacion = DateTime.Now;
                            _context.Boveda.Update(boveda);

                            // Paso 5 y 6: Crear Propietario O Responsable (no ambos)
                            // Si es propietario, usar Propietario como rol principal
                            Propietario? propietario = null;
                            Responsable? responsable = null;
                            
                            if (esPropietario && !string.IsNullOrWhiteSpace(representante))
                            {
                                // Crear solo Propietario (rol principal)
                                propietario = await ObtenerOCrearPropietarioDirecto(
                                    representante,
                                    telefonoRepresentante,
                                    email,
                                    usuario,
                                    result
                                );
                                if (propietario != null)
                                {
                                    boveda.PropietarioId = propietario.Id;
                                }
                            }
                            else if (!string.IsNullOrWhiteSpace(representante))
                            {
                                // Crear solo Responsable (no es propietario)
                                responsable = await ObtenerOCrearResponsable(
                                    representante,
                                    telefonoRepresentante,
                                    email,
                                    null!, // Se asignará después
                                    usuario,
                                    result
                                );
                            }

                            // Paso 7: Crear Contrato
                            var contrato = await CrearContrato(
                                boveda, difunto, fechaInicio, fechaFin,
                                string.Join(" | ", obsContrato),
                                usuario, result
                            );

                            if (contrato != null)
                            {
                                // Asignar responsable al contrato (solo si no es propietario)
                                if (responsable != null)
                                {
                                    responsable.FechaInicio = contrato.FechaInicio;
                                    responsable.FechaFin = contrato.FechaFin;
                                    if (!contrato.Responsables.Any(r => r.Id == responsable.Id))
                                    {
                                        contrato.Responsables.Add(responsable);
                                    }
                                }

                                // Paso 8: Generar cuotas y pagos
                                var cuotas = GenerarCuotasParaContrato(contrato, cementerio, tipo);
                                _context.Cuota.AddRange(cuotas);

                                // Obtener persona para pagos (del propietario o responsable)
                                Persona? personaPago = null;
                                if (propietario != null)
                                {
                                    // Crear persona desde propietario para los pagos
                                    personaPago = await ObtenerOCrearPersonaDesdePropietario(propietario, usuario, result);
                                }
                                else if (responsable != null)
                                {
                                    // Crear persona desde responsable para los pagos
                                    personaPago = await ObtenerOCrearPersonaDesdeResponsable(responsable, usuario, result);
                                }

                                if (personaPago != null)
                                {
                                    var pagos = GenerarPagosIniciales(cuotas, personaPago.Id);
                                    _context.Pago.AddRange(pagos);
                                }
                            }

                            await _context.SaveChangesAsync();
                            _logger.LogInformation($"✅ Fila {row}: Bóveda #{boveda.Numero} OCUPADA con {difunto.Nombres} {difunto.Apellidos}");
                        }
                        else
                        {
                            // Bóveda sin difunto = VACÍA (Estado = true, ya viene así por defecto)
                            _logger.LogInformation($"⚪ Fila {row}: Bóveda #{boveda.Numero} VACÍA (sin difunto)");
                        }
                    }
                    catch (Exception ex)
                    {
                        // Obtener mensaje detallado incluyendo inner exceptions
                        string errorMsg = ex.Message;
                        var inner = ex.InnerException;
                        while (inner != null)
                        {
                            errorMsg += $" | Inner: {inner.Message}";
                            inner = inner.InnerException;
                        }
                        
                        result.Errores.Add($"Fila {row}: {errorMsg}");
                        _logger.LogError(ex, $"Error fila {row}: {errorMsg}");
                        
                        // Limpiar el contexto para evitar que errores anteriores afecten las siguientes filas
                        foreach (var entry in _context.ChangeTracker.Entries().ToList())
                        {
                            entry.State = EntityState.Detached;
                        }
                    }
                }
            }

            // FASE FINAL: Relacionar contratos consecutivos con mismo número de bóveda
            _logger.LogInformation("⏳ FASE FINAL: Relacionando contratos consecutivos...");
            await RelacionarContratosConsecutivos(result);

            result.EsExitoso = result.Errores.Count == 0;
            return result;
        }

        // ==========================================================
        // 🔹 NORMALIZACIÓN FUERTE
        // ==========================================================
        private string Normalizar(string texto)
        {
            texto = texto?.Trim().ToLowerInvariant() ?? "";
            var normalized = texto.Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();

            foreach (var c in normalized)
                if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                    sb.Append(c);

            return Regex.Replace(sb.ToString(), @"\s+", " ");
        }

        private static bool EsTextoVacio(string text) => 
            text.Trim().ToLowerInvariant() is "vacío" or "vacio" or "empty" or "-" or "n/a";

        // ==========================================================
        // 🔹 BLOQUES / PISOS / BÓVEDAS
        // ==========================================================
        private async Task<Bloque> ObtenerOCrearBloque(
            Cementerio cementerio, string nombre, string tipo, bool logico,
            ApplicationUser usuario, CatastroMigrationResult r)
        {
            string desc = string.IsNullOrWhiteSpace(nombre) ? $"Lógico {tipo}" : nombre.Trim();
            string descNorm = Normalizar(desc);

            // Buscar en BD
            var bloques = await _context.Bloque.Where(x => x.CementerioId == cementerio.Id && x.Estado).ToListAsync();
            var b = bloques.FirstOrDefault(x => Normalizar(x.Descripcion) == descNorm);

            if (b == null)
            {
                b = new Bloque
                {
                    Descripcion = desc,
                    Tipo = tipo,
                    Estado = true,
                    CalleA = logico ? "Virtual" : "Principal",
                    CalleB = logico ? "Virtual" : "Secundaria",
                    NumeroDePisos = 1,
                    BovedasPorPiso = 100,
                    TarifaBase = tipo == "Nichos" 
                        ? cementerio.tarifa_arriendo_nicho ?? 30.00m 
                        : cementerio.tarifa_arriendo ?? 50.00m,
                    CementerioId = cementerio.Id,
                    FechaCreacion = DateTime.Now,
                    FechaActualizacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id
                };
                _context.Bloque.Add(b);
                await _context.SaveChangesAsync();
                r.BloquesCreados++;
                _logger.LogInformation($"✅ Bloque '{desc}' creado (ID: {b.Id})");
            }
            else
            {
                _logger.LogInformation($"🔄 Bloque existente: '{desc}' (ID: {b.Id})");
            }

            return b;
        }

        private async Task<Piso> ObtenerOCrearPiso(Bloque bloque, int numero, Cementerio c, CatastroMigrationResult r)
        {
            var p = await _context.Piso.FirstOrDefaultAsync(x => x.BloqueId == bloque.Id && x.NumeroPiso == numero);
            if (p == null)
            {
                p = new Piso
                {
                    BloqueId = bloque.Id,
                    NumeroPiso = numero,
                    Precio = bloque.Tipo == "Nichos"
                        ? c.tarifa_arriendo_nicho ?? 30.00m
                        : c.tarifa_arriendo ?? 50.00m
                };
                _context.Piso.Add(p);
                await _context.SaveChangesAsync();
                r.PisosCreados++;
                _logger.LogInformation($"✅ Piso {numero} creado en bloque '{bloque.Descripcion}' (ID: {p.Id})");
            }

            return p;
        }

        private async Task<Boveda> ObtenerOCrearBoveda(Piso piso, int numero, ApplicationUser u, CatastroMigrationResult r)
        {
            var b = await _context.Boveda.FirstOrDefaultAsync(x => x.PisoId == piso.Id && x.Numero == numero);
            if (b == null)
            {
                b = new Boveda
                {
                    PisoId = piso.Id,
                    Numero = numero,
                    NumeroSecuencial = $"{numero:000}",
                    Estado = true,
                    FechaCreacion = DateTime.Now,
                    FechaActualizacion = DateTime.Now,
                    UsuarioCreadorId = u.Id
                };
                _context.Boveda.Add(b);
                await _context.SaveChangesAsync();
                r.BovedasCreadas++;
                _logger.LogInformation($"✅ Bóveda {numero} creada en piso {piso.NumeroPiso} (ID: {b.Id})");
            }

            return b;
        }

        // ==========================================================
        // 🔹 DIFUNTO / CONTRATO
        // ==========================================================
        private async Task<Difunto> ObtenerOCrearDifunto(string nombre, DateTime? fechaFallecimiento, ApplicationUser u, CatastroMigrationResult r)
        {
            // Parsear nombre completo en nombres y apellidos
            var (nombres, apellidos) = ParsearNombreCompleto(nombre);

            // Buscar en BD por nombres y apellidos exactos
            var d = await _context.Difunto
                .FirstOrDefaultAsync(x => x.Estado && x.Nombres == nombres && x.Apellidos == apellidos);

            if (d == null)
            {
                // Obtener descuento por defecto
                var descuento = await ObtenerDescuentoDefault(u);

                d = new Difunto
                {
                    Nombres = nombres,
                    Apellidos = apellidos,
                    NumeroIdentificacion = "0000000000",
                    FechaFallecimiento = fechaFallecimiento,
                    Estado = true,
                    UsuarioCreadorId = u.Id,
                    FechaCreacion = DateTime.Now,
                    FechaActualizacion = DateTime.Now,
                    DescuentoId = descuento.Id
                };
                _context.Difunto.Add(d);
                await _context.SaveChangesAsync();
                r.DifuntosCreados++;
                _logger.LogInformation($"✅ Difunto '{nombre}' creado (ID: {d.Id})");
            }
            else
            {
                _logger.LogInformation($"🔄 Difunto existente: '{nombre}' (ID: {d.Id})");
            }

            return d;
        }

        private (string nombres, string apellidos) ParsearNombreCompleto(string nombreCompleto)
        {
            if (string.IsNullOrWhiteSpace(nombreCompleto))
                return ("Desconocido", "Desconocido");

            var partes = nombreCompleto.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);

            if (partes.Length == 1)
                return (partes[0], "Sin Apellido");
            else if (partes.Length == 2)
                return (partes[0], partes[1]);
            else
            {
                int mitad = partes.Length / 2;
                string nombres = string.Join(" ", partes.Take(mitad));
                string apellidos = string.Join(" ", partes.Skip(mitad));
                return (nombres, apellidos);
            }
        }

        private async Task<Descuento> ObtenerDescuentoDefault(ApplicationUser usuario)
        {
            var descuento = await _context.Descuento.FirstOrDefaultAsync(d => d.Descripcion == "Sin Descuento" && d.Estado);

            if (descuento == null)
            {
                descuento = new Descuento
                {
                    Descripcion = "Sin Descuento",
                    Porcentaje = 0,
                    Estado = true,
                    FechaCreacion = DateTime.Now,
                    FechaActualizacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id
                };

                _context.Descuento.Add(descuento);
                await _context.SaveChangesAsync();
                _logger.LogInformation("✅ Descuento 'Sin Descuento' creado");
            }

            return descuento;
        }

        private async Task<Contrato?> CrearContrato(
            Boveda b, Difunto d, DateTime fi, DateTime ff,
            string observaciones,
            ApplicationUser u, CatastroMigrationResult r)
        {
            // Verificar si ya existe contrato para este difunto (hay índice único en DifuntoId)
            var existente = await _context.Contrato
                .Include(c => c.Responsables)
                .FirstOrDefaultAsync(x => x.DifuntoId == d.Id && x.Estado);
            
            if (existente != null)
            {
                _logger.LogInformation($"🔄 Contrato existente para difunto {d.Id} (Bóveda: {existente.BovedaId})");
                return existente;
            }

            _contadorContratos++;

            var contrato = new Contrato
            {
                BovedaId = b.Id,
                DifuntoId = d.Id,
                FechaInicio = fi,
                FechaFin = ff,
                NumeroDeMeses = CalcularAnios(fi,ff),
                MontoTotal = 0,
                Estado = true,
                Observaciones = observaciones ?? "Migrado desde catastro Excel",
                NumeroSecuencial = $"MIG-{_contadorContratos:00000}",
                EsRenovacion = false,
                VecesRenovado = 0,
                FechaCreacion = DateTime.Now,
                FechaActualizacion = DateTime.Now,
                UsuarioCreadorId = u.Id,
                Responsables = new List<Responsable>()
            };

            _context.Contrato.Add(contrato);
            await _context.SaveChangesAsync();
            r.ContratosCreados++;
            _logger.LogInformation($"✅ Contrato '{contrato.NumeroSecuencial}' creado");
            return contrato;
        }

        private async Task<Responsable?> ObtenerOCrearResponsable(
            string nombreCompleto, string? telefono, string? email, Contrato? contrato,
            ApplicationUser usuario, CatastroMigrationResult result)
        {
            if (string.IsNullOrWhiteSpace(nombreCompleto))
                return null;

            var (nombres, apellidos) = ParsearNombreCompleto(nombreCompleto);
            
            // Normalizar para búsqueda
            var nombresNorm = Normalizar(nombres);
            var apellidosNorm = Normalizar(apellidos);
            var nombreCompletoNorm = Normalizar(nombreCompleto);

            // 1. Buscar si ya existe como Responsable
            var responsables = await _context.Responsable.Where(r => r.Estado).ToListAsync();
            var existente = responsables.FirstOrDefault(r => 
                Normalizar(r.Nombres) == nombresNorm && Normalizar(r.Apellidos) == apellidosNorm);
            
            if (existente == null)
            {
                existente = responsables.FirstOrDefault(r => 
                    Normalizar($"{r.Nombres} {r.Apellidos}") == nombreCompletoNorm);
            }

            if (existente != null)
            {
                _logger.LogInformation($"🔄 Responsable existente: {nombreCompleto}");
                return existente;
            }

            // 2. Verificar si ya existe como Propietario (no crear Responsable si ya es Propietario)
            var propietarios = await _context.Propietario.Where(p => p.Estado).ToListAsync();
            var propietarioExistente = propietarios.FirstOrDefault(p => 
                Normalizar(p.Nombres) == nombresNorm && Normalizar(p.Apellidos) == apellidosNorm);
            
            if (propietarioExistente == null)
            {
                propietarioExistente = propietarios.FirstOrDefault(p => 
                    Normalizar($"{p.Nombres} {p.Apellidos}") == nombreCompletoNorm);
            }

            // Si existe como Propietario, NO crear Responsable duplicado - retornar null
            if (propietarioExistente != null)
            {
                _logger.LogInformation($"⏭️ Saltando creación de Responsable, ya existe como Propietario: {nombreCompleto}");
                return null;
            }

            // 3. Crear nuevo Responsable
            // Limpiar teléfono: tomar solo el primer número y truncar a 20 caracteres
            string telefonoLimpio = "N/A";
            if (!string.IsNullOrWhiteSpace(telefono))
            {
                telefonoLimpio = telefono.Split(new[] { '/', ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
                    .FirstOrDefault()?.Trim() ?? "N/A";
                if (telefonoLimpio.Length > 20)
                    telefonoLimpio = telefonoLimpio.Substring(0, 20);
            }

            // Validar y limpiar email
            string emailLimpio = "migrado@sistema.com";
            if (!string.IsNullOrWhiteSpace(email))
            {
                var emailTrimmed = email.Trim();
                if (emailTrimmed.Contains("@") && emailTrimmed.Contains("."))
                {
                    emailLimpio = emailTrimmed.Length > 100 ? emailTrimmed.Substring(0, 100) : emailTrimmed;
                }
            }

            var responsable = new Responsable
            {
                Nombres = nombres,
                Apellidos = apellidos,
                TipoIdentificacion = "CEDULA",
                NumeroIdentificacion = "MIGRADO-" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper(),
                Telefono = telefonoLimpio,
                Direccion = "Migrado desde Excel",
                Email = emailLimpio,
                Estado = true,
                FechaCreacion = DateTime.Now,
                UsuarioCreadorId = usuario.Id,
                FechaInicio = contrato?.FechaInicio ?? DateTime.Today,
                FechaFin = contrato?.FechaFin ?? DateTime.Today.AddYears(5)
            };

            _context.Responsable.Add(responsable);
            await _context.SaveChangesAsync();
            result.ResponsablesCreados++;
            _logger.LogInformation($"✅ Responsable creado: {nombres} {apellidos}");

            return responsable;
        }

        // ==========================================================
        // 🔹 PROPIETARIOS
        // ==========================================================
        private async Task<Propietario?> ObtenerOCrearPropietario(
            Responsable responsable, ApplicationUser usuario, CatastroMigrationResult result)
        {
            // Normalizar para búsqueda
            var nombresNorm = Normalizar(responsable.Nombres);
            var apellidosNorm = Normalizar(responsable.Apellidos);
            var nombreCompletoNorm = Normalizar($"{responsable.Nombres} {responsable.Apellidos}");

            // Buscar en BD por nombres normalizados
            var propietarios = await _context.Propietario.Where(p => p.Estado).ToListAsync();
            var existente = propietarios.FirstOrDefault(p => 
                Normalizar(p.Nombres) == nombresNorm && Normalizar(p.Apellidos) == apellidosNorm);
            
            // Si no encuentra, buscar por nombre completo normalizado
            if (existente == null)
            {
                existente = propietarios.FirstOrDefault(p => 
                    Normalizar($"{p.Nombres} {p.Apellidos}") == nombreCompletoNorm);
            }

            if (existente != null)
            {
                _logger.LogInformation($"♻️ Propietario existente: {responsable.Nombres} {responsable.Apellidos}");
                return existente;
            }

            var propietario = new Propietario
            {
                Nombres = responsable.Nombres,
                Apellidos = responsable.Apellidos,
                TipoIdentificacion = responsable.TipoIdentificacion,
                NumeroIdentificacion = responsable.NumeroIdentificacion,
                Telefono = responsable.Telefono,
                Email = responsable.Email,
                Direccion = responsable.Direccion,
                Estado = true,
                FechaCreacion = DateTime.Now,
                UsuarioCreadorId = usuario.Id,
                Catastro = "MIGRADO"
            };

            _context.Propietario.Add(propietario);
            await _context.SaveChangesAsync();
            result.PersonasCreadas++;
            _logger.LogInformation($"✅ Propietario creado: {responsable.Nombres} {responsable.Apellidos}");
            return propietario;
        }

        /// <summary>
        /// Crea un propietario directamente desde los datos del Excel (sin pasar por Responsable)
        /// </summary>
        private async Task<Propietario?> ObtenerOCrearPropietarioDirecto(
            string nombreCompleto, string? telefono, string? email,
            ApplicationUser usuario, CatastroMigrationResult result)
        {
            if (string.IsNullOrWhiteSpace(nombreCompleto))
                return null;

            var (nombres, apellidos) = ParsearNombreCompleto(nombreCompleto);
            
            // Normalizar para búsqueda
            var nombresNorm = Normalizar(nombres);
            var apellidosNorm = Normalizar(apellidos);
            var nombreCompletoNorm = Normalizar(nombreCompleto);

            // 1. Buscar si ya existe como Propietario
            var propietarios = await _context.Propietario.Where(p => p.Estado).ToListAsync();
            var existente = propietarios.FirstOrDefault(p => 
                Normalizar(p.Nombres) == nombresNorm && Normalizar(p.Apellidos) == apellidosNorm);
            
            if (existente == null)
            {
                existente = propietarios.FirstOrDefault(p => 
                    Normalizar($"{p.Nombres} {p.Apellidos}") == nombreCompletoNorm);
            }

            if (existente != null)
            {
                _logger.LogInformation($"♻️ Propietario existente: {nombreCompleto}");
                return existente;
            }

            // 2. Buscar si ya existe como Responsable (para promover a Propietario)
            var responsables = await _context.Responsable.Where(r => r.Estado).ToListAsync();
            var responsableExistente = responsables.FirstOrDefault(r => 
                Normalizar(r.Nombres) == nombresNorm && Normalizar(r.Apellidos) == apellidosNorm);
            
            if (responsableExistente == null)
            {
                responsableExistente = responsables.FirstOrDefault(r => 
                    Normalizar($"{r.Nombres} {r.Apellidos}") == nombreCompletoNorm);
            }

            // Si existe como Responsable, promover a Propietario usando sus datos
            if (responsableExistente != null)
            {
                _logger.LogInformation($"⬆️ Promoviendo Responsable a Propietario: {nombreCompleto}");
                
                var propietarioDesdeResponsable = new Propietario
                {
                    Nombres = responsableExistente.Nombres,
                    Apellidos = responsableExistente.Apellidos,
                    TipoIdentificacion = responsableExistente.TipoIdentificacion,
                    NumeroIdentificacion = responsableExistente.NumeroIdentificacion,
                    Telefono = responsableExistente.Telefono,
                    Email = responsableExistente.Email,
                    Direccion = responsableExistente.Direccion,
                    Estado = true,
                    FechaCreacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id,
                    Catastro = "MIGRADO"
                };

                _context.Propietario.Add(propietarioDesdeResponsable);
                await _context.SaveChangesAsync();
                result.PersonasCreadas++;
                _logger.LogInformation($"✅ Propietario creado (promovido desde Responsable): {nombres} {apellidos}");
                return propietarioDesdeResponsable;
            }

            // 3. Crear nuevo Propietario
            // Limpiar teléfono: tomar solo el primer número y truncar a 20 caracteres
            string telefonoLimpio = "N/A";
            if (!string.IsNullOrWhiteSpace(telefono))
            {
                telefonoLimpio = telefono.Split(new[] { '/', ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
                    .FirstOrDefault()?.Trim() ?? "N/A";
                if (telefonoLimpio.Length > 20)
                    telefonoLimpio = telefonoLimpio.Substring(0, 20);
            }

            // Validar y limpiar email
            string emailLimpio = "migrado@sistema.com";
            if (!string.IsNullOrWhiteSpace(email))
            {
                var emailTrimmed = email.Trim();
                if (emailTrimmed.Contains("@") && emailTrimmed.Contains("."))
                {
                    emailLimpio = emailTrimmed.Length > 100 ? emailTrimmed.Substring(0, 100) : emailTrimmed;
                }
            }

            var propietario = new Propietario
            {
                Nombres = nombres,
                Apellidos = apellidos,
                TipoIdentificacion = "CEDULA",
                NumeroIdentificacion = "MIGRADO-" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper(),
                Telefono = telefonoLimpio,
                Email = emailLimpio,
                Direccion = "Migrado desde Excel",
                Estado = true,
                FechaCreacion = DateTime.Now,
                UsuarioCreadorId = usuario.Id,
                Catastro = "MIGRADO"
            };

            _context.Propietario.Add(propietario);
            await _context.SaveChangesAsync();
            result.PersonasCreadas++;
            _logger.LogInformation($"✅ Propietario creado: {nombres} {apellidos}");
            return propietario;
        }

        // ==========================================================
        // 🔹 PERSONA DESDE RESPONSABLE (para pagos)
        // ==========================================================
        private async Task<Persona?> ObtenerOCrearPersonaDesdeResponsable(
            Responsable responsable, ApplicationUser usuario, CatastroMigrationResult result)
        {
            // Normalizar nombres para búsqueda
            var nombresNorm = Normalizar(responsable.Nombres);
            var apellidosNorm = Normalizar(responsable.Apellidos);
            var nombreCompletoNorm = Normalizar($"{responsable.Nombres} {responsable.Apellidos}");

            // Buscar en BD por nombres normalizados
            var personas = await _context.Persona.ToListAsync();
            var existente = personas.FirstOrDefault(p => 
                Normalizar(p.Nombres) == nombresNorm && Normalizar(p.Apellidos) == apellidosNorm);

            // Si no encuentra por nombres y apellidos, buscar por nombre completo
            if (existente == null)
            {
                existente = personas.FirstOrDefault(p => 
                    Normalizar($"{p.Nombres} {p.Apellidos}") == nombreCompletoNorm);
            }

            if (existente != null)
            {
                _logger.LogInformation($"♻️ Persona existente: {responsable.Nombres} {responsable.Apellidos}");
                return existente;
            }

            var persona = new Persona
            {
                Nombres = responsable.Nombres,
                Apellidos = responsable.Apellidos,
                TipoIdentificacion = responsable.TipoIdentificacion,
                NumeroIdentificacion = responsable.NumeroIdentificacion,
                Telefono = responsable.Telefono ?? "N/A",
                Email = responsable.Email ?? "migrado@sistema.com",
                Direccion = responsable.Direccion ?? "No especificada",
                Estado = true,
                FechaCreacion = DateTime.Now,
                UsuarioCreadorId = usuario.Id
            };

            _context.Persona.Add(persona);
            await _context.SaveChangesAsync();
            result.PersonasCreadas++;
            _logger.LogInformation($"✅ Persona creada: {persona.Nombres} {persona.Apellidos}");
            return persona;
        }

        private int CalcularAnios(DateTime? inicio, DateTime? fin)
        {
            if (!inicio.HasValue || !fin.HasValue) return 0;
            var meses = ((fin.Value.Year - inicio.Value.Year) * 12) + fin.Value.Month - inicio.Value.Month;
            return meses;
        }

        /// <summary>
        /// Crea una Persona desde un Propietario (para registrar pagos)
        /// </summary>
        private async Task<Persona?> ObtenerOCrearPersonaDesdePropietario(
            Propietario propietario, ApplicationUser usuario, CatastroMigrationResult result)
        {
            // Normalizar nombres para búsqueda
            var nombresNorm = Normalizar(propietario.Nombres);
            var apellidosNorm = Normalizar(propietario.Apellidos);
            var nombreCompletoNorm = Normalizar($"{propietario.Nombres} {propietario.Apellidos}");

            // Buscar en BD por nombres normalizados
            var personas = await _context.Persona.ToListAsync();
            var existente = personas.FirstOrDefault(p => 
                Normalizar(p.Nombres) == nombresNorm && Normalizar(p.Apellidos) == apellidosNorm);

            // Si no encuentra por nombres y apellidos, buscar por nombre completo
            if (existente == null)
            {
                existente = personas.FirstOrDefault(p => 
                    Normalizar($"{p.Nombres} {p.Apellidos}") == nombreCompletoNorm);
            }

            if (existente != null)
            {
                _logger.LogInformation($"♻️ Persona existente (desde propietario): {propietario.Nombres} {propietario.Apellidos}");
                return existente;
            }

            var persona = new Persona
            {
                Nombres = propietario.Nombres,
                Apellidos = propietario.Apellidos,
                TipoIdentificacion = propietario.TipoIdentificacion,
                NumeroIdentificacion = propietario.NumeroIdentificacion,
                Telefono = propietario.Telefono ?? "N/A",
                Email = propietario.Email ?? "migrado@sistema.com",
                Direccion = propietario.Direccion ?? "No especificada",
                Estado = true,
                FechaCreacion = DateTime.Now,
                UsuarioCreadorId = usuario.Id
            };

            _context.Persona.Add(persona);
            await _context.SaveChangesAsync();
            result.PersonasCreadas++;
            _logger.LogInformation($"✅ Persona creada (desde propietario): {persona.Nombres} {persona.Apellidos}");
            return persona;
        }

        // ==========================================================
        // 🔹 CUOTAS Y PAGOS
        // ==========================================================
        private List<Cuota> GenerarCuotasParaContrato(Contrato contrato, Cementerio cementerio, string tipoBloque = "Bovedas")
        {
            bool esNicho = tipoBloque == "Nichos";
            var cantidadCuotas = esNicho ? cementerio.AniosArriendoNicho : cementerio.AniosArriendoBovedas;
            if (cantidadCuotas <= 0) cantidadCuotas = 5; // Valor por defecto
            var tarifa = esNicho 
                ? (cementerio.tarifa_arriendo_nicho ?? 30.00m) 
                : (cementerio.tarifa_arriendo ?? 50.00m);
            var montoPorCuota = tarifa / cantidadCuotas;

            var cuotas = new List<Cuota>();
            for (int i = 1; i <= cantidadCuotas; i++)
            {
                cuotas.Add(new Cuota
                {
                    Contrato = contrato,
                    FechaVencimiento = contrato.FechaInicio.AddYears(i),
                    Monto = montoPorCuota,
                    Pagada = false
                });
            }

            _logger.LogInformation($"💰 Generadas {cuotas.Count} cuotas para contrato {contrato.NumeroSecuencial}");
            return cuotas;
        }

        private List<Pago> GenerarPagosIniciales(List<Cuota> cuotas, int personaId)
        {
            var pagos = new List<Pago>();
            if (!cuotas.Any()) return pagos;

            var montoTotal = cuotas.Sum(x => x.Monto);

            var pago = new Pago
            {
                FechaPago = DateTime.Now,
                TipoPago = "Efectivo",
                NumeroComprobante = "MIG-" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper(),
                Monto = montoTotal,
                PersonaPagoId = personaId,
                Cuotas = cuotas
            };

            foreach (var cuota in cuotas)
                cuota.Pagada = true;

            pagos.Add(pago);
            _logger.LogInformation($"✅ Pago inicial generado para persona {personaId}, monto: {montoTotal}");
            return pagos;
        }

        // ==========================================================
        // 🔹 RELACIONAR CONTRATOS CONSECUTIVOS
        // ==========================================================
        public async Task RelacionarContratosConsecutivos(CatastroMigrationResult result)
        {
            _logger.LogInformation("🔗 Iniciando relación de contratos consecutivos...");
            var relacionesCreadas = 0;

            // Obtener todos los contratos agrupados por bóveda
            var contratosPorBoveda = await _context.Contrato
                .Include(c => c.Difunto)
                .Include(c => c.Boveda)
                .Where(c => c.Estado)
                .GroupBy(c => c.BovedaId)
                .ToListAsync();

            foreach (var grupo in contratosPorBoveda)
            {
                var contratosOrdenados = grupo.OrderBy(c => c.FechaInicio).ToList();

                for (int i = 0; i < contratosOrdenados.Count - 1; i++)
                {
                    var contratoA = contratosOrdenados[i];
                    var contratoB = contratosOrdenados[i + 1];

                    // Si ya están relacionados, continuar
                    if (contratoA.ContratoRelacionadoId == contratoB.Id ||
                        contratoB.ContratoRelacionadoId == contratoA.Id)
                        continue;

                    // Relacionar contratos bidireccionales
                    contratoA.ContratoRelacionadoId = contratoB.Id;
                    contratoB.ContratoRelacionadoId = contratoA.Id;

                    _context.Contrato.Update(contratoA);
                    _context.Contrato.Update(contratoB);
                    relacionesCreadas++;

                    _logger.LogInformation($"🔗 Relacionados: Contrato {contratoA.Id} ⇆ {contratoB.Id} (Bóveda: {grupo.Key})");
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation($"✅ Total relaciones creadas: {relacionesCreadas}");
        }

        // ==========================================================
        // 🔹 INFRA
        // ==========================================================

        private async Task<ApplicationUser> ObtenerUsuarioMigracion()
        {
            var usuario = await _context.Users.FirstOrDefaultAsync(u => u.UserName == "migracion");
            if (usuario == null)
            {
                usuario = new ApplicationUser
                {
                    UserName = "migracion",
                    Email = "migracion@cementerio.com",
                    EmailConfirmed = true
                };
                _context.Users.Add(usuario);
                await _context.SaveChangesAsync();
                _logger.LogInformation("👤 Usuario de migración creado.");
            }
            else
            {
                _logger.LogInformation("♻️ Usuario de migración reutilizado.");
            }
            return usuario;
        }

        private async Task<Cementerio> CrearOValidarCementerio(ApplicationUser u)
        {
            var cementerio = await _context.Cementerio.FirstOrDefaultAsync();
            if (cementerio != null)
            {
                _logger.LogInformation("♻️ Cementerio reutilizado.");
                return cementerio;
            }

            cementerio = new Cementerio
            {
                Nombre = "Cementerio Municipal de Checa",
                Direccion = "Checa, Ecuador",
                Estado = true,
                FechaCreacion = DateTime.Now,
                FechaActualizacion = DateTime.Now,
                UsuarioCreadorId = u.Id,
                UsuarioActualizadorId = u.Id,
                tarifa_arriendo = 50.00m,
                tarifa_arriendo_nicho = 30.00m,
                AniosArriendoBovedas = 5,
                AniosArriendoNicho = 5,
                VecesRenovacionBovedas = 3,
                VecesRenovacionNicho = 5
            };
            _context.Cementerio.Add(cementerio);
            await _context.SaveChangesAsync();
            _logger.LogInformation("🏗️ Cementerio creado.");
            return cementerio;
        }
    }

    // ==========================================================
    // 🔹 MODELO DE REGISTRO CATASTRO
    // ==========================================================
    public class RegistroCatastro
    {
        public decimal? Numero { get; set; }
        public string? NombreDifunto { get; set; }
        public string? Tipo { get; set; }
        public string? Bloque { get; set; }
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

    // ==========================================================
    // 🔹 RESULTADO DE MIGRACIÓN
    // ==========================================================
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
        public int ResponsablesCreados { get; set; }
        public int RegistrosProcesados { get; set; }
        public Dictionary<string, int> FilasPorHoja { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, int> BovedasPorTipo { get; set; } = new Dictionary<string, int>();
    }
}
