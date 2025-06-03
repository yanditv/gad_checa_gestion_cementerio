using gad_checa_gestion_cementerio.Data;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Utils;
using Microsoft.EntityFrameworkCore;

namespace gad_checa_gestion_cementerio.services;

public class ContratoService
{
    private readonly ApplicationDbContext _context;

    public ContratoService(ApplicationDbContext context)
    {
        _context = context;
    }

    public Contrato nuevoContrato()
    {

        var tarifa = _context.Cementerio.FirstOrDefault()?.tarifa_arriendo ?? 0;
        return new Contrato
        {
            FechaCreacion = DateTime.Now,
            FechaActualizacion = DateTime.Now.AddYears(1),
            Estado = true,
            FechaInicio = DateTime.Now,
            FechaFin = DateTime.Now.AddMonths(5),
            MontoTotal = tarifa,
            Observaciones = string.Empty,
            DifuntoId = 0,
            Difunto = new Difunto(),
            NumeroDeMeses = 5,
            EsRenovacion = false,
            Cuotas = new List<Cuota>(),
            NumeroSecuencial = getNumeroContrato(TipoContrato.Nuevo),
        };
    }
    private string GetTipoContratoPrefix(TipoContratos tipo)
    {
        return tipo switch
        {
            TipoContratos.NUEVO => "CTR",
            TipoContratos.RENOVACION => "RNV",
            TipoContratos.NUEVO_NICHO => "NCH",
            TipoContratos.NUEVO_NICHO_RENOVACION => "NCR",
            _ => throw new ArgumentOutOfRangeException(nameof(tipo), tipo, null)
        };
    }

    public Boveda GetBovedaDisponibleByTipo(TipoContrato tipo, Boveda? boveda = null)
    {
        // Validar el tipo de contrato
        if (tipo != TipoContrato.Nuevo && tipo != TipoContrato.Renovación && tipo != TipoContrato.Nicho)
        {
            throw new ArgumentException("Tipo de contrato no válido. Debe ser 'Nuevo' o 'Renovación'.");
        }
        switch (tipo)
        {
            case TipoContrato.Nuevo:
                var boveda_nueva = _context.Boveda
                            .Include(b => b.Piso)
                            .ThenInclude(p => p.Bloque)
                            .FirstOrDefault(b => b.Piso.Bloque.Tipo == "Bovedas" && b.Estado == true);
                return boveda_nueva ?? throw new InvalidOperationException("No hay bóvedas disponibles.");
            case TipoContrato.Renovación:
                return boveda ?? throw new InvalidOperationException("Debe proporcionar una bóveda para la renovación.");
            case TipoContrato.Nicho:
                // Buscar el tipo de bloque en la base de datos
                var nicho_nuevo = _context.Boveda
                            .Include(b => b.Piso)
                            .ThenInclude(p => p.Bloque)
                            .FirstOrDefault(b => b.Piso.Bloque.Tipo == "Nichos" && b.Estado == true);
                return nicho_nuevo ?? throw new InvalidOperationException("No hay bóvedas disponibles.");
            default:
                throw new ArgumentException("Tipo de contrato no válido.");
        }
        // Obtener el tipo de bloque según el tipo de contrato

        // Obtener el tipo de bloque
        // Buscar la bóveda disponible según el tipo


        // Si no se encuentra una bóveda, retornar null
        return boveda;
    }
    public String getNumeroContrato(TipoContrato tipoContrato)
    {
        var year = DateTime.Now.Year;    // Obtener la bóveda asociada al contrato desde la sesión
        var boveda = GetBovedaDisponibleByTipo(tipoContrato);
        var tipo = "Bovedas"; // Valor por defecto en caso de que no se encuentre la bóveda
        if (boveda != null)
        {
            tipo = boveda.Piso.Bloque.Tipo;
        }
        // Determinar el prefijo según el tipo de contrato y si la bóveda pertenece a un bloque de tipo "NICHOS"

        var prefix = tipo switch
        {
            "Bovedas" => GetTipoContratoPrefix(TipoContratos.NUEVO),
            "Nichos" => GetTipoContratoPrefix(TipoContratos.NUEVO_NICHO),
            _ => GetTipoContratoPrefix(TipoContratos.NUEVO)
        };

        // Filtrar los contratos por año y prefijo
        var lastContrato = _context.Contrato
            .Where(c => c.NumeroSecuencial.Contains($"-{year}-") && c.NumeroSecuencial.StartsWith(prefix))
            .OrderByDescending(c => c.Id)
            .FirstOrDefault();

        // Determinar el siguiente número secuencial
        var nextNumber = lastContrato != null
            ? int.Parse(lastContrato.NumeroSecuencial.Split('-').Last()) + 1
            : 1;

        // Generar el número secuencial
        return $"{prefix}-GADCHECA-{year}-{nextNumber:D3}";
    }

    public async Task<Contrato> GetContratoByIdAsync(int id)
    {
        return await _context.Contrato.FindAsync(id);
    }

    public async Task<List<Contrato>> GetAllContratosAsync()
    {
        return await _context.Contrato.ToListAsync();
    }

    public async Task AddContratoAsync(Contrato contrato)
    {
        _context.Contrato.Add(contrato);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateContratoAsync(Contrato contrato)
    {
        _context.Contrato.Update(contrato);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteContratoAsync(int id)
    {
        var contrato = await GetContratoByIdAsync(id);
        if (contrato != null)
        {
            _context.Contrato.Remove(contrato);
            await _context.SaveChangesAsync();
        }
    }
}
