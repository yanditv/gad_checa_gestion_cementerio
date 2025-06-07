using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace gad_checa_gestion_cementerio.Migrations
{
    /// <inheritdoc />
    public partial class persona_propietario_relation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Persona_NumeroIdentificacion",
                table: "Persona",
                column: "NumeroIdentificacion",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Persona_NumeroIdentificacion",
                table: "Persona");
        }
    }
}
