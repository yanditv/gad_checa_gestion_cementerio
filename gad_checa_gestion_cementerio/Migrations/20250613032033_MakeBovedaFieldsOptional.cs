using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace gad_checa_gestion_cementerio.Migrations
{
    /// <inheritdoc />
    public partial class MakeBovedaFieldsOptional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Boveda_Piso_PisoId",
                table: "Boveda");

            migrationBuilder.AlterColumn<string>(
                name: "UsuarioCreadorId",
                table: "Boveda",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<int>(
                name: "PisoId",
                table: "Boveda",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_Boveda_Piso_PisoId",
                table: "Boveda",
                column: "PisoId",
                principalTable: "Piso",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Boveda_Piso_PisoId",
                table: "Boveda");

            migrationBuilder.AlterColumn<string>(
                name: "UsuarioCreadorId",
                table: "Boveda",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "PisoId",
                table: "Boveda",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Boveda_Piso_PisoId",
                table: "Boveda",
                column: "PisoId",
                principalTable: "Piso",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
