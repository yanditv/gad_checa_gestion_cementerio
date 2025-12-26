using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Table;
using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Areas.Identity.Data;
using System.Globalization;
using Microsoft.AspNetCore.Identity;
using gad_checa_gestion_cementerio.services;

namespace gad_checa_gestion_cementerio.services
{
    public class CatastroMigrationService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<CatastroMigrationService> _logger;
        private readonly ContratoService _contratoService;

        public CatastroMigrationService(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger<CatastroMigrationService> logger,
            ContratoService contratoService)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
            _contratoService = contratoService;
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        }

        public async Task<CatastroMigrationResult> MigrarCatastroDesdeExcel(string rutaArchivo)
        {
            var resultado = new CatastroMigrationResult();
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            using var package = new ExcelPackage(new FileInfo(rutaArchivo));
            _logger.LogInformation($"🚀 Iniciando migración completa (Lógica de Hierro) desde: {rutaArchivo}");

            var usuarioMigracion = await ObtenerUsuarioMigracion();
            var cementerio = await CrearOValidarCementerio(usuarioMigracion);

            string[] tablasObjetivo = { "TablaNichos", "TablaTumulos", "TablaBovedas" };

            // FASE 1: Extraer Difuntos (Pre-carga)
            foreach (var worksheet in package.Workbook.Worksheets)
            {
                foreach (var table in worksheet.Tables.Where(t => tablasObjetivo.Contains(t.Name)))
                {
                    await CrearDifuntosDesdeTabla(table, usuarioMigracion, resultado);
                }
            }

            // FASE 2: Procesar Registros, Bóvedas, Contratos y RELACIONES LÓGICAS
            foreach (var worksheet in package.Workbook.Worksheets)
            {
                foreach (var table in worksheet.Tables.Where(t => tablasObjetivo.Contains(t.Name)))
                {
                    // Este método ahora hace la relación en tiempo real
                    await ProcesarTablaEstandar(table, cementerio, usuarioMigracion, resultado);
                }
            }

            resultado.BovedasPorTipo = await ObtenerContadorBovedasPorTipo();
            GenerarReporteFinal(resultado, resultado.BovedasPorTipo);

            resultado.EsExitoso = true;
            return resultado;
        }

        private async Task ProcesarTablaEstandar(ExcelTable table, Cementerio cementerio, ApplicationUser usuario, CatastroMigrationResult resultado)
        {
            var ws = table.WorkSheet;
            var startRow = table.Address.Start.Row + 1;
            var endRow = table.Address.End.Row;

            // Variables de memoria para recordar la fila anterior
            int? numBovedaAnterior = null;
            int? idContratoAnterior = null;

            for (int fila = startRow; fila <= endRow; fila++)
            {
                string idExcel = ws.Cells[fila, 1].Text?.Trim() ?? "";
                string numBovedaRaw = ws.Cells[fila, 2].Text?.Trim() ?? "";
                string nombreEnCelda = ws.Cells[fila, 3].Text?.Trim() ?? "";
                string bloqueExcel = ws.Cells[fila, 5].Text?.Trim() ?? "";

                int? numBovedaActual = (int?)ParsearEntero(numBovedaRaw);

                if (string.IsNullOrEmpty(idExcel) && string.IsNullOrEmpty(numBovedaRaw))
                {
                    numBovedaAnterior = null;
                    idContratoAnterior = null;
                    continue;
                }

                try
                {
                    var registro = ExtraerRegistroFilaEstandar(ws, fila);
                    registro.Bloque = !string.IsNullOrEmpty(bloqueExcel) ? bloqueExcel : "Bloque General";

                    bool debeEstarOcupada = !string.IsNullOrWhiteSpace(nombreEnCelda) ||
                                           ws.Cells[fila, 8].Text?.ToUpper() == "X" ||
                                           ws.Cells[fila, 9].Text?.ToUpper() == "X";

                    var (bloque, piso) = await CrearBloqueYPisoSiNoExisten(registro.Bloque, registro.Tipo, cementerio, usuario, resultado);
                    int numeroParaDb = (int)(ParsearEntero(idExcel) ?? (decimal)fila);

                    var boveda = await _context.Boveda.FirstOrDefaultAsync(b => b.Numero == numeroParaDb && b.PisoId == piso.Id);
                    if (boveda == null)
                    {
                        boveda = new Boveda { Numero = numeroParaDb, NumeroSecuencial = numBovedaRaw, Estado = true, PisoId = piso.Id, FechaCreacion = DateTime.Now, UsuarioCreadorId = usuario.Id };
                        _context.Boveda.Add(boveda);
                        await _context.SaveChangesAsync();
                    }

                    if (debeEstarOcupada)
                    {
                        var difunto = await CrearOObtenerDifunto(registro, usuario);
                        var propFinal = await ObtenerPropietarioGenerico(usuario);
                        var respPersona = await _context.Persona.FirstAsync(p => p.NumeroIdentificacion == "9999999999");

                        // 1. Creamos el contrato de la fila actual
                        var contratoActual = await CrearContratoEstandar(registro, boveda, difunto, respPersona, usuario, resultado,
                                             registro.FechaContrato ?? DateTime.Today,
                                             registro.FechaVencimiento ?? DateTime.Today.AddYears(5), cementerio);

                        if (contratoActual != null)
                        {
                            // 1. Generar las 5 cuotas usando tu método
                            var cuotasParaGuardar = GenerarCuotasParaContrato(contratoActual);
                            _context.Cuota.AddRange(cuotasParaGuardar);
                            await _context.SaveChangesAsync();

                            // 2. Generar el pago inicial que cubre todas las cuotas usando tu método
                            var pagosParaGuardar = GenerarPagosIniciales(
                                cuotasParaGuardar,
                                respPersona.Id,
                                "Efectivo",
                                "MIGRACION-" + contratoActual.Id,
                                true
                            );
                            _context.Pago.AddRange(pagosParaGuardar);
                            await _context.SaveChangesAsync();

                            // === LÓGICA DE RELACIÓN BIDIRECCIONAL ===
                            bool esBloqueLogico = registro.Bloque.Contains("Lógico", StringComparison.OrdinalIgnoreCase);

                            if (numBovedaActual == numBovedaAnterior && esBloqueLogico && idContratoAnterior.HasValue)
                            {
                                var contratoPrevio = await _context.Contrato.FindAsync(idContratoAnterior.Value);
                                if (contratoPrevio != null)
                                {
                                    // Relación en el contrato ANTERIOR apuntando al NUEVO
                                    contratoPrevio.ContratoRelacionadoId = contratoActual.Id;
                                    _context.Entry(contratoPrevio).State = EntityState.Modified;

                                    // Relación en el contrato ACTUAL apuntando al ANTERIOR
                                    contratoActual.ContratoRelacionadoId = contratoPrevio.Id;
                                    _context.Entry(contratoActual).State = EntityState.Modified;

                                    // Guardamos ambos cambios
                                    await _context.SaveChangesAsync();
                                    _logger.LogInformation($"Relación mutua creada: {contratoPrevio.Id} <-> {contratoActual.Id}");
                                }
                            }

                            // Actualizamos memoria para la siguiente fila
                            numBovedaAnterior = numBovedaActual;
                            idContratoAnterior = contratoActual.Id;

                            boveda.Estado = false;
                            boveda.PropietarioId = propFinal.Id;
                            _context.Boveda.Update(boveda);
                            await _context.SaveChangesAsync();
                        }
                    }
                    else
                    {
                        numBovedaAnterior = null;
                        idContratoAnterior = null;
                        boveda.Estado = true;
                        boveda.PropietarioId = null;
                        _context.Boveda.Update(boveda);
                        await _context.SaveChangesAsync();
                    }
                    resultado.RegistrosProcesados++;
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Error fila {fila}: {ex.Message}");
                    numBovedaAnterior = null;
                    idContratoAnterior = null;
                }
            }
            await ActualizarCapacidadBloques(cementerio);
        }



        private async Task<Propietario> ObtenerPropietarioGenerico(ApplicationUser usuario)
        {
            var cedulaGen = "9999999999";
            var existente = await _context.Propietario.FirstOrDefaultAsync(p => p.NumeroIdentificacion == cedulaGen);
            if (existente != null) return existente;

            var personaGen = await _context.Persona.FirstOrDefaultAsync(p => p.NumeroIdentificacion == cedulaGen);
            if (personaGen == null)
            {
                personaGen = new Persona
                {
                    Nombres = "PROPIETARIO NO ASIGNADO",
                    Apellidos = "(MIGRACION)",
                    TipoIdentificacion = "CEDULA",
                    NumeroIdentificacion = cedulaGen,
                    Telefono = "0000000000",
                    Email = "migracion@cementerio.com",
                    Direccion = "CEMENTERIO",
                    Estado = true,
                    FechaCreacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id
                };
                _context.Persona.Add(personaGen);
                await _context.SaveChangesAsync();
            }

            var propietarioGen = new Propietario
            {
                Nombres = personaGen.Nombres,
                Apellidos = personaGen.Apellidos,
                TipoIdentificacion = "CEDULA",
                NumeroIdentificacion = cedulaGen,
                Direccion = "CEMENTERIO MUNICIPAL",
                Email = "migracion@cementerio.com",
                Telefono = "0000000000",
                Estado = true,
                FechaCreacion = DateTime.Now,
                UsuarioCreadorId = usuario.Id,
                Catastro = "MIGRADO"
            };
            _context.Propietario.Add(propietarioGen);
            await _context.SaveChangesAsync();

            return propietarioGen;
        }

        private async Task ActualizarCapacidadBloques(Cementerio cementerio)
        {
            var bloques = await _context.Bloque.Where(b => b.CementerioId == cementerio.Id).ToListAsync();
            foreach (var bloque in bloques)
            {
                int totalEnDb = await _context.Boveda.CountAsync(bv => bv.Piso.BloqueId == bloque.Id);
                bloque.BovedasPorPiso = totalEnDb;
                bloque.FechaActualizacion = DateTime.Now;
                _context.Bloque.Update(bloque);
            }
            await _context.SaveChangesAsync();
        }

        private async Task CrearDifuntosDesdeTabla(ExcelTable table, ApplicationUser usuario, CatastroMigrationResult resultado)
        {
            var ws = table.WorkSheet;
            var startRow = table.Address.Start.Row + 1;
            var endRow = table.Address.End.Row;

            for (int fila = startRow; fila <= endRow; fila++)
            {
                var nombreDifunto = ws.Cells[fila, 3].Text?.Trim();
                if (string.IsNullOrWhiteSpace(nombreDifunto) || EsTextoVacio(nombreDifunto)) continue;

                var fechaContratoText = ws.Cells[fila, 6].Text?.Trim();
                var fechaContrato = ParsearFecha(fechaContratoText) ?? DateTime.Now;

                await CrearOObtenerDifunto(new RegistroCatastro { NombreDifunto = nombreDifunto, FechaContrato = fechaContrato }, usuario);
                resultado.DifuntosCreados++;
            }
        }



        private RegistroCatastro ExtraerRegistroFilaEstandar(ExcelWorksheet ws, int fila)
        {
            return new RegistroCatastro
            {
                Numero = ParsearEntero(ws.Cells[fila, 2].Text),
                NombreDifunto = ws.Cells[fila, 3].Text?.Trim(),
                Tipo = !string.IsNullOrWhiteSpace(ws.Cells[fila, 4].Text) ? ws.Cells[fila, 4].Text.Trim() : "Bóveda",
                Bloque = !string.IsNullOrWhiteSpace(ws.Cells[fila, 5].Text) ? ws.Cells[fila, 5].Text.Trim() : "General",
                FechaContrato = ParsearFecha(ws.Cells[fila, 6].Text),
                FechaVencimiento = ParsearFecha(ws.Cells[fila, 7].Text),
                EsPropio = EsColumnaTrue(ws.Cells[fila, 8].Text),
                EsArrendado = EsColumnaTrue(ws.Cells[fila, 9].Text),
                ReutilizacionArriendo = ws.Cells[fila, 10].Text?.Trim() ?? "",
                Representante = ws.Cells[fila, 11].Text?.Trim(),
                Contacto = ws.Cells[fila, 12].Text?.Trim(),
                CorreoElectronico = ws.Cells[fila, 13].Text?.Trim(),
                Observaciones = ws.Cells[fila, 14].Text?.Trim() ?? "Migrado"
            };
        }

        private async Task<(Bloque bloque, Piso piso)> CrearBloqueYPisoSiNoExisten(string nombreBloque, string tipoBloque, Cementerio cementerio, ApplicationUser usuario, CatastroMigrationResult resultado)
        {
            var bloque = await _context.Bloque.FirstOrDefaultAsync(b => b.Descripcion == nombreBloque);
            if (bloque == null)
            {
                bloque = new Bloque
                {
                    Descripcion = nombreBloque,
                    CalleA = "No especificada",
                    CalleB = "No especificada",
                    Tipo = tipoBloque,
                    NumeroDePisos = 1,
                    BovedasPorPiso = 100,
                    TarifaBase = tipoBloque == "Nicho" ? cementerio.tarifa_arriendo_nicho ?? 30.00m : cementerio.tarifa_arriendo ?? 50.00m,
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

            var piso = await _context.Piso.FirstOrDefaultAsync(p => p.BloqueId == bloque.Id);
            if (piso == null)
            {
                piso = new Piso { NumeroPiso = 1, BloqueId = bloque.Id, Precio = bloque.TarifaBase };
                _context.Piso.Add(piso);
                await _context.SaveChangesAsync();
                resultado.PisosCreados++;
            }
            return (bloque, piso);
        }

        private async Task<Difunto> CrearOObtenerDifunto(RegistroCatastro registro, ApplicationUser usuario)
        {
            var nombreCompleto = registro.NombreDifunto ?? "DIFUNTO DESCONOCIDO";
            var partes = nombreCompleto.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var nombres = TruncateString(string.Join(" ", partes.Take((partes.Length + 1) / 2)), 95);
            var apellidos = TruncateString(string.Join(" ", partes.Skip((partes.Length + 1) / 2)), 95);

            if (string.IsNullOrWhiteSpace(apellidos)) apellidos = "(MIGRACION)";

            var difuntoExistente = await _context.Difunto.FirstOrDefaultAsync(d => d.Nombres.ToLower() == nombres.ToLower() && d.Apellidos.ToLower() == apellidos.ToLower());
            if (difuntoExistente != null) return difuntoExistente;

            var descuento = await _context.Descuento.FirstOrDefaultAsync() ?? throw new Exception("No hay descuentos configurados");
            var nuevoDifunto = new Difunto
            {
                Nombres = nombres,
                Apellidos = apellidos,
                NumeroIdentificacion = "9999999999",
                FechaNacimiento = DateTime.Now.AddYears(-70),
                FechaFallecimiento = registro.FechaContrato ?? DateTime.Now,
                Estado = true,
                FechaCreacion = DateTime.Now,
                UsuarioCreadorId = usuario.Id,
                DescuentoId = descuento.Id
            };
            _context.Difunto.Add(nuevoDifunto);
            await _context.SaveChangesAsync();
            return nuevoDifunto;
        }

        private async Task<Persona> CrearOObtenerPersona(RegistroCatastro registro, ApplicationUser usuario)
        {
            string nombreEntrada = (registro.Representante ?? "CONTRIBUYENTE DESCONOCIDO").Trim();
            var partes = nombreEntrada.Split(' ', StringSplitOptions.RemoveEmptyEntries);

            string nombres = TruncateString(partes.Length > 0 ? string.Join(" ", partes.Take((partes.Length + 1) / 2)) : "SIN NOMBRE", 95);
            string apellidos = TruncateString(partes.Length > 1 ? string.Join(" ", partes.Skip((partes.Length + 1) / 2)) : "(MIGRACION)", 95);

            string identificacion = !string.IsNullOrWhiteSpace(registro.Contacto) ? registro.Contacto : "0000000000";

            var personaExistente = await _context.Persona.FirstOrDefaultAsync(p => p.NumeroIdentificacion == identificacion);
            if (personaExistente != null) return personaExistente;

            var nuevaPersona = new Persona
            {
                Nombres = nombres,
                Apellidos = apellidos,
                TipoIdentificacion = "CEDULA",
                NumeroIdentificacion = TruncateString(identificacion, 20),
                Telefono = TruncateString(identificacion, 20),
                Email = TruncateString(registro.CorreoElectronico ?? "sin@correo.com", 100),
                Direccion = TruncateString(registro.Observaciones ?? "CONOCIDA", 200),
                Estado = true,
                FechaCreacion = DateTime.Now,
                UsuarioCreadorId = usuario.Id
            };

            _context.Persona.Add(nuevaPersona);
            await _context.SaveChangesAsync();
            return nuevaPersona;
        }

        private async Task<Propietario> CrearOObtenerPropietario(Persona persona, ApplicationUser usuario)
        {
            var propietarioExistente = await _context.Propietario
                .FirstOrDefaultAsync(p => p.NumeroIdentificacion == persona.NumeroIdentificacion);

            if (propietarioExistente != null) return propietarioExistente;

            var propietario = new Propietario
            {
                Nombres = persona.Nombres,
                Apellidos = persona.Apellidos,
                TipoIdentificacion = persona.TipoIdentificacion,
                NumeroIdentificacion = persona.NumeroIdentificacion,
                Telefono = persona.Telefono ?? "0000000000",
                Email = persona.Email ?? "migracion@cementerio.com",
                Direccion = persona.Direccion ?? "CONOCIDA",
                Estado = true,
                FechaCreacion = DateTime.Now,
                UsuarioCreadorId = usuario.Id,
                Catastro = "MIGRADO"
            };

            _context.Propietario.Add(propietario);
            await _context.SaveChangesAsync();
            return propietario;
        }

        private async Task<Contrato> CrearContratoEstandar(RegistroCatastro registro, Boveda boveda, Difunto difunto, Persona responsable, ApplicationUser usuario, CatastroMigrationResult resultado, DateTime inicio, DateTime fin, Cementerio cem)
        {
            try
            {
                var piso = await _context.Piso.FindAsync(boveda.PisoId);
                var contrato = new Contrato
                {
                    NumeroSecuencial = _contratoService.getNumeroContrato(boveda.Id, false),
                    BovedaId = boveda.Id,
                    DifuntoId = difunto.Id,
                    FechaInicio = inicio,
                    FechaFin = fin,
                    NumeroDeMeses = Math.Max(1, ((fin.Year - inicio.Year) * 12) + fin.Month - inicio.Month),
                    MontoTotal = (decimal)(piso?.Precio ?? 0),
                    Estado = true,
                    FechaCreacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id,
                    Observaciones = registro.Observaciones ?? "Migrado",
                    Responsables = new List<Responsable>()
                };

                contrato.Responsables.Add(new Responsable
                {
                    Nombres = responsable.Nombres,
                    Apellidos = responsable.Apellidos,
                    TipoIdentificacion = "CEDULA",
                    NumeroIdentificacion = responsable.NumeroIdentificacion ?? "0000000000",
                    Direccion = !string.IsNullOrWhiteSpace(responsable.Direccion) ? responsable.Direccion : "CONOCIDA",
                    Telefono = !string.IsNullOrWhiteSpace(responsable.Telefono) ? responsable.Telefono : "0000000000",
                    Email = !string.IsNullOrWhiteSpace(responsable.Email) ? responsable.Email : "no@mail.com",
                    FechaInicio = inicio,
                    FechaFin = fin,
                    Estado = true,
                    FechaCreacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id
                });

                _context.Contrato.Add(contrato);
                await _context.SaveChangesAsync();
                resultado.ContratosCreados++;
                return contrato;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error Contrato Bóveda {boveda.Numero}: {ex.Message}");
                return null;
            }
        }

        private List<Cuota> GenerarCuotasParaContrato(Contrato contrato)
        {
            var cuotas = new List<Cuota>();
            var montoPorCuota = contrato.MontoTotal / 5;
            for (int i = 1; i <= 5; i++)
            {
                cuotas.Add(new Cuota
                {
                    ContratoId = contrato.Id,
                    FechaVencimiento = contrato.FechaInicio.AddYears(i),
                    Monto = montoPorCuota,
                    Pagada = false
                });
            }
            return cuotas;
        }

        private List<Pago> GenerarPagosIniciales(List<Cuota> cuotas, int personaId, string tipo, string comprobante, bool cubrirTodas)
        {
            var pago = new Pago
            {
                FechaPago = DateTime.Now,
                TipoPago = tipo,
                NumeroComprobante = comprobante,
                Monto = cuotas.Sum(c => c.Monto),
                PersonaPagoId = personaId,
                Cuotas = cuotas
            };
            foreach (var c in cuotas) c.Pagada = true;
            return new List<Pago> { pago };
        }

        private static decimal? ParsearEntero(string? t) => decimal.TryParse(t, out var n) ? n : null;
        private static DateTime? ParsearFecha(string? t) => DateTime.TryParse(t, out var d) ? d.Date : null;
        private static bool EsColumnaTrue(string? t) => t?.Trim().ToLower() is "x" or "si" or "sí" or "1" or "true";
        private static bool EsTextoVacio(string t) => t.Trim().ToLower() is "vacio" or "vacío" or "empty" or "vacia";
        private static string TruncateString(string v, int m) => string.IsNullOrEmpty(v) ? v : (v.Length <= m ? v : v.Substring(0, m));

        private async Task<ApplicationUser> ObtenerUsuarioMigracion()
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == "migracion");
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = "migracion",
                    Email = "migracion@cementerio.com",
                    Nombres = "Sistema",
                    Apellidos = "Migracion"
                };
                await _userManager.CreateAsync(user, "Migracion.2024*");
            }
            return user;
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
                    AniosArriendoBovedas = 5,
                    AniosArriendoNicho = 5,
                    VecesRenovacionBovedas = 3,
                    VecesRenovacionNicho = 5
                };
                _context.Cementerio.Add(cementerio);
                await _context.SaveChangesAsync();
                _logger.LogInformation("🏗️ Cementerio creado.");
            }
            else
            {
                _logger.LogInformation("♻️ Cementerio reutilizado.");
            }
            return cementerio;
        }

        private async Task<Dictionary<string, int>> ObtenerContadorBovedasPorTipo()
        {
            return await _context.Bloque.Select(b => new { b.Tipo, Count = _context.Boveda.Count(bv => bv.Piso!.BloqueId == b.Id) })
                .GroupBy(x => x.Tipo).ToDictionaryAsync(g => g.Key ?? "Desconocido", g => g.Sum(x => x.Count));
        }

        private async Task<Difunto?> ObtenerDifuntoPorNombre(string nc)
        {
            var p = nc.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var n = TruncateString(string.Join(" ", p.Take((p.Length + 1) / 2)), 95);
            var a = TruncateString(string.Join(" ", p.Skip((p.Length + 1) / 2)), 95);
            return await _context.Difunto.FirstOrDefaultAsync(d => d.Nombres.ToLower() == n.ToLower() && d.Apellidos.ToLower() == a.ToLower());
        }

        private void GenerarReporteFinal(CatastroMigrationResult res, Dictionary<string, int> tipos)
        {
            _logger.LogInformation("╔════════════════════════════════════════════════════════════════════╗");
            _logger.LogInformation("║             📋 REPORTE FINAL DE MIGRACIÓN (LÓGICA HIERRO)         ║");
            _logger.LogInformation("╚════════════════════════════════════════════════════════════════════╝");
            _logger.LogInformation($"   • Bóvedas Procesadas: {res.RegistrosProcesados}");
            _logger.LogInformation($"   • Bóvedas Creadas/Aseguradas: {res.BovedasCreadas}");
            _logger.LogInformation($"   • Contratos Creados: {res.ContratosCreados}");
            _logger.LogInformation($"   • Difuntos Registrados: {res.DifuntosCreados}");
            _logger.LogInformation("╚════════════════════════════════════════════════════════════════════╝");
        }

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
            public Dictionary<string, int> FilasPorHoja { get; set; } = new Dictionary<string, int>();
            public Dictionary<string, int> BovedasPorTipo { get; set; } = new Dictionary<string, int>();
        }
    }
}