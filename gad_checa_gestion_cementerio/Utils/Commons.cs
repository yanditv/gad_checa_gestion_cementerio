namespace gad_checa_gestion_cementerio.Utils;

public class Commons
{
    public static DateTime getFechaInicial(DateTime? fecha)
    {
        return fecha?.Date ?? DateTime.Now.Date;
    }
    public static DateTime getFechaFinal(DateTime? fecha)
    {
        return fecha?.Date.AddDays(1).AddTicks(-1) ?? DateTime.Now.Date.AddDays(1).AddTicks(-1);
    }
}
