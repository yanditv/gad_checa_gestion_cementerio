using System.Globalization;

namespace gad_checa_gestion_cementerio.Utils
{
    public static class CurrencyHelper
    {
        private static readonly CultureInfo UsCulture = new CultureInfo("en-US");

        public static string FormatCurrency(decimal amount)
        {
            return amount.ToString("C", UsCulture);
        }

        public static string FormatCurrency(decimal? amount)
        {
            if (!amount.HasValue)
                return "$0.00";
            return amount.Value.ToString("C", UsCulture);
        }
    }
}