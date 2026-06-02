using SlotBooking.EntityFrameworkCore;
using Volo.Abp.Autofac;
using Volo.Abp.Modularity;

namespace SlotBooking.DbMigrator;

[DependsOn(
    typeof(AbpAutofacModule),
    typeof(SlotBookingEntityFrameworkCoreModule))]
public class DbMigratorModule : AbpModule
{
}
