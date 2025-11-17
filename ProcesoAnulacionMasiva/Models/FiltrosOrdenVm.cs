using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ProcesoAnulacionMasiva.Models
{
    public class FiltrosOrdenVm
    {
        public string Estado { get; set; }     
        public string RolCreador { get; set; }
        public string FechaInicio { get; set; } 
        public string FechaFin { get; set; }   
    }
}