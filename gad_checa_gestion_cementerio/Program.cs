using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using gad_checa_gestion_cementerio.Data;
using System.Globalization;
using gad_checa_gestion_cementerio.Utils;

var builder = WebApplication.CreateBuilder(args);


// Configurar la sesións
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// Configurar servicios y opciones
builder.Services.AddAutoMapper(typeof(MappingProfile));

// Agregar servicios al contenedor.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Agregar la administración de roles

builder.Services.AddDefaultIdentity<IdentityUser>(options => options.SignIn.RequireConfirmedAccount = true)
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

// Añadir servicios de localización
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

builder.Services.AddControllersWithViews().AddViewLocalization()
            .AddDataAnnotationsLocalization();

builder.Services.AddRazorPages(); // Necesario para las páginas de identidad predeterminadas.

var app = builder.Build();




// Configurar la localización
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


// Configurar el pipeline de solicitudes HTTP.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();
app.UseSession();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=index}/{id?}"); // Ruta personalizada

app.MapRazorPages(); // Esto es necesario para las páginas de identidad predeterminadas.

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var userManager = services.GetRequiredService<UserManager<IdentityUser>>();
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
    var dbContext = services.GetRequiredService<ApplicationDbContext>();

    // Crear roles si no existen
    string[] roleNames = { "Admin", "User" };
    foreach (var roleName in roleNames)
    {
        if (!await roleManager.RoleExistsAsync(roleName))
        {
            await roleManager.CreateAsync(new IdentityRole(roleName));
        }
    }

    // Crear usuario y asignarle un rol
    var adminUser = await userManager.FindByEmailAsync("admin@example.com");
    if (adminUser == null)
    {
        adminUser = new IdentityUser()
        {
            UserName = "admin@example.com",
            Email = "admin@example.com",
            EmailConfirmed = true,
            LockoutEnabled = false
        };
        var result = await userManager.CreateAsync(adminUser, "Admin@123456");
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }
        else
        {
            // Manejar errores de creación del usuario
            foreach (var error in result.Errors)
            {
                Console.WriteLine(error.Description);
            }
        }
    }
    else
    {
        // Asignar el rol si el usuario ya existe
        if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }
    }

    // Crear empresa si no existe
    var empresa = await dbContext.GadInformacion.FirstOrDefaultAsync(e => e.Nombre == "GAD CHECA");
    if (empresa == null)
    {
        empresa = new GADInformacion
        {
            Nombre = "Empresa Ejemplo",
            Direccion = "Dirección Ejemplo",
            Telefono = "123456789",
            Email = "",
            LogoUrl = "",
            Website = "",
            Mision = "",
            Vision = ""
        };
        dbContext.GadInformacion.Add(empresa);
        await dbContext.SaveChangesAsync();
    }

    // Crear cementerio si no existe
    var cementerio = await dbContext.Cementerio.FirstOrDefaultAsync(c => c.Nombre == "Cementerio Ejemplo");
    if (cementerio == null)
    {
        cementerio = new Cementerio
        {
            Nombre = "Cementerio Ejemplo",
            Direccion = "Dirección Ejemplo",
            Estado = true,
            FechaCreacion = DateTime.Now,
            UsuarioCreador = adminUser
        };
        dbContext.Cementerio.Add(cementerio);
        await dbContext.SaveChangesAsync();
    }
    // Crear descuentos si no existen
    var descuentos = await dbContext.Descuento.ToListAsync();
    if (descuentos.Count == 0)
    {
        var descuento1 = new Descuento
        {
            Descripcion = "Ninguno",
            Porcentaje = 0,
            Estado = true,
            FechaCreacion = DateTime.Now,
            UsuarioCreador = adminUser
        };
        var descuento2 = new Descuento
        {
            Descripcion = "20%",
            Porcentaje = 20,
            Estado = true,
            FechaCreacion = DateTime.Now,
            UsuarioCreador = adminUser
        };
        var descuento3 = new Descuento
        {
            Descripcion = "30%",
            Porcentaje = 30,
            Estado = true,
            FechaCreacion = DateTime.Now,
            UsuarioCreador = adminUser
        };
        dbContext.Descuento.AddRange(descuento1, descuento2, descuento3);
        await dbContext.SaveChangesAsync();
    }
}
app.Run();
