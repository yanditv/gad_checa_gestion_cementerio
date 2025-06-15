using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace gad_checa_gestion_cementerio.Migrations
{
    /// <inheritdoc />
    public partial class databse : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Persona_NumeroIdentificacion",
                table: "Persona");

            migrationBuilder.CreateIndex(
                name: "IX_Persona_NumeroIdentificacion",
                table: "Persona",
                column: "NumeroIdentificacion");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Persona_NumeroIdentificacion",
                table: "Persona");

            migrationBuilder.CreateIndex(
                name: "IX_Persona_NumeroIdentificacion",
                table: "Persona",
                column: "NumeroIdentificacion",
                unique: true);
        }
    }
}
