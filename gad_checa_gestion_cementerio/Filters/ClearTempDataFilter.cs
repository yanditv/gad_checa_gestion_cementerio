using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace gad_checa_gestion_cementerio.Filters
{
    /// <summary>
    /// Filtro para limpiar automáticamente los mensajes de TempData después de cada acción
    /// para evitar que se persistan entre vistas diferentes
    /// </summary>
    public class ClearTempDataFilter : ActionFilterAttribute
    {
        public override void OnActionExecuted(ActionExecutedContext context)
        {
            // Solo limpiar en peticiones GET que renderizan vistas
            if (context.HttpContext.Request.Method == "GET" &&
                context.Result is ViewResult)
            {
                var controller = context.Controller as Controller;
                if (controller != null)
                {
                    // Lista de claves de TempData que deben ser limpiadas automáticamente
                    var keysToClean = new[] {
                        "Success", "SuccessMessage",
                        "Error", "ErrorMessage",
                        "Warning", "WarningMessage",
                        "Info", "InfoMessage"
                    };

                    // Marcar las claves para limpieza en la siguiente petición
                    // si no se han consumido en esta vista
                    foreach (var key in keysToClean)
                    {
                        if (controller.TempData.ContainsKey(key))
                        {
                            // Peek para verificar si el valor existe sin consumirlo
                            var value = controller.TempData.Peek(key);
                            if (value != null)
                            {
                                // Marcar para limpieza automática
                                controller.TempData[$"_AutoClean_{key}"] = true;
                            }
                        }
                    }
                }
            }

            base.OnActionExecuted(context);
        }

        public override void OnActionExecuting(ActionExecutingContext context)
        {
            // Limpiar mensajes marcados para auto-limpieza de la petición anterior
            var controller = context.Controller as Controller;
            if (controller != null)
            {
                var keysToRemove = new List<string>();

                foreach (var key in controller.TempData.Keys.ToList())
                {
                    if (key.StartsWith("_AutoClean_"))
                    {
                        var originalKey = key.Substring("_AutoClean_".Length);
                        keysToRemove.Add(originalKey);
                        keysToRemove.Add(key); // También remover la marca de limpieza
                    }
                }

                foreach (var key in keysToRemove)
                {
                    controller.TempData.Remove(key);
                }
            }

            base.OnActionExecuting(context);
        }
    }
}
