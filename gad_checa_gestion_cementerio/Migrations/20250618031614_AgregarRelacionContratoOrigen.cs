using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace gad_checa_gestion_cementerio.Migrations
{
    /// <inheritdoc />
    public partial class AgregarRelacionContratoOrigen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ContratoOrigenId",
                table: "Contrato",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Contrato_ContratoOrigenId",
                table: "Contrato",
                column: "ContratoOrigenId");

            migrationBuilder.AddForeignKey(
                name: "FK_Contrato_Contrato_ContratoOrigenId",
                table: "Contrato",
                column: "ContratoOrigenId",
                principalTable: "Contrato",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Contrato_Contrato_ContratoOrigenId",
                table: "Contrato");

            migrationBuilder.DropIndex(
                name: "IX_Contrato_ContratoOrigenId",
                table: "Contrato");

            migrationBuilder.DropColumn(
                name: "ContratoOrigenId",
                table: "Contrato");
        }
    }
}
