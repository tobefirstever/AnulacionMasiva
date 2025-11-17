using OfficeOpenXml;
using ProcesoAnulacionMasiva.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ProcesoAnulacionMasiva.Controllers
{
    public class ValidarExcelController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }





        [HttpPost]
        public ActionResult Validar(HttpPostedFileBase archivoExcel)
        {
            var r = new ValidacionResponse { ok = false, items = new List<ValidacionItem>() };

            try
            {
                if (archivoExcel == null || archivoExcel.ContentLength == 0)
                {
                    r.message = "Adjunta un archivo .xlsx.";
                    return Json(r, JsonRequestBehavior.AllowGet);
                }

                var ext = System.IO.Path.GetExtension(archivoExcel.FileName).ToLowerInvariant();
                if (ext != ".xlsx")
                {
                    r.message = "Formato inválido. Solo se acepta .xlsx";
                    return Json(r, JsonRequestBehavior.AllowGet);
                }

                using (var pkg = new ExcelPackage(archivoExcel.InputStream))
                {
                    var ws = pkg.Workbook.Worksheets.FirstOrDefault();
                    if (ws == null)
                    {
                        r.message = "El archivo no tiene hojas.";
                        return Json(r, JsonRequestBehavior.AllowGet);
                    }

                    // Encabezado esperado en A1: "NumeroOrden"
                    var header = (ws.Cells[1, 1].Value ?? string.Empty).ToString().Trim();
                    if (!header.Equals("NumeroOrden", StringComparison.OrdinalIgnoreCase))
                    {
                        r.message = "Encabezado inválido. La celda A1 debe ser 'NumeroOrden'.";
                        return Json(r, JsonRequestBehavior.AllowGet);
                    }

                    var lastRow = ws.Dimension == null ? 1 : ws.Dimension.End.Row;
                    for (int row = 2; row <= lastRow; row++)
                    {
                        string valor = (ws.Cells[row, 1].Value ?? string.Empty).ToString().Trim();
                        if (string.IsNullOrEmpty(valor))
                        {
                            // fila vacía → la omitimos silenciosamente
                            continue;
                        }

                        var item = new ValidacionItem
                        {
                            Row = row,
                            NumeroOrden = valor,
                            Error = ""
                        };

                        // Validaciones ejemplo (ajusta a tu negocio)
                        // - solo dígitos
                        // - longitud 6–10
                        if (!valor.All(char.IsDigit))
                            item.Error = "Debe contener solo dígitos.";
                        else if (valor.Length < 6 || valor.Length > 10)
                            item.Error = "Longitud inválida (6-10).";

                        r.items.Add(item);
                    }
                }

                r.total = r.items.Count;
                r.conErrores = r.items.Count(x => !string.IsNullOrEmpty(x.Error));
                r.ok = true;
                r.message = r.conErrores == 0
                    ? "Validación exitosa."
                    : "Validación con observaciones.";
                return Json(r, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                r.message = "Error al procesar el archivo: " + ex.Message;
                return Json(r, JsonRequestBehavior.AllowGet);
            }
        }
    }
}