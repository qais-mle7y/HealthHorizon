using Microsoft.AspNetCore.Mvc;
using BookingAPI.Models;
using System.Collections.Generic;

namespace BookingAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClinicsController : ControllerBase
    {
        [HttpGet("{booking}")]
        public ActionResult<IEnumerable<Clinic>> GetClinics()
        {
            var clinics = new List<Clinic>
            {
                new Clinic { Id = 1, Name = "Clinic A", Latitude = 40.712776, Longitude = -74.005974 },
                new Clinic { Id = 2, Name = "Clinic B", Latitude = 34.052235, Longitude = -118.243683 },
                new Clinic { Id = 3, Name = "Clinic C", Latitude = 41.878113, Longitude = -87.629799 }
            };

            return Ok(clinics);
        }
    }
}
