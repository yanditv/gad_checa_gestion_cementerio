using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace gad_checa_gestion_cementerio.Migrations
{
    /// <inheritdoc />
    public partial class AgregarContratoRelacionado : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ContratoRelacionadoId",
                table: "Contrato",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Contrato_ContratoRelacionadoId",
                table: "Contrato",
                column: "ContratoRelacionadoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Contrato_Contrato_ContratoRelacionadoId",
                table: "Contrato",
                column: "ContratoRelacionadoId",
                principalTable: "Contrato",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Contrato_Contrato_ContratoRelacionadoId",
                table: "Contrato");

            migrationBuilder.DropIndex(
                name: "IX_Contrato_ContratoRelacionadoId",
                table: "Contrato");

            migrationBuilder.DropColumn(
                name: "ContratoRelacionadoId",
                table: "Contrato");
        }
    }
}
