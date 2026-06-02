using Microsoft.EntityFrameworkCore;
using Serilog;
using Serilog.Events;
using SlotBooking;
using SlotBooking.EntityFrameworkCore;
using Volo.Abp;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Async(c => c.Console())
    .CreateLogger();

try
{
    Log.Information("Starting SlotBooking.HttpApi.Host.");
    var builder = WebApplication.CreateBuilder(args);
    builder.Host.AddAppSettingsSecretsJson()
        .UseAutofac()
        .UseSerilog();

    await builder.AddApplicationAsync<SlotBookingHttpApiHostModule>();

    var app = builder.Build();
    await app.InitializeApplicationAsync();

    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<SlotBookingDbContext>();
        await dbContext.Database.MigrateAsync();
    }

    app.UseAbpRequestLocalization();
    app.UseCorrelationId();
    app.UseStaticFiles();
    app.UseRouting();
    app.UseCors();
    app.UseSwagger();
    app.UseAbpSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "SlotBooking API");
    });
    app.UseAuditing();
    app.UseAbpSerilogEnrichers();
    app.UseConfiguredEndpoints();

    await app.RunAsync();
    return 0;
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly.");
    return 1;
}
finally
{
    Log.CloseAndFlush();
}
