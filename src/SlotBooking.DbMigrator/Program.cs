using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Serilog;
using Serilog.Events;
using SlotBooking.DbMigrator;
using Volo.Abp;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Volo.Abp", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("Logs/migrations-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{
    Log.Information("=== SlotBooking DbMigrator ===");

    using var application = await AbpApplicationFactory.CreateAsync<DbMigratorModule>(options =>
    {
        options.Services.AddLogging(logging => logging.AddSerilog());

        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false)
            .AddEnvironmentVariables()
            .Build();

        options.Services.ReplaceConfiguration(configuration);
    });

    await application.InitializeAsync();

    var migrationService = application.ServiceProvider.GetRequiredService<DbMigrationService>();
    await migrationService.MigrateAsync();

    Log.Information("Migration completed successfully.");
    return 0;
}
catch (Exception ex)
{
    Log.Fatal(ex, "Migration failed.");
    return 1;
}
finally
{
    Log.CloseAndFlush();
}
