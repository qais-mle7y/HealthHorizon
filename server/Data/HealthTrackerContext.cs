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

        public async Task CreateDeleteOldDiagnosesProcedureAsync()
        {
            string createProcedureSql = @"
                CREATE PROCEDURE DeleteOldDiagnoses
                AS
                BEGIN
                    -- HIV-AIDS: retain for 10 years
                    DELETE FROM Diagnoses WHERE DiagnosisName = 'HIV-AIDS' AND DateOfDiagnosis < DATEADD(YEAR, -10, GETDATE());

                    -- Tuberculosis: retain for 6 months
                    DELETE FROM Diagnoses WHERE DiagnosisName = 'Tuberculosis' AND DateOfDiagnosis < DATEADD(MONTH, -6, GETDATE());

                    -- Malaria: retain for 6 days
                    DELETE FROM Diagnoses WHERE DiagnosisName = 'Malaria' AND DateOfDiagnosis < DATEADD(DAY, -6, GETDATE());

                    -- COVID-19: retain for 2 weeks
                    DELETE FROM Diagnoses WHERE DiagnosisName = 'COVID-19' AND DateOfDiagnosis < DATEADD(DAY, -14, GETDATE());

                    -- Cholera: retain for 1 week
                    DELETE FROM Diagnoses WHERE DiagnosisName = 'Cholera' AND DateOfDiagnosis < DATEADD(DAY, -7, GETDATE());

                    -- Ebola: retain for 3 weeks
                    DELETE FROM Diagnoses WHERE DiagnosisName = 'Ebola' AND DateOfDiagnosis < DATEADD(DAY, -21, GETDATE());

                    -- Zika: retain for 1 week
                    DELETE FROM Diagnoses WHERE DiagnosisName = 'Zika' AND DateOfDiagnosis < DATEADD(DAY, -7, GETDATE());

                    -- Measles, Mumps, Rubella: retain for 2 weeks
                    DELETE FROM Diagnoses WHERE DiagnosisName IN ('Measles', 'Mumps', 'Rubella') AND DateOfDiagnosis < DATEADD(DAY, -14, GETDATE());

                    -- Hepatitis A: retain for 3 months
                    DELETE FROM Diagnoses WHERE DiagnosisName = 'Hepatitis A' AND DateOfDiagnosis < DATEADD(MONTH, -3, GETDATE());

                    -- Hepatitis B and C: retain for 10 years
                    DELETE FROM Diagnoses WHERE DiagnosisName IN ('Hepatitis B', 'Hepatitis C') AND DateOfDiagnosis < DATEADD(YEAR, -10, GETDATE());

                    -- Dengue, Yellow Fever: retain for 2 weeks
                    DELETE FROM Diagnoses WHERE DiagnosisName IN ('Dengue', 'Yellow Fever') AND DateOfDiagnosis < DATEADD(DAY, -14, GETDATE());

                    -- Polio: retain for 6 months
                    DELETE FROM Diagnoses WHERE DiagnosisName = 'Polio' AND DateOfDiagnosis < DATEADD(MONTH, -6, GETDATE());

                    -- Default case for 'Other' diagnoses: retain for 1 month
                    DELETE FROM Diagnoses WHERE DiagnosisName = 'Other' AND DateOfDiagnosis < DATEADD(MONTH, -1, GETDATE());
                END;
            ";

            await Database.ExecuteSqlRawAsync(createProcedureSql);
        }
    }
}
