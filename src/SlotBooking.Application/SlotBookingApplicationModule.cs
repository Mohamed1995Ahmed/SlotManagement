using Volo.Abp.Application;
using Volo.Abp.Modularity;

namespace SlotBooking;

[DependsOn(
    typeof(AbpDddApplicationModule),
    typeof(SlotBookingDomainModule),
    typeof(SlotBookingApplicationContractsModule))]
public class SlotBookingApplicationModule : AbpModule
{
}
