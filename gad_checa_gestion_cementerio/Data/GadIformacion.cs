namespace gad_checa_gestion_cementerio.Data
{
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;

    public class GADInformacion
    {
        [Key]
        public int Id { get; set; }  // La propiedad 'Id' es la clave primaria

        [Required]
        [MaxLength(200)]
        public string Nombre { get; set; }  // Nombre del GAD Parroquial (campo obligatorio)

        [MaxLength(500)]
        public string LogoUrl { get; set; }  // URL donde se encuentra el logo, con un límite de longitud

        [MaxLength(500)]
        public string Direccion { get; set; }  // Dirección del GAD Parroquial

        [MaxLength(15)]
        public string Telefono { get; set; }  // Teléfono de contacto, limitando su longitud

        [MaxLength(100)]
        [EmailAddress]
        public string Email { get; set; }  // Correo electrónico, se valida si es un correo electrónico válido

        [MaxLength(100)]
        [Url]
        public string Website { get; set; }  // Página web del GAD, se valida como una URL

        [MaxLength(1000)]
        public string Mision { get; set; }  // Misión institucional

        [MaxLength(1000)]
        public string Vision { get; set; }  // Visión institucional

    }

}
