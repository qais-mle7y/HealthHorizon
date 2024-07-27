using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace HealthTrackerApi.Models
{
    public class User
    {
        [Key]
        public int UserId { get; set; }
        public string Email { get; set; }
        [MaxLength(250)]
        public string Password { get; set; }
        public string Name { get; set; }

        public string Username {get; set;}
 // Navigation property
         public ICollection<Diagnosis> Diagnoses { get; set; } 
    }
}
