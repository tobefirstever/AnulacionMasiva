using OfficeOpenXml;
using OfficeOpenXml.Style;
using ProcesoAnulacionMasiva.Helpers;
using ProcesoAnulacionMasiva.Models;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
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

        // POST: /AnulacionMasiva/AnularExcel
        [HttpPost]
        public ActionResult AnularExcel(string selectedCsv)
        {
            var numeros = (selectedCsv ?? string.Empty)
                .Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Trim())
                .Where(s => s.Length > 0)
                .Distinct()
                .ToList();

            if (numeros.Count == 0)
                return new HttpStatusCodeResult(400, "No se recibieron órdenes para anular.");

            // Simulación del proceso en lotes
            var rnd = new Random();
            var resultados = new List<AnularManserResponseDto>(numeros.Count);

            foreach (var lote in numeros.Batch(1000))   // tamaño de lote configurable
            {
                foreach (var nro in lote)
                {
                    var ok = rnd.Next(0, 100) < 70;     // 70% éxito simulado
                    resultados.Add(new AnularManserResponseDto
                    {
                        NumeroOrden = nro,
                        Cliente = rnd.Next(100000, 999999).ToString(),
                        CodigoValidacion = ok ? 1 : 2,
                        Estado = ok ? "EXITOSO" : "ERROR",
                        Mensaje = ok ? "" : "No se puede anular: estado de la orden no válido."
                    });
                }
            }

            // Excel en archivo temporal (evita picos de memoria)
            var fileName = "AnulacionResultados_" + DateTime.Now.ToString("yyyyMMdd_HHmm") + ".xlsx";
            var tempPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N") + ".xlsx");

            using (var pkg = new ExcelPackage(new FileInfo(tempPath)))
            {
                var ws = pkg.Workbook.Worksheets.Add("Resultados");

                ws.Cells[1, 1].Value = "NumeroOrden";
                ws.Cells[1, 2].Value = "Cliente";
                ws.Cells[1, 3].Value = "CodigoValidacion";
                ws.Cells[1, 4].Value = "Estado";
                ws.Cells[1, 5].Value = "Mensaje";
                using (var h = ws.Cells[1, 1, 1, 5])
                {
                    h.Style.Font.Bold = true;
                    h.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                }

                var r = 2;
                foreach (var it in resultados)
                {
                    ws.Cells[r, 1].Value = it.NumeroOrden;
                    ws.Cells[r, 2].Value = it.Cliente;
                    ws.Cells[r, 3].Value = it.CodigoValidacion;
                    ws.Cells[r, 4].Value = it.Estado;
                    ws.Cells[r, 5].Value = it.Mensaje;
                    r++;
                }

                ws.Cells.AutoFitColumns();
                pkg.Save(); // guarda directo a disco
            }

            // Stream al navegador
            var stream = new FileStream(tempPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            const string contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            return File(stream, contentType, fileName);
        }
    }
}