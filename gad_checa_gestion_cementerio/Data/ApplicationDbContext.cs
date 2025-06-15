using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;
using gad_checa_gestion_cementerio.Models;
using gad_checa_gestion_cementerio.Areas.Identity.Data;

namespace gad_checa_gestion_cementerio.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Personalizar los nombres de las tablas
            builder.Entity<ApplicationUser>(entity =>
            {
                entity.ToTable(name: "Usuarios");
            });

            builder.Entity<IdentityRole>(entity =>
            {
                entity.ToTable(name: "Roles");
            });

            builder.Entity<IdentityUserRole<string>>(entity =>
            {
                entity.ToTable("UsuarioRoles");
            });

            builder.Entity<IdentityUserClaim<string>>(entity =>
            {
                entity.ToTable("UsuarioClaims");
            });

            builder.Entity<IdentityUserLogin<string>>(entity =>
            {
                entity.ToTable("UsuarioLogins");
            });

            builder.Entity<IdentityRoleClaim<string>>(entity =>
            {
                entity.ToTable("RoleClaims");
            });

            builder.Entity<IdentityUserToken<string>>(entity =>
            {
                entity.ToTable("UsuarioTokens");
            });
            // Configuración de las entidades
            builder.Entity<Persona>()
                .HasIndex(p => p.NumeroIdentificacion);
            //.IsUnique();
            // Configuración de la herencia (TPH - Table Per Hierarchy)
            builder.Entity<Persona>()
                .HasDiscriminator<string>("TipoPersona")
                .HasValue<Persona>("Persona")
                .HasValue<Responsable>("Responsable")
                .HasValue<Propietario>("Propietario");


            // Configuración de relaciones con ApplicationUser
            builder.Entity<Persona>()
                .HasOne<ApplicationUser>(p => p.UsuarioCreador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<Contrato>()
                .HasOne<ApplicationUser>(c => c.UsuarioCreador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);
            builder.Entity<Contrato>()
                .HasOne<ApplicationUser>(c => c.UsuarioActualizador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);
            builder.Entity<Contrato>()
                .HasOne<ApplicationUser>(c => c.UsuarioEliminador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<Difunto>()
                .HasOne<ApplicationUser>(d => d.UsuarioCreador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);
            builder.Entity<Difunto>()
                .HasOne<ApplicationUser>(d => d.UsuarioActualizador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);
            builder.Entity<Difunto>()
                .HasOne<ApplicationUser>(d => d.UsuarioEliminador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<Descuento>()
                .HasOne<ApplicationUser>(d => d.UsuarioCreador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);
            builder.Entity<Descuento>()
                .HasOne<ApplicationUser>(d => d.UsuarioActualizador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);
            builder.Entity<Descuento>()
                .HasOne<ApplicationUser>(d => d.UsuarioEliminador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<Bloque>()
                .HasOne<ApplicationUser>(s => s.UsuarioCreador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);
            builder.Entity<Bloque>()
                .HasOne<ApplicationUser>(s => s.UsuarioActualizador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);
            builder.Entity<Bloque>()
                .HasOne<ApplicationUser>(s => s.UsuarioEliminador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<Cementerio>()
                .HasOne<ApplicationUser>(c => c.UsuarioCreador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);
            builder.Entity<Cementerio>()
                .HasOne<ApplicationUser>(c => c.UsuarioActualizador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);
            builder.Entity<Cementerio>()
                .HasOne<ApplicationUser>(c => c.UsuarioEliminador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<Boveda>()
                .HasOne<ApplicationUser>(b => b.UsuarioCreador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);
            builder.Entity<Boveda>()
                .HasOne<ApplicationUser>(b => b.UsuarioActualizador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);
            builder.Entity<Boveda>()
                .HasOne<ApplicationUser>(b => b.UsuarioEliminador)
                .WithMany()
                .OnDelete(DeleteBehavior.NoAction);

            // Relación entre Contrato y Responsable
            builder.Entity<Contrato>()
                .HasMany(c => c.Responsables)
                .WithMany(r => r.Contratos)
                .UsingEntity(j => j.ToTable("ContratoResponsable"));

            builder.Entity<Cuota>()
                .HasMany(c => c.Pagos)
                .WithMany(p => p.Cuotas)
                .UsingEntity(j => j.ToTable("CuotaPago"));
        }

        // DbSets
        public DbSet<Bloque> Bloque { get; set; }
        public DbSet<Cementerio> Cementerio { get; set; }
        public DbSet<Descuento> Descuento { get; set; }
        public DbSet<Contrato> Contrato { get; set; }
        public DbSet<Cuota> Cuota { get; set; }
        public DbSet<Pago> Pago { get; set; }
        public DbSet<Difunto> Difunto { get; set; }
        public DbSet<Persona> Persona { get; set; }
        public DbSet<Boveda> Boveda { get; set; }
        public DbSet<Responsable> ContratoResponsable { get; set; }
        public DbSet<Responsable> Responsable { get; set; }
        public DbSet<Responsable> BovedaPropietario { get; set; }
        public DbSet<Propietario> Propietario { get; set; }
        public DbSet<GADInformacion> GadInformacion { get; set; }
        public DbSet<Piso> Piso { get; set; }

    }
}
