using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SlotBooking.EntityFrameworkCore;
using Volo.Abp.DependencyInjection;

namespace SlotBooking.DbMigrator;

public class DbMigrationService : ITransientDependency
{
    private readonly ILogger<DbMigrationService> _logger;
    private readonly SlotBookingDbContext _dbContext;

    public DbMigrationService(
        ILogger<DbMigrationService> logger,
        SlotBookingDbContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    public async Task MigrateAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting database migration...");

        var pendingMigrations = (await _dbContext.Database.GetPendingMigrationsAsync(cancellationToken)).ToList();

        if (pendingMigrations.Count == 0)
        {
            _logger.LogInformation("No pending migrations found. Database is up to date.");
        }
        else
        {
            _logger.LogInformation("Found {Count} pending migration(s): {Migrations}",
                pendingMigrations.Count,
                string.Join(", ", pendingMigrations));

            await _dbContext.Database.MigrateAsync(cancellationToken);

            _logger.LogInformation("Database migration completed successfully.");
        }

        _logger.LogInformation("Database: {Database}", _dbContext.Database.GetConnectionString());
    }
}
