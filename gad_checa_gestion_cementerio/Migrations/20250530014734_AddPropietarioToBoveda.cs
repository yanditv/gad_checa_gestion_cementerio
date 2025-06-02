using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace gad_checa_gestion_cementerio.Migrations
{
    /// <inheritdoc />
    public partial class AddPropietarioToBoveda : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Catastro",
                table: "Persona",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Responsable_FechaFin",
                table: "Persona",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Responsable_FechaInicio",
                table: "Persona",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NumeroSecuecial",
                table: "Boveda",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PropietarioId",
                table: "Boveda",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Boveda_PropietarioId",
                table: "Boveda",
                column: "PropietarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_Boveda_Persona_PropietarioId",
                table: "Boveda",
                column: "PropietarioId",
                principalTable: "Persona",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Boveda_Persona_PropietarioId",
                table: "Boveda");

            migrationBuilder.DropIndex(
                name: "IX_Boveda_PropietarioId",
                table: "Boveda");

            migrationBuilder.DropColumn(
                name: "Catastro",
                table: "Persona");

            migrationBuilder.DropColumn(
                name: "Responsable_FechaFin",
                table: "Persona");

            migrationBuilder.DropColumn(
                name: "Responsable_FechaInicio",
                table: "Persona");

            migrationBuilder.DropColumn(
                name: "NumeroSecuecial",
                table: "Boveda");

            migrationBuilder.DropColumn(
                name: "PropietarioId",
                table: "Boveda");
        }
    }
}
