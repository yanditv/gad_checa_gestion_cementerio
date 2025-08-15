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
        var periodo = 5;
        return new Contrato
        {
            FechaCreacion = DateTime.Now,
            FechaActualizacion = DateTime.Now,
            Estado = true,
            FechaInicio = DateTime.Now,
            FechaFin = DateTime.Now.AddYears(periodo),
            MontoTotal = tarifa,
            Observaciones = string.Empty,
            DifuntoId = 0,
            Difunto = new Difunto(),
            NumeroDeMeses = periodo,
            EsRenovacion = false,
            Cuotas = new List<Cuota>(),
            BovedaId = 0,
            NumeroSecuencial = getNumeroContrato(_context.Boveda.FirstOrDefault()?.Id ?? 0),
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
            TipoContratos.NUEVO_TUMULO => "TML",
            TipoContratos.NUEVO_TUMULO_RENOVACION => "TMR",
            _ => throw new ArgumentOutOfRangeException(nameof(tipo), tipo, null)
        };
    }
    public string getNumeroContrato(int idBoveda, bool isRenovacion = false)
    {
        var year = DateTime.Now.Year;
        var boveda = _context.Boveda
            .Include(b => b.Piso)
            .ThenInclude(p => p.Bloque)
            .FirstOrDefault(b => b.Id == idBoveda);
        var tipo = "Bovedas";
        if (boveda != null)
        {
            tipo = boveda.Piso.Bloque.Tipo;
        }

        var prefix = tipo switch
        {
            "Bovedas" => GetTipoContratoPrefix(TipoContratos.NUEVO),
            "Nichos" => GetTipoContratoPrefix(TipoContratos.NUEVO_NICHO),
            "Tumulos" => GetTipoContratoPrefix(TipoContratos.NUEVO_TUMULO),
            _ => GetTipoContratoPrefix(TipoContratos.NUEVO)
        };

        if (isRenovacion)
        {
            // Para renovaciones, usamos una combinación de prefijos
            // RNV-CTR para bóvedas, RNV-NCH para nichos y RNV-TML para túmulos
            var basePrefix = tipo switch
            {
                "Bovedas" => GetTipoContratoPrefix(TipoContratos.NUEVO),
                "Nichos" => GetTipoContratoPrefix(TipoContratos.NUEVO_NICHO),
                "Tumulos" => GetTipoContratoPrefix(TipoContratos.NUEVO_TUMULO),
                _ => GetTipoContratoPrefix(TipoContratos.NUEVO)
            };

            prefix = $"{GetTipoContratoPrefix(TipoContratos.RENOVACION)}-{basePrefix}";
        }

        var lastContrato = _context.Contrato
            .Where(c => c.NumeroSecuencial.Contains($"-{year}-") && c.NumeroSecuencial.StartsWith(prefix))
            .OrderByDescending(c => c.Id)
            .FirstOrDefault();

        var nextNumber = lastContrato != null
            ? int.Parse(lastContrato.NumeroSecuencial.Split('-').Last()) + 1
            : 1;

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
