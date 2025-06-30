using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using gad_checa_gestion_cementerio.Data;
using System.Globalization;
using gad_checa_gestion_cementerio.Utils;
using DotNetEnv;
using gad_checa_gestion_cementerio.services;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using gad_checa_gestion_cementerio.Areas.Identity.Data;
using Microsoft.AspNetCore.Identity.UI.Services;
using gad_checa_gestion_cementerio.Services;

// Cargar variables de entorno
DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Configurar la cultura para usar dólares
var cultureInfo = new System.Globalization.CultureInfo("en-US");
System.Globalization.CultureInfo.DefaultThreadCurrentCulture = cultureInfo;
System.Globalization.CultureInfo.DefaultThreadCurrentUICulture = cultureInfo;

// Configuración de Data Protection
var dataProtectionPath = builder.Environment.IsDevelopment()
    ? Path.Combine(Directory.GetCurrentDirectory(), "data-protection-keys")
    : "/app/keys";

if (builder.Environment.IsDevelopment())
{
    Directory.CreateDirectory(dataProtectionPath);
}

// Configurar Data Protection con manejo de errores
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionPath))
    .SetApplicationName("CementerioApp")
    .SetDefaultKeyLifetime(TimeSpan.FromDays(90));

// Configuración de la base de datos
var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
    ?? throw new InvalidOperationException("Connection string 'DB_CONNECTION_STRING' not found.");

// Configuración de QuestPDF con manejo de errores
try
{
    QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

    // Habilitar debugging para facilitar la identificación de problemas de layout
    QuestPDF.Settings.EnableDebugging = true;

    var logger = LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger<Program>();
    logger.LogInformation("QuestPDF license configured successfully with debugging enabled");
}
catch (Exception ex)
{
    var logger = LoggerFactory.Create(builder => builder.AddConsole()).CreateLogger<Program>();
    logger.LogError(ex, "Error configuring QuestPDF: {Message}", ex.Message);

    // En producción, podríamos continuar sin PDF o lanzar la excepción
    if (args.Contains("--environment=Production"))
    {
        logger.LogWarning("Continuing without QuestPDF in production mode");
    }
    else
    {
        throw;
    }
}

// Configuración de sesión
builder.Services.AddSession(options =>
{
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.Name = "CementerioApp.Session";
});

// Configuración de servicios
builder.Services.AddAutoMapper(typeof(MappingProfile));
builder.Services.AddScoped<ContratoService>();
builder.Services.AddScoped<gad_checa_gestion_cementerio.Services.IPdfService, gad_checa_gestion_cementerio.Services.PdfService>();

// Configuración de MVC con áreas
builder.Services.AddControllersWithViews()
    .AddRazorOptions(options =>
    {
        options.AreaViewLocationFormats.Clear();
        options.AreaViewLocationFormats.Add("/Areas/{2}/Views/{1}/{0}.cshtml");
        options.AreaViewLocationFormats.Add("/Areas/{2}/Views/Shared/{0}.cshtml");
        options.AreaViewLocationFormats.Add("/Views/Shared/{0}.cshtml");
    });

// Registrar área Admin
gad_checa_gestion_cementerio.Areas.Admin.AdminAreaRegistration.ConfigureServices(builder.Services);

// Configuración de Entity Framework
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
    }));

// Configuración de Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.SignIn.RequireConfirmedAccount = false;
    options.SignIn.RequireConfirmedEmail = false;
    options.SignIn.RequireConfirmedPhoneNumber = false;
    options.Tokens.AuthenticatorTokenProvider = null;
    options.User.RequireUniqueEmail = true;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    options.Lockout.AllowedForNewUsers = false;
    options.Tokens.PasswordResetTokenProvider = TokenOptions.DefaultProvider;
    // Desactivar 2FA
    options.Tokens.ChangePhoneNumberTokenProvider = TokenOptions.DefaultProvider;
})
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders()
    .AddErrorDescriber<SpanishIdentityErrorDescriber>();

// Registrar el servicio de envío de correos
builder.Services.AddTransient<IEmailSender, EmailSender>();

// Configuración de cookies de autenticación
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "CementerioApp.Auth";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.SlidingExpiration = true;
    options.ExpireTimeSpan = TimeSpan.FromDays(7);
    options.LoginPath = "/auth/login";
    options.LogoutPath = "/auth/logout";
    options.AccessDeniedPath = "/auth/access-denied";
});

// Configuración de localización
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");
builder.Services.AddControllersWithViews()
    .AddViewLocalization()
    .AddDataAnnotationsLocalization();

builder.Services.AddRazorPages();

var app = builder.Build();

// Configuración de culturas soportadas
var supportedCultures = new List<CultureInfo>
{
    new CultureInfo("es-ES"),
    new CultureInfo("en-US")
};

