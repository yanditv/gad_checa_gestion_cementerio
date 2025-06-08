using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace gad_checa_gestion_cementerio.Migrations
{
    /// <inheritdoc />
    public partial class tarifas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "tarifa_arriendo_nicho",
                table: "Cementerio",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "tarifa_arriendo_nicho",
                table: "Cementerio");
        }
    }
}
