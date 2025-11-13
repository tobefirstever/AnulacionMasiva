using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ProcesoAnulacionMasiva.Models
{
    public class AnularManserResponseDto
    {
        public string NumeroOrden { get; set; }
        public string Cliente { get; set; }
        public int CodigoValidacion { get; set; }  
        public string Estado { get; set; }        
        public string Mensaje { get; set; }      
    }
}