using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ProcesoAnulacionMasiva.Models
{
    public class ValidacionResponse
    {
        public bool ok { get; set; }
        public int total { get; set; }
        public int conErrores { get; set; }
        public List<ValidacionItem> items { get; set; }
        public string message { get; set; }
    }
}