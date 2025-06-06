using System;
using System.ComponentModel.DataAnnotations;

namespace gad_checa_gestion_cementerio.Models;

public class DocumentoViewModel
{
    [Required]
    [Display(Name = "Archivo PDF")]
    public IFormFile Archivo { get; set; }

    public string RutaGuardada { get; set; }
}