var localizationOptions = new RequestLocalizationOptions
{
    DefaultRequestCulture = new Microsoft.AspNetCore.Localization.RequestCulture("es-ES"),
    SupportedCultures = supportedCultures,
    SupportedUICultures = supportedCultures
};

app.UseRequestLocalization(localizationOptions);

// Configuración de headers reenviados
var forwardedHeadersOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost
};
app.UseForwardedHeaders(forwardedHeadersOptions);

// Middleware pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}
else
{
    app.UseDeveloperExceptionPage();
}

// Middleware personalizado para capturar errores de QuestPDF y otros
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();

        // Log detallado de cualquier error
        logger.LogError(ex, "Error en la ruta: {Path}. Método: {Method}. Mensaje: {Message}",
            context.Request.Path, context.Request.Method, ex.Message);

        // Log específico para errores de QuestPDF
        if (ex.Message.Contains("QuestPDF") || ex.StackTrace?.Contains("QuestPDF") == true)
        {
            logger.LogError(ex, "Error específico de QuestPDF detectado en la ruta: {Path}. " +
                "Verifique que la licencia esté configurada correctamente y que QuestPDF esté disponible.",
                context.Request.Path);
        }

        // Log específico para errores de archivos
        if (ex is FileNotFoundException || ex is DirectoryNotFoundException ||
            ex.Message.Contains("logo") || ex.Message.Contains("file"))
        {
            logger.LogError(ex, "Error relacionado con archivos en la ruta: {Path}. " +
                "Verifique que todos los archivos necesarios estén disponibles.",
                context.Request.Path);
        }

        // Re-throw para que el middleware de manejo de errores lo procese
        throw;
    }
});

app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseSession();

// Configuración de rutas
app.MapControllerRoute(
    name: "areas",
    pattern: "{area:exists}/{controller=Home}/{action=Index}/{id?}");

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapRazorPages();

// Inicialización de datos
await InitializeData(app);

// Configuración de Rotativa
try
{
    var rotativaPath = Path.Combine(app.Environment.WebRootPath, "Rotativa");
    if (!Directory.Exists(rotativaPath))
    {
        Directory.CreateDirectory(rotativaPath);
    }
    Rotativa.AspNetCore.RotativaConfiguration.Setup(app.Environment.WebRootPath, "Rotativa");
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogWarning(ex, "Error configuring Rotativa. PDF generation may not work.");
}

app.Run();

// Método para inicializar datos
async Task InitializeData(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;

    try
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        var logger = services.GetRequiredService<ILogger<Program>>();

        // Verificar si la base de datos existe y aplicar migraciones
        logger.LogInformation("Verificando conexión a la base de datos...");

        try
        {
            if (!await dbContext.Database.CanConnectAsync())
            {
                logger.LogInformation("La base de datos no existe. Creando y aplicando migraciones...");
                await dbContext.Database.MigrateAsync();
            }
            else
            {
                logger.LogInformation("La base de datos ya existe. Aplicando migraciones pendientes...");
                await dbContext.Database.MigrateAsync();
            }

            logger.LogInformation("Migraciones aplicadas exitosamente.");
        }
        catch (Exception migrationEx)
        {
            logger.LogError(migrationEx, "Error crítico al aplicar migraciones. La aplicación no puede continuar sin las tablas de base de datos.");
            throw;
        }

        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        // Crear roles después de que las migraciones se hayan aplicado exitosamente
        await CreateRoles(services);

        // Crear usuario admin
        await CreateAdminUser(services);

        // Crear datos iniciales
        await CreateInitialData(dbContext, userManager);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while initializing the database.");
        throw;
    }
}

