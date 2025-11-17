using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ProcesoAnulacionMasiva.Models
{
    public class ValidacionItem
    {
        public int Row { get; set; }
        public string NumeroOrden { get; set; }
        public string Error { get; set; }  // vacío si ok
    }
}