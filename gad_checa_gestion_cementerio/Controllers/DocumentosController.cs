using System;
using gad_checa_gestion_cementerio.Models;
using Microsoft.AspNetCore.Mvc;

namespace gad_checa_gestion_cementerio.Controllers;

public class DocumentosController : Controller
{
    private readonly IWebHostEnvironment _env;

    public DocumentosController(IWebHostEnvironment env)
    {
        _env = env;
    }

    [HttpGet]
    public IActionResult Subir()
    {
        return View();
    }

    [HttpPost]
    public async Task<IActionResult> Subir(DocumentoViewModel modelo)
    {
        if (modelo.Archivo == null || modelo.Archivo.Length == 0)
        {
            TempData["Error"] = "Debe seleccionar un archivo válido.";
            return RedirectToAction("Subir");
        }
        // Limitar tamaño: 2 MB = 2 * 1024 * 1024 bytes
        if (modelo.Archivo.Length > 2 * 1024 * 1024)
        {
            TempData["Error"] = "El archivo no debe superar los 2 MB.";
            return RedirectToAction("Subir");
        }

        if (!modelo.Archivo.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            TempData["Error"] = "Solo se permiten archivos PDF.";
            return RedirectToAction("Subir");
        }
        var carpetaDestino = Path.Combine(_env.WebRootPath, "documentos");
        if (!Directory.Exists(carpetaDestino))
            Directory.CreateDirectory(carpetaDestino);

        var nombreArchivo = Guid.NewGuid() + Path.GetExtension(modelo.Archivo.FileName);
        var rutaCompleta = Path.Combine(carpetaDestino, nombreArchivo);

        using (var stream = new FileStream(rutaCompleta, FileMode.Create))
        {
            await modelo.Archivo.CopyToAsync(stream);
        }

        var rutaRelativa = $"/documentos/{nombreArchivo}";

        // Aquí puedes guardar en la BD si deseas

        TempData["RutaGuardada"] = rutaRelativa;
        TempData["Success"] = "Archivo subido exitosamente.";

        // 🔁 Redirige a GET para evitar el reenvío en recarga
        return RedirectToAction("Subir");
    }

}