static async Task CreateRoles(IServiceProvider serviceProvider)
{
    var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
    var dbContext = serviceProvider.GetRequiredService<ApplicationDbContext>();

    try
    {
        // Verificar que las tablas de Identity existan
        logger.LogInformation("Verificando que las tablas de Identity existan...");

        // Intentar hacer una consulta simple para verificar que la tabla Roles existe
        var rolesCount = await dbContext.Database.ExecuteSqlRawAsync("SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AspNetRoles'");

        logger.LogInformation("Tablas de Identity verificadas correctamente.");

        // Crear rol Admin si no existe
        if (!await roleManager.RoleExistsAsync("Admin"))
        {
            await roleManager.CreateAsync(new IdentityRole("Admin"));
            logger.LogInformation("Rol Admin creado exitosamente");
        }

        // Crear rol Usuario si no existe
        if (!await roleManager.RoleExistsAsync("Usuario"))
        {
            await roleManager.CreateAsync(new IdentityRole("Usuario"));
            logger.LogInformation("Rol Usuario creado exitosamente");
        }

        // Crear rol Administrador si no existe
        if (!await roleManager.RoleExistsAsync("Administrador"))
        {
            await roleManager.CreateAsync(new IdentityRole("Administrador"));
            logger.LogInformation("Rol Administrador creado exitosamente");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error al crear roles. Esto puede indicar que las migraciones de Identity no se aplicaron correctamente.");
        throw;
    }
}

static async Task CreateAdminUser(IServiceProvider serviceProvider)
{
    var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var logger = serviceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        // Buscar el usuario administrador
        var adminUser = await userManager.FindByEmailAsync("admin@teobu.com");

        if (adminUser == null)
        {
            // Crear el usuario administrador
            adminUser = new ApplicationUser
            {
                UserName = "admin@teobu.com",
                Email = "admin@teobu.com",
                EmailConfirmed = true,
                Nombres = "Administrador",
                Apellidos = "Sistema",
                PhoneNumber = string.Empty,
                PhoneNumberConfirmed = false,
                TwoFactorEnabled = false,
                LockoutEnabled = true,
                AccessFailedCount = 0
            };

            var result = await userManager.CreateAsync(adminUser, "Admin123!");
            if (result.Succeeded)
            {
                logger.LogInformation("Usuario administrador creado exitosamente");
            }
            else
            {
                logger.LogError("Error al crear el usuario administrador: {0}", string.Join(", ", result.Errors.Select(e => e.Description)));
                return;
            }
        }

        // Asignar el rol Administrador al usuario
        if (!await userManager.IsInRoleAsync(adminUser, "Administrador"))
        {
            var result = await userManager.AddToRoleAsync(adminUser, "Administrador");
            if (result.Succeeded)
            {
                logger.LogInformation("Rol Administrador asignado al usuario administrador exitosamente");
            }
            else
            {
                logger.LogError("Error al asignar el rol Administrador: {0}", string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error al crear el usuario administrador.");
        throw;
    }
}

async Task CreateInitialData(ApplicationDbContext dbContext, UserManager<ApplicationUser> userManager)
{
    // Crear empresa si no existe
    var empresa = await dbContext.GadInformacion.FirstOrDefaultAsync(e => e.Nombre == "GAD CHECA");
    if (empresa == null)
    {
        empresa = new GADInformacion
        {
            Nombre = "GAD CHECA",
            Direccion = "Eloy Riera, Parroquia Checa",
            Telefono = "0987654321",
            Email = "",
            LogoUrl = "",
            Website = "",
            Mision = "",
            Vision = ""
        };
        dbContext.GadInformacion.Add(empresa);
    }

    // Crear cementerio si no existe
    var cementerio = await dbContext.Cementerio.FirstOrDefaultAsync();
    if (cementerio == null)
    {
        var adminUser = await userManager.FindByEmailAsync("admin@teobu.com");
        if (adminUser == null)
        {
            throw new InvalidOperationException("No se encontró el usuario administrador. Asegúrese de que el usuario admin@teobu.com existe.");
        }
        cementerio = new Cementerio
        {
            Nombre = "Cementerio de checa",
            Direccion = "Eloy Riera, Parroquia Checa",
            AbreviaturaTituloPresidente = "Sr.",
            Email = "jpcheca0@gmail.com",
            Telefono = "0987654321",
            Presidente = "Bolívar Robles Iñamagua",
            VecesRenovacionNicho = 1,
            VecesRenovacionBovedas = 1,
            AniosArriendoNicho = 5,
            AniosArriendoBovedas = 5,
            tarifa_arriendo = 240.00m,
            tarifa_arriendo_nicho = 240.00m,
            UsuarioCreadorId = adminUser.Id,
            FechaActualizacion = DateTime.Now,
            Estado = true,
            FechaCreacion = DateTime.Now,
            UsuarioCreador = adminUser
        };
        dbContext.Cementerio.Add(cementerio);
    }

    // Crear descuentos si no existen
    var descuentos = await dbContext.Descuento.ToListAsync();
    if (!descuentos.Any())
    {
        var adminUser = await userManager.FindByEmailAsync("admin@teobu.com");
        if (adminUser == null)
        {
            throw new InvalidOperationException("No se encontró el usuario administrador. Asegúrese de que el usuario admin@teobu.com existe.");
        }
        var descuentosIniciales = new[]
        {
            new Descuento { Descripcion = "Ninguno", Porcentaje = 0, Estado = true, FechaCreacion = DateTime.Now, UsuarioCreador = adminUser },
            new Descuento { Descripcion = "50%", Porcentaje = 50, Estado = true, FechaCreacion = DateTime.Now, UsuarioCreador = adminUser },
            new Descuento { Descripcion = "100%", Porcentaje = 100, Estado = true, FechaCreacion = DateTime.Now, UsuarioCreador = adminUser }
        };
        dbContext.Descuento.AddRange(descuentosIniciales);
    }

    await dbContext.SaveChangesAsync();
}
