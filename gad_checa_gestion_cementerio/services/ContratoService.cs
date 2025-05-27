using gad_checa_gestion_cementerio.Data;
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
            NumeroDeMeses = 5,
            EsRenovacion = false,
            Cuotas = new List<Cuota>(),
            NumeroSecuencial = getNumeroContrato(0),
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
    public String getNumeroContrato(long BovedaId)
    {
        var year = DateTime.Now.Year;    // Obtener la bóveda asociada al contrato desde la sesión
        var boveda = _context.Boveda.Include(b => b.Piso.Bloque).FirstOrDefault(b => b.Id == BovedaId && b.Estado);
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
