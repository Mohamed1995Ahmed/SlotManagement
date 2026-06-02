using Microsoft.Extensions.DependencyInjection;
using SlotBooking.EntityFrameworkCore.Slots;
using SlotBooking.Slots;
using Volo.Abp.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore.SqlServer;
using Volo.Abp.Modularity;

namespace SlotBooking.EntityFrameworkCore;

[DependsOn(
    typeof(SlotBookingDomainModule),
    typeof(AbpEntityFrameworkCoreSqlServerModule))]
public class SlotBookingEntityFrameworkCoreModule : AbpModule
{
    public override void ConfigureServices(ServiceConfigurationContext context)
    {
        context.Services.AddAbpDbContext<SlotBookingDbContext>(options =>
        {
            options.AddRepository<Slot, SlotRepository>();
        });

        Configure<AbpDbContextOptions>(options =>
        {
            options.UseSqlServer();
        });
    }
}
