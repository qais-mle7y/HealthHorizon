using Microsoft.EntityFrameworkCore;
using HealthTrackerApi.Models;

namespace HealthTrackerApi.Data
{
    public class HealthTrackerContext : DbContext
    {
        public HealthTrackerContext(DbContextOptions<HealthTrackerContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Diagnosis> Diagnoses { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.UserId);
                entity.Property(e => e.UserId).HasColumnName("USER_ID");
                entity.Property(e => e.Name).IsRequired();
                entity.Property(e => e.Username).IsRequired();
                entity.Property(e => e.Email).IsRequired();
                entity.Property(e => e.Password).IsRequired();
                entity.HasMany(e => e.Diagnoses)
                      .WithOne()
                      .HasForeignKey(d => d.UserId)
                      .HasConstraintName("FK_Diagnosis_Users");
            });

            modelBuilder.Entity<Diagnosis>(entity =>
            {
                entity.HasKey(e => e.DiagnosisId);
                entity.Property(e => e.DiagnosisId).HasColumnName("DIAGNOSIS_ID");
                entity.Property(e => e.UserId).HasColumnName("USER_ID");
                entity.Property(e => e.DiagnosisName).IsRequired();
                entity.Property(e => e.DateOfDiagnosis).IsRequired();
                entity.Property(e => e.Latitude);
                entity.Property(e => e.Longitude);
            });
        }
    }
}
