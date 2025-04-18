using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace gad_checa_gestion_cementerio.Migrations
{
    /// <inheritdoc />
    public partial class PrimeraMigracion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Persona_Usuarios_UsuarioActualizadorId",
                table: "Persona");

            migrationBuilder.DropForeignKey(
                name: "FK_Persona_Usuarios_UsuarioEliminadorId",
                table: "Persona");

            migrationBuilder.DropIndex(
                name: "IX_Persona_UsuarioActualizadorId",
                table: "Persona");

            migrationBuilder.DropIndex(
                name: "IX_Persona_UsuarioEliminadorId",
                table: "Persona");

            migrationBuilder.DropColumn(
                name: "FechaActualizacion",
                table: "Persona");

            migrationBuilder.DropColumn(
                name: "FechaEliminacion",
                table: "Persona");

            migrationBuilder.DropColumn(
                name: "UsuarioActualizadorId",
                table: "Persona");

            migrationBuilder.DropColumn(
                name: "UsuarioEliminadorId",
                table: "Persona");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FechaActualizacion",
                table: "Persona",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaEliminacion",
                table: "Persona",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UsuarioActualizadorId",
                table: "Persona",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UsuarioEliminadorId",
                table: "Persona",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Persona_UsuarioActualizadorId",
                table: "Persona",
                column: "UsuarioActualizadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Persona_UsuarioEliminadorId",
                table: "Persona",
                column: "UsuarioEliminadorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Persona_Usuarios_UsuarioActualizadorId",
                table: "Persona",
                column: "UsuarioActualizadorId",
                principalTable: "Usuarios",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Persona_Usuarios_UsuarioEliminadorId",
                table: "Persona",
                column: "UsuarioEliminadorId",
                principalTable: "Usuarios",
                principalColumn: "Id");
        }
    }
}
