using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace gad_checa_gestion_cementerio.Migrations
{
    /// <inheritdoc />
    public partial class AgregarDifuntoDirectoEnBoveda : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BovedaId",
                table: "Difunto",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Difunto_BovedaId",
                table: "Difunto",
                column: "BovedaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Difunto_Boveda_BovedaId",
                table: "Difunto",
                column: "BovedaId",
                principalTable: "Boveda",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Difunto_Boveda_BovedaId",
                table: "Difunto");

            migrationBuilder.DropIndex(
                name: "IX_Difunto_BovedaId",
                table: "Difunto");

            migrationBuilder.DropColumn(
                name: "BovedaId",
                table: "Difunto");
        }
    }
}
