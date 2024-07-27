using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using HealthTrackerApi.Data;
using HealthTrackerApi.Models;
using Newtonsoft.Json;

namespace HealthTrackerApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DiagnosisController : ControllerBase
    {
        private readonly HealthTrackerContext _context;

        public DiagnosisController(HealthTrackerContext context)
        {
            _context = context;
        }

        // GET: api/Diagnosis
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Diagnosis>>> GetDiagnoses()
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            var userName = HttpContext.Session.GetString("UserName");

            if (userId == null)
            {
                return Unauthorized("User not logged in.");
            }

            // Retrieve diagnoses for the logged-in user
            var diagnoses = await _context.Diagnoses
                .Where(d => d.UserId == userId)
                .ToListAsync();

            return diagnoses;
        }

        // GET: api/Diagnosis/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Diagnosis>> GetDiagnosis(int id)
        {
            var diagnosis = await _context.Diagnoses.FindAsync(id);

            if (diagnosis == null)
            {
                return NotFound();
            }

            return diagnosis;
        }

        // POST: api/Diagnosis
        [HttpPost]
        public async Task<ActionResult<Diagnosis>> PostDiagnosis([FromBody] Diagnosis diagnosis)
        {
            // For testing purposes, we use the UserId from the request body directly
            // var userId = HttpContext.Session.GetInt32("UserId");
            // if (userId == null)
            // {
            //     return Unauthorized("User not logged in.");
            // }

            // diagnosis.UserId = userId.Value; // Assign the logged-in user ID to the diagnosis

            _context.Diagnoses.Add(diagnosis);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetDiagnosis", new { id = diagnosis.DiagnosisId }, diagnosis);
        }

        // PUT: api/Diagnosis/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDiagnosis(int id, Diagnosis diagnosis)
        {
            if (id != diagnosis.DiagnosisId)
            {
                return BadRequest();
            }

            _context.Entry(diagnosis).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DiagnosisExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Diagnosis/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDiagnosis(int id)
        {
            var diagnosis = await _context.Diagnoses.FindAsync(id);
            if (diagnosis == null)
            {
                return NotFound();
            }

            _context.Diagnoses.Remove(diagnosis);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool DiagnosisExists(int id)
        {
            return _context.Diagnoses.Any(e => e.DiagnosisId == id);
        }

        [HttpGet("heatmap")]
        public async Task<ActionResult<IEnumerable<HeatmapData>>> GetHeatmapData([FromQuery] string disease)
        {
            if (string.IsNullOrEmpty(disease))
            {
                return BadRequest("Disease parameter is required.");
            }

            var heatmapData = await _context.Diagnoses
                .Where(d => d.DiagnosisName == disease)
                .GroupBy(d => new { d.Latitude, d.Longitude })
                .Select(g => new HeatmapData
                {
                    Latitude = g.Key.Latitude.Value,
                    Longitude = g.Key.Longitude.Value,
                    Count = g.Select(d => d.UserId).Distinct().Count()
                })
                .ToListAsync();

            return Ok(heatmapData);
        }


        public class HeatmapData
        {
            public double Latitude { get; set; }
            public double Longitude { get; set; }
            public int Count { get; set; }
        }
    }
}
