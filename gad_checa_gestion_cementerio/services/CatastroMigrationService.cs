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
            _logger.LogInformation($"🚀 Iniciando migración desde TABLAS en: {rutaArchivo}");

            var usuarioMigracion = await ObtenerUsuarioMigracion();
            var cementerio = await CrearOValidarCementerio(usuarioMigracion);

            string[] tablasObjetivo = { "TablaNichos", "TablaTumulos", "TablaBovedas" };

            // FASE 1: Extraer Difuntos
            foreach (var worksheet in package.Workbook.Worksheets)
            {
                foreach (var table in worksheet.Tables.Where(t => tablasObjetivo.Contains(t.Name)))
                {
                    await CrearDifuntosDesdeTabla(table, usuarioMigracion, resultado);
                }
            }

            // FASE 2: Procesar Registros (ID Único y Conteo)
            foreach (var worksheet in package.Workbook.Worksheets)
            {
                foreach (var table in worksheet.Tables.Where(t => tablasObjetivo.Contains(t.Name)))
                {
                    await ProcesarTablaEstandar(table, cementerio, usuarioMigracion, resultado);
                }
            }

            // FASE 3: Relacionar Contratos
            foreach (var worksheet in package.Workbook.Worksheets)
            {
                foreach (var table in worksheet.Tables.Where(t => tablasObjetivo.Contains(t.Name)))
                {
                    await RelacionarContratosConsecutivosDesdeTabla(table, resultado);
                }
            }

            var bovedasPorTipo = await ObtenerContadorBovedasPorTipo();
            resultado.BovedasPorTipo = bovedasPorTipo;
            GenerarReporteFinal(resultado, bovedasPorTipo);

            resultado.EsExitoso = true;
            return resultado;
        }

        private async Task ProcesarTablaEstandar(ExcelTable table, Cementerio cementerio, ApplicationUser usuario, CatastroMigrationResult resultado)
        {
            var ws = table.WorkSheet;
            var startRow = table.Address.Start.Row + 1;
            var endRow = table.Address.End.Row;

            _logger.LogInformation($"=== 🛡️ INICIANDO MIGRACIÓN CON INTEGRIDAD TOTAL: {table.Name} ===");

            for (int fila = startRow; fila <= endRow; fila++)
            {
                // 1. Extracción de datos con limpieza de nulos para evitar warnings
                string idExcel = ws.Cells[fila, 1].Text?.Trim() ?? "";
                string numBovedaRaw = ws.Cells[fila, 2].Text?.Trim() ?? "";
                string nombreDifunto = ws.Cells[fila, 3].Text?.Trim() ?? "";

                // Saltamos solo si la fila está totalmente vacía en sus columnas clave
                if (string.IsNullOrEmpty(numBovedaRaw) && string.IsNullOrEmpty(nombreDifunto)) continue;

                try
                {
                    var registro = ExtraerRegistroFilaEstandar(ws, fila);

                    // SOLUCIÓN ERROR CS0266: Casteo explícito de decimal? a int?
                    int? idParsed = (int?)ParsearEntero(idExcel);
                    int numeroParaDb;

                    // Lógica de ID robusta: priorizamos el número del Excel, pero evitamos conflictos
                    if (numBovedaRaw.ToLower() == "suelo")
                    {
                        numeroParaDb = 9000 + fila;
                    }
                    else
                    {
                        // Si el número es especial (como 55.1), usamos el ID de la columna A como identificador único entero
                        numeroParaDb = idParsed ?? fila;
                    }

                    // 2. Garantizar Bloque y Piso (Conexión física estricta)
                    var (bloque, piso) = await CrearBloqueYPisoSiNoExisten(registro.Bloque, registro.Tipo, cementerio, usuario, resultado);

                    // 3. Buscar Bóveda por Piso + Número (Evita duplicados cruzados entre bloques)
                    var boveda = await _context.Boveda
                        .FirstOrDefaultAsync(b => b.Numero == numeroParaDb && b.PisoId == piso.Id);

                    if (boveda == null)
                    {
                        boveda = new Boveda
                        {
                            Numero = numeroParaDb,
                            NumeroSecuencial = numBovedaRaw, // Guardamos el "55.1" real aquí para visualización
                            Estado = true,
                            FechaCreacion = DateTime.Now,
                            UsuarioCreadorId = usuario.Id,
                            PisoId = piso.Id
                        };
                        _context.Boveda.Add(boveda);
                        await _context.SaveChangesAsync(); // Guardado físico inmediato para asegurar existencia
                    }

                    // 4. Lógica de Ocupación Forzada
                    // Cualquier texto que no sea "VACIO" se considera ocupación (incluye "no se lee", "ocupado", etc.)
                    bool tieneContenido = !string.IsNullOrWhiteSpace(nombreDifunto) &&
                                         !nombreDifunto.Equals("VACIO", StringComparison.OrdinalIgnoreCase);

                    if (tieneContenido)
                    {
                        // Normalización de nombres para que el sistema los acepte
                        if (nombreDifunto.ToLower().Contains("no se lee") || nombreDifunto.ToLower().Contains("ocupado"))
                        {
                            registro.NombreDifunto = $"N.N. ({nombreDifunto})";
                        }

                        var difunto = await CrearOObtenerDifunto(registro, usuario);
                        Persona? responsable = null;
                        if (!string.IsNullOrWhiteSpace(registro.Representante))
                            responsable = await CrearOObtenerPersona(registro, usuario);

                        // ACTUALIZACIÓN DE ESTADO Y AUDITORÍA
                        boveda.Estado = false; // Marcamos como OCUPADA
                        boveda.FechaActualizacion = DateTime.Now;

                        // Nota: Se omite UsuarioActualizadorId si no existe en el modelo para evitar error CS1061
                        // Si existe bajo otro nombre (ej. UsuarioId), cámbialo aquí:
                        // boveda.UsuarioId = usuario.Id;

                        if (registro.EsPropio && responsable != null)
                        {
                            var propietario = await CrearOObtenerPropietario(responsable, usuario);
                            if (propietario != null) boveda.PropietarioId = propietario.Id;
                        }

                        _context.Boveda.Update(boveda);
                        await _context.SaveChangesAsync();

                        // 5. Creación del Contrato (Indispensable para que la vista pinte de ROJO)
                        var inicio = registro.FechaContrato ?? DateTime.Now.AddDays(-1);
                        var fin = registro.FechaVencimiento ?? inicio.AddYears(5);

                        // Si la fecha de fin es pasada, le damos 1 año de gracia para que sea un contrato "activo" pero vencido
                        if (fin <= DateTime.Now) fin = DateTime.Now.AddYears(1);

                        await CrearContratoEstandar(registro, boveda, difunto, responsable, usuario, resultado, inicio, fin, cementerio);

                        await _context.SaveChangesAsync();
                        resultado.RegistrosProcesados++;
                        _logger.LogInformation($"✅ Fila {fila}: Procesada exitosamente (Bóveda {numBovedaRaw})");
                    }
                    else
                    {
                        // Si la fila está vacía en el Excel, aseguramos que la bóveda esté disponible
                        boveda.Estado = true;
                        _context.Boveda.Update(boveda);
                        await _context.SaveChangesAsync();
                        _logger.LogInformation($"🟢 Fila {fila}: Marcada como disponible.");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"❌ ERROR en Fila {fila}: {ex.Message}");
                    resultado.Errores.Add($"Fila {fila} (ID Excel {idExcel}): {ex.Message}");
                }
            }

            // 6. RECONCILIACIÓN FINAL: Actualiza los contadores de capacidad por bloque
            await ActualizarCapacidadBloques(cementerio);
        }

        private async Task ActualizarCapacidadBloques(Cementerio cementerio)
        {
            var bloques = await _context.Bloque.Where(b => b.CementerioId == cementerio.Id).ToListAsync();
            foreach (var bloque in bloques)
            {
                // Contamos cuántas bóvedas existen realmente vinculadas a este bloque
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
                // El nombre ahora está en la columna 3 (C)
                var nombreDifunto = ws.Cells[fila, 3].Text?.Trim();
                if (string.IsNullOrWhiteSpace(nombreDifunto) || EsTextoVacio(nombreDifunto)) continue;

                // La fecha está en la columna 6 (F)
                var fechaContratoText = ws.Cells[fila, 6].Text?.Trim();
                var fechaContrato = ParsearFecha(fechaContratoText) ?? DateTime.Now;

                await CrearOObtenerDifunto(new RegistroCatastro { NombreDifunto = nombreDifunto, FechaContrato = fechaContrato }, usuario);
                resultado.DifuntosCreados++;
            }
        }

        private async Task RelacionarContratosConsecutivosDesdeTabla(ExcelTable table, CatastroMigrationResult resultado)
        {
            var ws = table.WorkSheet;
            var startRow = table.Address.Start.Row + 1;
            var endRow = table.Address.End.Row;

            // Usaremos un diccionario para agrupar contratos por número de bóveda
            // Llave: Número de Bóveda, Valor: Lista de IDs de Contratos
            var bovedasGrupos = new Dictionary<int, List<int>>();

            for (int fila = startRow; fila <= endRow; fila++)
            {
                // AJUSTE DE COLUMNAS: B(2) es Número, C(3) es Difunto
                var numBovedaRaw = ws.Cells[fila, 2].Text.Trim().ToLower();
                // Aplicamos (int?) al resultado de ParsearEntero para resolver el error CS0266
                int? numBoveda = numBovedaRaw == "suelo" ? (9000 + fila) : (int?)ParsearEntero(ws.Cells[fila, 2].Text);
                var nombreDifunto = ws.Cells[fila, 3].Text?.Trim();

                if (numBoveda.HasValue && !string.IsNullOrWhiteSpace(nombreDifunto))
                {
                    var difunto = await ObtenerDifuntoPorNombre(nombreDifunto);
                    if (difunto != null)
                    {
                        // Buscamos el contrato que acabamos de crear para este difunto
                        var contrato = await _context.Contrato
                            .OrderByDescending(c => c.Id)
                            .FirstOrDefaultAsync(c => c.DifuntoId == difunto.Id);

                        if (contrato != null)
                        {
                            if (!bovedasGrupos.ContainsKey(numBoveda.Value))
                                bovedasGrupos[numBoveda.Value] = new List<int>();

                            bovedasGrupos[numBoveda.Value].Add(contrato.Id);
                        }
                    }
                }
            }

            // Ahora relacionamos los contratos que pertenecen a la misma bóveda (reutilización)
            foreach (var grupo in bovedasGrupos.Where(g => g.Value.Count > 1))
            {
                var ids = grupo.Value;
                for (int i = 0; i < ids.Count; i++)
                {
                    var contratoActual = await _context.Contrato.FindAsync(ids[i]);
                    if (contratoActual == null) continue;

                    // Lo relacionamos con el siguiente (o el primero si es el último) para cerrar el círculo
                    // o simplemente con el anterior si solo son dos.
                    int siguienteIndice = (i + 1) % ids.Count;
                    contratoActual.ContratoRelacionadoId = ids[siguienteIndice];

                    _context.Contrato.Update(contratoActual);
                }
            }
            await _context.SaveChangesAsync();
        }
        private RegistroCatastro ExtraerRegistroFilaEstandar(ExcelWorksheet ws, int fila)
        {
            // Según tu imagen: 
            // A(1)=ID, B(2)=Número, C(3)=Nombre, D(4)=Tipo, E(5)=Bloque, 
            // F(6)=FechaContrato, G(7)=FechaVencimiento, H(8)=Propio...
            return new RegistroCatastro
            {
                // Tomamos la columna B (2) para el número de bóveda, no la A
                Numero = ParsearEntero(ws.Cells[fila, 2].Text),
                NombreDifunto = ws.Cells[fila, 3].Text?.Trim(),
                Tipo = ws.Cells[fila, 4].Text?.Trim(),
                Bloque = ws.Cells[fila, 5].Text?.Trim(), // Columna E
                FechaContrato = ParsearFecha(ws.Cells[fila, 6].Text),
                FechaVencimiento = ParsearFecha(ws.Cells[fila, 7].Text),
                EsPropio = EsColumnaTrue(ws.Cells[fila, 8].Text),
                EsArrendado = EsColumnaTrue(ws.Cells[fila, 9].Text),
                ReutilizacionArriendo = ws.Cells[fila, 10].Text?.Trim(),
                Representante = ws.Cells[fila, 11].Text?.Trim(), // Columna K
                Contacto = ws.Cells[fila, 12].Text?.Trim(),      // Columna L
                CorreoElectronico = ws.Cells[fila, 13].Text?.Trim(), // Columna M
                Observaciones = ws.Cells[fila, 14].Text?.Trim()      // Columna N
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

        private async Task<Boveda> CrearOObtenerBovedaConNumeroDiferente(RegistroCatastro registro, int pisoId, ApplicationUser usuario, int numeroFinal)
        {
            // Buscamos coincidencia exacta por número y piso para no duplicar
            var bovedaExistente = await _context.Boveda
                .Include(b => b.Piso)
                .FirstOrDefaultAsync(b => b.Numero == numeroFinal && b.PisoId == pisoId);

            if (bovedaExistente == null)
            {
                var boveda = new Boveda
                {
                    Numero = numeroFinal,
                    NumeroSecuencial = $"{numeroFinal:000}",
                    Estado = true, // Siempre disponible al crear
                    FechaCreacion = DateTime.Now,
                    FechaActualizacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id,
                    PisoId = pisoId
                };
                _context.Boveda.Add(boveda);
                await _context.SaveChangesAsync();
                return await _context.Boveda.Include(b => b.Piso).FirstAsync(b => b.Id == boveda.Id);
            }
            return bovedaExistente;
        }
        private async Task<Difunto> CrearOObtenerDifunto(RegistroCatastro registro, ApplicationUser usuario)
        {
            var partes = registro.NombreDifunto!.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var nombres = TruncateString(string.Join(" ", partes.Take(partes.Length / 2 + 1)), 95);
            var apellidos = TruncateString(string.Join(" ", partes.Skip(partes.Length / 2 + 1)), 95);

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

        // ==========================
        // CREAR O OBTENER PERSONA (CORREGIDO)
        // ==========================
        private async Task<Persona> CrearOObtenerPersona(RegistroCatastro registro, ApplicationUser usuario)
        {
            var partes = registro.Representante!.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var nombres = partes.Length > 0 ? string.Join(" ", partes.Take(partes.Length / 2 + 1)) : "Sin nombre";
            var apellidos = partes.Length > 1 ? string.Join(" ", partes.Skip(partes.Length / 2 + 1)) : "Sin apellido";

            nombres = TruncateString(nombres, 95);
            apellidos = TruncateString(apellidos, 95);

            var personaExistente = await _context.Persona
                .FirstOrDefaultAsync(p => p.Nombres == nombres && p.Apellidos == apellidos);

            if (personaExistente != null)
            {
                _logger.LogInformation($"♻️ Persona reutilizada: {nombres} {apellidos}");
                return personaExistente;
            }

            var persona = new Persona
            {
                Nombres = nombres,
                Apellidos = apellidos,
                TipoIdentificacion = "CEDULA",
                NumeroIdentificacion = "9999999999",
                // CORRECCIÓN: Truncar teléfono para evitar errores de longitud
                Telefono = TruncateString(registro.Contacto ?? "0000000000", 20),
                Email = TruncateString(registro.CorreoElectronico ?? "no-email@ejemplo.com", 100),

                // CORRECCIÓN CLAVE: Valor por defecto porque el Excel no tiene columna Dirección
                Direccion = "CONOCIDA",

                Estado = true,
                FechaCreacion = DateTime.Now,
                UsuarioCreadorId = usuario.Id
            };

            _context.Persona.Add(persona);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"🆕 Persona creada: {nombres} {apellidos}");
            return persona;
        }
        private async Task<Propietario?> CrearOObtenerPropietario(Persona persona, ApplicationUser usuario)
        {
            var propietarioExistente = await _context.Propietario
                .FirstOrDefaultAsync(p => p.Nombres == persona.Nombres && p.Apellidos == persona.Apellidos);

            if (propietarioExistente != null)
            {
                _logger.LogInformation($"♻️ Propietario reutilizado: {persona.Nombres} {persona.Apellidos}");
                return propietarioExistente;
            }

            var propietario = new Propietario
            {
                Nombres = persona.Nombres,
                Apellidos = persona.Apellidos,
                TipoIdentificacion = persona.TipoIdentificacion,
                NumeroIdentificacion = persona.NumeroIdentificacion,
                Telefono = TruncateString(persona.Telefono ?? "0000000000", 20),
                Email = persona.Email,

                // CORRECCIÓN: Evitar nulos en dirección para la entidad Propietario
                Direccion = string.IsNullOrWhiteSpace(persona.Direccion) ? "CONOCIDA" : persona.Direccion,

                Estado = true,
                FechaCreacion = DateTime.Now,
                UsuarioCreadorId = usuario.Id,
                Catastro = "MIGRADO"
            };

            _context.Propietario.Add(propietario);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"🆕 Propietario creado: {persona.Nombres} {persona.Apellidos}");
            return propietario;
        }
        private async Task<Contrato> CrearContratoEstandar(RegistroCatastro registro, Boveda boveda, Difunto difunto, Persona? responsable, ApplicationUser usuario, CatastroMigrationResult resultado, DateTime inicio, DateTime fin, Cementerio cem)
        {
            var contrato = new Contrato
            {
                NumeroSecuencial = _contratoService.getNumeroContrato(boveda.Id, false),
                BovedaId = boveda.Id,
                DifuntoId = difunto.Id,
                FechaInicio = inicio,
                FechaFin = fin,
                NumeroDeMeses = ((fin.Year - inicio.Year) * 12) + fin.Month - inicio.Month,
                MontoTotal = boveda.Piso!.Precio,
                Estado = true,
                FechaCreacion = DateTime.Now,
                UsuarioCreadorId = usuario.Id,
                Observaciones = string.IsNullOrWhiteSpace(registro.Observaciones) ? "Migrado desde catastro Excel" : registro.Observaciones
            };

            _context.Contrato.Add(contrato);
            await _context.SaveChangesAsync();
            var cuotas = GenerarCuotasParaContrato(contrato);
            _context.Cuota.AddRange(cuotas);
            await _context.SaveChangesAsync();

            // 2. Si hay un responsable, generamos el pago para saldar las cuotas migradas
            if (responsable != null)
            {
                // Creamos la entidad Responsable vinculada al contrato
                var resp = new Responsable
                {
                    Nombres = responsable.Nombres,
                    Apellidos = responsable.Apellidos,
                    TipoIdentificacion = responsable.TipoIdentificacion,
                    NumeroIdentificacion = responsable.NumeroIdentificacion,
                    Direccion = string.IsNullOrWhiteSpace(responsable.Direccion) ? "CONOCIDA" : responsable.Direccion,
                    Telefono = TruncateString(responsable.Telefono ?? "0000000000", 20),
                    Email = TruncateString(responsable.Email ?? "no-email@ejemplo.com", 100),
                    FechaInicio = inicio,
                    FechaFin = fin,
                    Estado = true,
                    FechaCreacion = DateTime.Now,
                    UsuarioCreadorId = usuario.Id
                };
                _context.Responsable.Add(resp);
                contrato.Responsables = new List<Responsable> { resp };
                var pagos = GenerarPagosIniciales(cuotas, responsable.Id, "EFECTIVO", "MIGRACION-EXCEL", true);
                _context.Pago.AddRange(pagos);

                await _context.SaveChangesAsync();
            }

            resultado.ContratosCreados++;
            return contrato;
        }
        private List<Cuota> GenerarCuotasParaContrato(Contrato contrato)
        {
            var cuotas = new List<Cuota>();
            var montoPorCuota = contrato.MontoTotal / 5;
            for (int i = 1; i <= 5; i++) cuotas.Add(new Cuota { Contrato = contrato, FechaVencimiento = contrato.FechaInicio.AddYears(i), Monto = montoPorCuota, Pagada = false });
            return cuotas;
        }

        private List<Pago> GenerarPagosIniciales(List<Cuota> cuotas, int personaId, string tipo, string comprobante, bool cubrirTodas)
        {
            var pago = new Pago { FechaPago = DateTime.Now, TipoPago = tipo, NumeroComprobante = comprobante, Monto = cuotas.Sum(c => c.Monto), PersonaPagoId = personaId, Cuotas = cuotas };
            foreach (var c in cuotas) c.Pagada = true;
            return new List<Pago> { pago };
        }

        private static decimal? ParsearEntero(string? t) => decimal.TryParse(t, out var n) ? n : null;
        private static DateTime? ParsearFecha(string? t) => DateTime.TryParse(t, out var d) ? d.Date : null;
        private static bool EsColumnaTrue(string? t) => t?.Trim().ToLower() is "x" or "si" or "sí" or "1" or "true";
        private static bool EsTextoVacio(string t) => t.Trim().ToLower() is "vacio" or "vacío" or "empty";
        private static string TruncateString(string v, int m) => string.IsNullOrEmpty(v) ? v : (v.Length <= m ? v : v.Substring(0, m));

        private async Task<ApplicationUser> ObtenerUsuarioMigracion()
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserName == "migracion");
            if (user == null)
            {
                user = new ApplicationUser { UserName = "migracion", Email = "migracion@cementerio.com" };
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
            var n = TruncateString(string.Join(" ", p.Take(p.Length / 2 + 1)), 95);
            var a = TruncateString(string.Join(" ", p.Skip(p.Length / 2 + 1)), 95);
            return await _context.Difunto.FirstOrDefaultAsync(d => d.Nombres.ToLower() == n.ToLower() && d.Apellidos.ToLower() == a.ToLower());
        }

        private void GenerarReporteFinal(CatastroMigrationResult res, Dictionary<string, int> tipos)
        {
            _logger.LogInformation("╔════════════════════════════════════════════════════════════════════╗");
            _logger.LogInformation("║             📋 REPORTE DE INTEGRIDAD DE TABLAS                     ║");
            _logger.LogInformation("╚════════════════════════════════════════════════════════════════════╝");
            foreach (var kvp in res.FilasPorHoja) _logger.LogInformation($"   • {kvp.Key}: {kvp.Value} registros guardados.");
            _logger.LogInformation($"   • Total Difuntos: {res.DifuntosCreados}");
            _logger.LogInformation($"   • Total Contratos: {res.ContratosCreados}");
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

            // Estas son las propiedades que Program.cs está buscando:
            public List<string> Mensajes { get; set; } = new List<string>();
            public List<string> Errores { get; set; } = new List<string>(); // Error CS1061 solucionado

            public int BloquesCreados { get; set; }
            public int PisosCreados { get; set; }
            public int BovedasCreadas { get; set; } // Error CS1061 solucionado
            public int PersonasCreadas { get; set; } // Error CS1061 solucionado
            public int DifuntosCreados { get; set; }
            public int ContratosCreados { get; set; }
            public int RegistrosProcesados { get; set; }

            public Dictionary<string, int> FilasPorHoja { get; set; } = new Dictionary<string, int>();
            public Dictionary<string, int> BovedasPorTipo { get; set; } = new Dictionary<string, int>();
        }
    }
}