using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace gad_checa_gestion_cementerio.Migrations
{
    /// <inheritdoc />
    public partial class init_1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GadInformacion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    LogoUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Direccion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Telefono = table.Column<string>(type: "nvarchar(15)", maxLength: 15, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Website = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Mision = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Vision = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GadInformacion", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SecurityStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoleClaims_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Cementerio",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Direccion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Estado = table.Column<bool>(type: "bit", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaEliminacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UsuarioCreadorId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UsuarioActualizadorId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    UsuarioEliminadorId = table.Column<string>(type: "nvarchar(450)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cementerio", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cementerio_Usuarios_UsuarioActualizadorId",
                        column: x => x.UsuarioActualizadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Cementerio_Usuarios_UsuarioCreadorId",
                        column: x => x.UsuarioCreadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Cementerio_Usuarios_UsuarioEliminadorId",
                        column: x => x.UsuarioEliminadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Descuento",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Descripcion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Porcentaje = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    Estado = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaEliminacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UsuarioCreadorId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UsuarioActualizadorId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    UsuarioEliminadorId = table.Column<string>(type: "nvarchar(450)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Descuento", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Descuento_Usuarios_UsuarioActualizadorId",
                        column: x => x.UsuarioActualizadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Descuento_Usuarios_UsuarioCreadorId",
                        column: x => x.UsuarioCreadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Descuento_Usuarios_UsuarioEliminadorId",
                        column: x => x.UsuarioEliminadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Persona",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombres = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Apellidos = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    TipoIdentificacion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    NumeroIdentificacion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Telefono = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Direccion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Estado = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaEliminacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UsuarioCreadorId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UsuarioActualizadorId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    UsuarioEliminadorId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    TipoPersona = table.Column<string>(type: "nvarchar(13)", maxLength: 13, nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaFin = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Persona", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Persona_Usuarios_UsuarioActualizadorId",
                        column: x => x.UsuarioActualizadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Persona_Usuarios_UsuarioCreadorId",
                        column: x => x.UsuarioCreadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Persona_Usuarios_UsuarioEliminadorId",
                        column: x => x.UsuarioEliminadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UsuarioClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UsuarioClaims_Usuarios_UserId",
                        column: x => x.UserId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UsuarioLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    ProviderKey = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_UsuarioLogins_Usuarios_UserId",
                        column: x => x.UserId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UsuarioRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_UsuarioRoles_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UsuarioRoles_Usuarios_UserId",
                        column: x => x.UserId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UsuarioTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_UsuarioTokens_Usuarios_UserId",
                        column: x => x.UserId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Bloque",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Descripcion = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CalleA = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CalleB = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    NumeroDePisos = table.Column<int>(type: "int", nullable: false),
                    BovedasPorPiso = table.Column<int>(type: "int", nullable: false),
                    TarifaBase = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Estado = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaEliminacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UsuarioCreadorId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UsuarioActualizadorId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    UsuarioEliminadorId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    CementerioId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bloque", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Bloque_Cementerio_CementerioId",
                        column: x => x.CementerioId,
                        principalTable: "Cementerio",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Bloque_Usuarios_UsuarioActualizadorId",
                        column: x => x.UsuarioActualizadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Bloque_Usuarios_UsuarioCreadorId",
                        column: x => x.UsuarioCreadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Bloque_Usuarios_UsuarioEliminadorId",
                        column: x => x.UsuarioEliminadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Difunto",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FechaFallecimiento = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Estado = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaEliminacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UsuarioCreadorId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UsuarioActualizadorId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    UsuarioEliminadorId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    DescuentoId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Difunto", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Difunto_Descuento_DescuentoId",
                        column: x => x.DescuentoId,
                        principalTable: "Descuento",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Difunto_Usuarios_UsuarioActualizadorId",
                        column: x => x.UsuarioActualizadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Difunto_Usuarios_UsuarioCreadorId",
                        column: x => x.UsuarioCreadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Difunto_Usuarios_UsuarioEliminadorId",
                        column: x => x.UsuarioEliminadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Piso",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NumeroPiso = table.Column<int>(type: "int", nullable: false),
                    Precio = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BloqueId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Piso", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Piso_Bloque_BloqueId",
                        column: x => x.BloqueId,
                        principalTable: "Bloque",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Boveda",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Numero = table.Column<int>(type: "int", nullable: false),
                    Estado = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaEliminacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UsuarioCreadorId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UsuarioActualizadorId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    UsuarioEliminadorId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    PisoId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Boveda", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Boveda_Piso_PisoId",
                        column: x => x.PisoId,
                        principalTable: "Piso",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Boveda_Usuarios_UsuarioActualizadorId",
                        column: x => x.UsuarioActualizadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Boveda_Usuarios_UsuarioCreadorId",
                        column: x => x.UsuarioCreadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Boveda_Usuarios_UsuarioEliminadorId",
                        column: x => x.UsuarioEliminadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Contrato",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaFin = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NumeroDeMeses = table.Column<int>(type: "int", nullable: false),
                    MontoTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Estado = table.Column<bool>(type: "bit", nullable: false),
                    Observaciones = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaEliminacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UsuarioCreadorId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UsuarioActualizadorId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    UsuarioEliminadorId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    BovedaId = table.Column<int>(type: "int", nullable: false),
                    DifuntoId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contrato", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Contrato_Boveda_BovedaId",
                        column: x => x.BovedaId,
                        principalTable: "Boveda",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Contrato_Difunto_DifuntoId",
                        column: x => x.DifuntoId,
                        principalTable: "Difunto",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Contrato_Usuarios_UsuarioActualizadorId",
                        column: x => x.UsuarioActualizadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Contrato_Usuarios_UsuarioCreadorId",
                        column: x => x.UsuarioCreadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Contrato_Usuarios_UsuarioEliminadorId",
                        column: x => x.UsuarioEliminadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ContratoResponsable",
                columns: table => new
                {
                    ContratosId = table.Column<int>(type: "int", nullable: false),
                    ResponsablesId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContratoResponsable", x => new { x.ContratosId, x.ResponsablesId });
                    table.ForeignKey(
                        name: "FK_ContratoResponsable_Contrato_ContratosId",
                        column: x => x.ContratosId,
                        principalTable: "Contrato",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContratoResponsable_Persona_ResponsablesId",
                        column: x => x.ResponsablesId,
                        principalTable: "Persona",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Cuota",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NumeroCuota = table.Column<int>(type: "int", nullable: false),
                    Monto = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FechaVencimiento = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaPago = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Estado = table.Column<bool>(type: "bit", nullable: false),
                    ContratoId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cuota", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Cuota_Contrato_ContratoId",
                        column: x => x.ContratoId,
                        principalTable: "Contrato",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Pago",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Monto = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FechaPago = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Estado = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaEliminacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UsuarioCreadorId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UsuarioActualizadorId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    UsuarioEliminadorId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    CuotaId = table.Column<int>(type: "int", nullable: false),
                    PersonaQueRealizaPagoId = table.Column<int>(type: "int", nullable: false),
                    ContratoId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pago", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pago_Contrato_ContratoId",
                        column: x => x.ContratoId,
                        principalTable: "Contrato",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Pago_Cuota_CuotaId",
                        column: x => x.CuotaId,
                        principalTable: "Cuota",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Pago_Persona_PersonaQueRealizaPagoId",
                        column: x => x.PersonaQueRealizaPagoId,
                        principalTable: "Persona",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Pago_Usuarios_UsuarioActualizadorId",
                        column: x => x.UsuarioActualizadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Pago_Usuarios_UsuarioCreadorId",
                        column: x => x.UsuarioCreadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Pago_Usuarios_UsuarioEliminadorId",
                        column: x => x.UsuarioEliminadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bloque_CementerioId",
                table: "Bloque",
                column: "CementerioId");

            migrationBuilder.CreateIndex(
                name: "IX_Bloque_UsuarioActualizadorId",
                table: "Bloque",
                column: "UsuarioActualizadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Bloque_UsuarioCreadorId",
                table: "Bloque",
                column: "UsuarioCreadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Bloque_UsuarioEliminadorId",
                table: "Bloque",
                column: "UsuarioEliminadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Boveda_PisoId",
                table: "Boveda",
                column: "PisoId");

            migrationBuilder.CreateIndex(
                name: "IX_Boveda_UsuarioActualizadorId",
                table: "Boveda",
                column: "UsuarioActualizadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Boveda_UsuarioCreadorId",
                table: "Boveda",
                column: "UsuarioCreadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Boveda_UsuarioEliminadorId",
                table: "Boveda",
                column: "UsuarioEliminadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Cementerio_UsuarioActualizadorId",
                table: "Cementerio",
                column: "UsuarioActualizadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Cementerio_UsuarioCreadorId",
                table: "Cementerio",
                column: "UsuarioCreadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Cementerio_UsuarioEliminadorId",
                table: "Cementerio",
                column: "UsuarioEliminadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Contrato_BovedaId",
                table: "Contrato",
                column: "BovedaId");

            migrationBuilder.CreateIndex(
                name: "IX_Contrato_DifuntoId",
                table: "Contrato",
                column: "DifuntoId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Contrato_UsuarioActualizadorId",
                table: "Contrato",
                column: "UsuarioActualizadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Contrato_UsuarioCreadorId",
                table: "Contrato",
                column: "UsuarioCreadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Contrato_UsuarioEliminadorId",
                table: "Contrato",
                column: "UsuarioEliminadorId");

            migrationBuilder.CreateIndex(
                name: "IX_ContratoResponsable_ResponsablesId",
                table: "ContratoResponsable",
                column: "ResponsablesId");

            migrationBuilder.CreateIndex(
                name: "IX_Cuota_ContratoId",
                table: "Cuota",
                column: "ContratoId");

            migrationBuilder.CreateIndex(
                name: "IX_Descuento_UsuarioActualizadorId",
                table: "Descuento",
                column: "UsuarioActualizadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Descuento_UsuarioCreadorId",
                table: "Descuento",
                column: "UsuarioCreadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Descuento_UsuarioEliminadorId",
                table: "Descuento",
                column: "UsuarioEliminadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Difunto_DescuentoId",
                table: "Difunto",
                column: "DescuentoId");

            migrationBuilder.CreateIndex(
                name: "IX_Difunto_UsuarioActualizadorId",
                table: "Difunto",
                column: "UsuarioActualizadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Difunto_UsuarioCreadorId",
                table: "Difunto",
                column: "UsuarioCreadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Difunto_UsuarioEliminadorId",
                table: "Difunto",
                column: "UsuarioEliminadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Pago_ContratoId",
                table: "Pago",
                column: "ContratoId");

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

            migrationBuilder.CreateIndex(
                name: "IX_Persona_UsuarioActualizadorId",
                table: "Persona",
                column: "UsuarioActualizadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Persona_UsuarioCreadorId",
                table: "Persona",
                column: "UsuarioCreadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Persona_UsuarioEliminadorId",
                table: "Persona",
                column: "UsuarioEliminadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Piso_BloqueId",
                table: "Piso",
                column: "BloqueId");

            migrationBuilder.CreateIndex(
                name: "IX_RoleClaims_RoleId",
                table: "RoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "Roles",
                column: "NormalizedName",
                unique: true,
                filter: "[NormalizedName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioClaims_UserId",
                table: "UsuarioClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioLogins_UserId",
                table: "UsuarioLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioRoles_RoleId",
                table: "UsuarioRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "Usuarios",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "Usuarios",
                column: "NormalizedUserName",
                unique: true,
                filter: "[NormalizedUserName] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ContratoResponsable");

            migrationBuilder.DropTable(
                name: "GadInformacion");

            migrationBuilder.DropTable(
                name: "Pago");

            migrationBuilder.DropTable(
                name: "RoleClaims");

            migrationBuilder.DropTable(
                name: "UsuarioClaims");

            migrationBuilder.DropTable(
                name: "UsuarioLogins");

            migrationBuilder.DropTable(
                name: "UsuarioRoles");

            migrationBuilder.DropTable(
                name: "UsuarioTokens");

            migrationBuilder.DropTable(
                name: "Cuota");

            migrationBuilder.DropTable(
                name: "Persona");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Contrato");

            migrationBuilder.DropTable(
                name: "Boveda");

            migrationBuilder.DropTable(
                name: "Difunto");

            migrationBuilder.DropTable(
                name: "Piso");

            migrationBuilder.DropTable(
                name: "Descuento");

            migrationBuilder.DropTable(
                name: "Bloque");

            migrationBuilder.DropTable(
                name: "Cementerio");

            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}
