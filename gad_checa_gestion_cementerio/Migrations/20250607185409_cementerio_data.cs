using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace gad_checa_gestion_cementerio.Migrations
{
    /// <inheritdoc />
    public partial class cementerio_data : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AniosArriendoBovedas",
                table: "Cementerio",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "AniosArriendoNicho",
                table: "Cementerio",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Cementerio",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Presidente",
                table: "Cementerio",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Telefono",
                table: "Cementerio",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VecesRenovacionBovedas",
                table: "Cementerio",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "VecesRenovacionNicho",
                table: "Cementerio",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AniosArriendoBovedas",
                table: "Cementerio");

            migrationBuilder.DropColumn(
                name: "AniosArriendoNicho",
                table: "Cementerio");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Cementerio");

            migrationBuilder.DropColumn(
                name: "Presidente",
                table: "Cementerio");

            migrationBuilder.DropColumn(
                name: "Telefono",
                table: "Cementerio");

            migrationBuilder.DropColumn(
                name: "VecesRenovacionBovedas",
                table: "Cementerio");

            migrationBuilder.DropColumn(
                name: "VecesRenovacionNicho",
                table: "Cementerio");
        }
    }
}
