using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace SlotBooking.EntityFrameworkCore;

public class SlotBookingDbContextFactory : IDesignTimeDbContextFactory<SlotBookingDbContext>
{
    public SlotBookingDbContext CreateDbContext(string[] args)
    {
        var configuration = BuildConfiguration();
        var builder = new DbContextOptionsBuilder<SlotBookingDbContext>()
            .UseSqlServer(configuration.GetConnectionString("Default"));

        return new SlotBookingDbContext(builder.Options);
    }

    private static IConfigurationRoot BuildConfiguration()
    {
        var builder = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), "../SlotBooking.HttpApi.Host/"))
            .AddJsonFile("appsettings.json", optional: false);

        return builder.Build();
    }
}
