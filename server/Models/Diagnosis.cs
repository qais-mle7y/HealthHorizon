using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthTrackerApi.Models
{
    public class Diagnosis
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int DiagnosisId { get; set; }

        public int UserId { get; set; }  // Foreign key to User

        [Required]
        public string DiagnosisName { get; set; }  // Changed from DiagnosisText to DiagnosisName

        [Required]
        public DateTime DateOfDiagnosis { get; set; }

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}
