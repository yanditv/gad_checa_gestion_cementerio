using System;

namespace gad_checa_gestion_cementerio.Models;

public class NotifyModel
{
    public String title { get; set; } = "";
    public String description { get; set; } = "";
    public String url { get; set; } = "#";
    public String icon { get; set; } = "ti ti-bell";
    public String level { get; set; } = "info";
}
