[assembly: HostingStartup(typeof(gad_checa_gestion_cementerio.Areas.Identity.IdentityHostingStartup))]
namespace gad_checa_gestion_cementerio.Areas.Identity
{
    public class IdentityHostingStartup : IHostingStartup
    {
        public void Configure(IWebHostBuilder builder)
        {
            builder.ConfigureServices((context, services) =>
            {
                services.AddRazorPages(options =>
                {
                    options.Conventions.AddAreaPageRoute("Identity", "/Account/Login", "auth/login");
                    options.Conventions.AddAreaPageRoute("Identity", "/Account/Manage/Index", "account/manage");

                    // Deshabilitar el registro público
                    options.Conventions.AuthorizeAreaPage("Identity", "/Account/Register");
                });
            });
        }
    }
}
