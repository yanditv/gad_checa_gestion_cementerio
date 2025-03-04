using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace gad_checa_gestion_cementerio.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDatabaseSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pago_Contrato_ContratoId",
                table: "Pago");

            migrationBuilder.DropForeignKey(
                name: "FK_Pago_Cuota_CuotaId",
                table: "Pago");

            migrationBuilder.DropForeignKey(
                name: "FK_Pago_Persona_PersonaQueRealizaPagoId",
                table: "Pago");

            migrationBuilder.DropForeignKey(
                name: "FK_Pago_Usuarios_UsuarioActualizadorId",
                table: "Pago");

            migrationBuilder.DropForeignKey(
                name: "FK_Pago_Usuarios_UsuarioCreadorId",
                table: "Pago");

            migrationBuilder.DropForeignKey(
                name: "FK_Pago_Usuarios_UsuarioEliminadorId",
                table: "Pago");

            migrationBuilder.DropIndex(
                name: "IX_Pago_CuotaId",
                table: "Pago");

            migrationBuilder.DropIndex(
                name: "IX_Pago_PersonaQueRealizaPagoId",
                table: "Pago");

            migrationBuilder.DropIndex(
                name: "IX_Pago_UsuarioActualizadorId",
                table: "Pago");

            migrationBuilder.DropIndex(
                name: "IX_Pago_UsuarioCreadorId",
                table: "Pago");

            migrationBuilder.DropIndex(
                name: "IX_Pago_UsuarioEliminadorId",
                table: "Pago");

            migrationBuilder.DropColumn(
                name: "CuotaId",
                table: "Pago");

            migrationBuilder.DropColumn(
                name: "Estado",
                table: "Pago");

            migrationBuilder.DropColumn(
                name: "FechaActualizacion",
                table: "Pago");

            migrationBuilder.DropColumn(
                name: "FechaCreacion",
                table: "Pago");

            migrationBuilder.DropColumn(
                name: "FechaEliminacion",
                table: "Pago");

            migrationBuilder.DropColumn(
                name: "UsuarioActualizadorId",
                table: "Pago");

            migrationBuilder.DropColumn(
                name: "UsuarioCreadorId",
                table: "Pago");

            migrationBuilder.DropColumn(
                name: "UsuarioEliminadorId",
                table: "Pago");

            migrationBuilder.DropColumn(
                name: "FechaPago",
                table: "Cuota");

            migrationBuilder.DropColumn(
                name: "NumeroCuota",
                table: "Cuota");

            migrationBuilder.RenameColumn(
                name: "PersonaQueRealizaPagoId",
                table: "Pago",
                newName: "PersonaPagoId");

            migrationBuilder.RenameColumn(
                name: "ContratoId",
                table: "Pago",
                newName: "PersonaId");

            migrationBuilder.RenameIndex(
                name: "IX_Pago_ContratoId",
                table: "Pago",
                newName: "IX_Pago_PersonaId");

            migrationBuilder.RenameColumn(
                name: "Nombre",
                table: "Difunto",
                newName: "Nombres");

            migrationBuilder.RenameColumn(
                name: "Estado",
                table: "Cuota",
                newName: "Pagada");

            migrationBuilder.AddColumn<string>(
                name: "NumeroComprobante",
                table: "Pago",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TipoPago",
                table: "Pago",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Apellidos",
                table: "Difunto",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaNacimiento",
                table: "Difunto",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "NumeroIdentificacion",
                table: "Difunto",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "EsRenovacion",
                table: "Contrato",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "NumeroSecuencial",
                table: "Contrato",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "CuotaPago",
                columns: table => new
                {
                    CuotasId = table.Column<int>(type: "int", nullable: false),
                    PagosId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuotaPago", x => new { x.CuotasId, x.PagosId });
                    table.ForeignKey(
                        name: "FK_CuotaPago_Cuota_CuotasId",
                        column: x => x.CuotasId,
                        principalTable: "Cuota",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CuotaPago_Pago_PagosId",
                        column: x => x.PagosId,
                        principalTable: "Pago",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CuotaPago_PagosId",
                table: "CuotaPago",
                column: "PagosId");

            migrationBuilder.AddForeignKey(
                name: "FK_Pago_Persona_PersonaId",
                table: "Pago",
                column: "PersonaId",
                principalTable: "Persona",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pago_Persona_PersonaId",
                table: "Pago");

            migrationBuilder.DropTable(
                name: "CuotaPago");

            migrationBuilder.DropColumn(
                name: "NumeroComprobante",
                table: "Pago");

            migrationBuilder.DropColumn(
                name: "TipoPago",
                table: "Pago");

            migrationBuilder.DropColumn(
                name: "Apellidos",
                table: "Difunto");

            migrationBuilder.DropColumn(
                name: "FechaNacimiento",
                table: "Difunto");

            migrationBuilder.DropColumn(
                name: "NumeroIdentificacion",
                table: "Difunto");

            migrationBuilder.DropColumn(
                name: "EsRenovacion",
                table: "Contrato");

            migrationBuilder.DropColumn(
                name: "NumeroSecuencial",
                table: "Contrato");

            migrationBuilder.RenameColumn(
                name: "PersonaPagoId",
                table: "Pago",
                newName: "PersonaQueRealizaPagoId");

            migrationBuilder.RenameColumn(
                name: "PersonaId",
                table: "Pago",
                newName: "ContratoId");

            migrationBuilder.RenameIndex(
                name: "IX_Pago_PersonaId",
                table: "Pago",
                newName: "IX_Pago_ContratoId");

            migrationBuilder.RenameColumn(
                name: "Nombres",
                table: "Difunto",
                newName: "Nombre");

            migrationBuilder.RenameColumn(
                name: "Pagada",
                table: "Cuota",
                newName: "Estado");

            migrationBuilder.AddColumn<int>(
                name: "CuotaId",
                table: "Pago",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "Estado",
                table: "Pago",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaActualizacion",
                table: "Pago",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaCreacion",
                table: "Pago",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaEliminacion",
                table: "Pago",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UsuarioActualizadorId",
                table: "Pago",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UsuarioCreadorId",
                table: "Pago",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UsuarioEliminadorId",
                table: "Pago",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaPago",
                table: "Cuota",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NumeroCuota",
                table: "Cuota",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Pago_CuotaId",
                table: "Pago",
                column: "CuotaId");

            migrationBuilder.CreateIndex(
                name: "IX_Pago_PersonaQueRealizaPagoId",
                table: "Pago",
                column: "PersonaQueRealizaPagoId");

            migrationBuilder.CreateIndex(
                name: "IX_Pago_UsuarioActualizadorId",
                table: "Pago",
                column: "UsuarioActualizadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Pago_UsuarioCreadorId",
                table: "Pago",
                column: "UsuarioCreadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Pago_UsuarioEliminadorId",
                table: "Pago",
                column: "UsuarioEliminadorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Pago_Contrato_ContratoId",
                table: "Pago",
                column: "ContratoId",
                principalTable: "Contrato",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Pago_Cuota_CuotaId",
                table: "Pago",
                column: "CuotaId",
                principalTable: "Cuota",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Pago_Persona_PersonaQueRealizaPagoId",
                table: "Pago",
                column: "PersonaQueRealizaPagoId",
                principalTable: "Persona",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Pago_Usuarios_UsuarioActualizadorId",
                table: "Pago",
                column: "UsuarioActualizadorId",
                principalTable: "Usuarios",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Pago_Usuarios_UsuarioCreadorId",
                table: "Pago",
                column: "UsuarioCreadorId",
                principalTable: "Usuarios",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Pago_Usuarios_UsuarioEliminadorId",
                table: "Pago",
                column: "UsuarioEliminadorId",
                principalTable: "Usuarios",
                principalColumn: "Id");
        }
    }
}
