using ProcesoAnulacionMasiva.Models;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ProcesoAnulacionMasiva.Controllers
{
    public class AnulacionMasivaController : Controller
    {
        // GET: /AnulacionMasiva
        public ActionResult Index()
        {
            return View();
        }

        // POST: /AnulacionMasiva/Buscar
        [HttpPost]
        public JsonResult Buscar(string estado, string rolCreador, string fechaInicio, string fechaFin)
        {
    
            var rnd = new Random(1710);
            var baseDate = new DateTime(2025, 01, 01);
            var estados = new[] { "Requerimiento", "Devuelto" };

   
            var dummy = Enumerable.Range(1, 40).Select(i =>
            {
                var est = estados[i % 2];
                var fecha = baseDate.AddDays(i);
                var rol = (i % 3 == 0) ? "ADM" : (i % 3 == 1) ? "OPR" : "USR";

                return new
                {
                    Orden = new OrdenDto
                    {
                        NumeroOrden = (3450000 + i).ToString(CultureInfo.InvariantCulture),
                        TipoOrden = "MANSER",
                        NumeroCliente = rnd.Next(100000, 999999).ToString(CultureInfo.InvariantCulture)
                    },
                    Estado = est,
                    RolCreador = rol,
                    Fecha = fecha
                };
            });

            // ---- Filtros (opcionales) ----
            if (!string.IsNullOrWhiteSpace(estado) && estado != "Todos")
                dummy = dummy.Where(x => x.Estado.Equals(estado, StringComparison.OrdinalIgnoreCase));

            if (!string.IsNullOrWhiteSpace(rolCreador))
                dummy = dummy.Where(x => x.RolCreador.IndexOf(rolCreador, StringComparison.OrdinalIgnoreCase) >= 0);

            DateTime fi, ff;
            if (DateTime.TryParse(fechaInicio, out fi))
                dummy = dummy.Where(x => x.Fecha.Date >= fi.Date);

            if (DateTime.TryParse(fechaFin, out ff))
                dummy = dummy.Where(x => x.Fecha.Date <= ff.Date);

            var resultado = dummy.Select(x => x.Orden).ToList();

            // DataTables no necesita un envoltorio especial si le pasamos "data" manualmente en JS.
            return Json(new { ok = true, data = resultado }, JsonRequestBehavior.DenyGet);
        }

        // POST: /AnulacionMasiva/Anular
      
        [HttpPost]
        public JsonResult Anular(List<string> numerosOrden)
        {
       
            return Json(new { ok = true, totalSeleccionadas = (numerosOrden ?? new List<string>()).Count });
        }
    }
}