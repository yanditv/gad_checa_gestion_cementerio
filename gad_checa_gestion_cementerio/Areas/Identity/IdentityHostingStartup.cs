using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder;

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
                    options.Conventions.AddAreaPageRoute("Identity", "/Account/Register", "auth/register");
                    options.Conventions.AddAreaPageRoute("Identity", "/Account/Manage/Index", "account/manage");
                });
            });
        }
    }
}
